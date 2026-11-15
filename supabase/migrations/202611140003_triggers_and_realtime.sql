-- Migration 0003: Trigger Otomatis, RPC Login NIM/NIP, dan Supabase Realtime

-- ============================================================================
-- 1. HELPER UPDATED_AT
-- ============================================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger trg_schedule_items_updated_at
  before update on public.schedule_items
  for each row execute function public.touch_updated_at();

create trigger trg_notif_pref_updated_at
  before update on public.notification_preferences
  for each row execute function public.touch_updated_at();

create trigger trg_nav_pref_updated_at
  before update on public.nav_preferences
  for each row execute function public.touch_updated_at();

create trigger trg_tickets_updated_at
  before update on public.tickets
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 2. RPC RESOLVE NIM/NIP -> EMAIL UNTUK LOGIN
-- ============================================================================

create or replace function public.resolve_login_email(p_nim_nip text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.profiles where nim_nip = trim(p_nim_nip) limit 1;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- ============================================================================
-- 3. OTOMATIS BUAT PREFERENSI DEFAULT SAAT PROFILE DIBUAT
-- ============================================================================

create or replace function public.handle_new_profile_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_default_slots text[];
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  v_default_slots := array['jadwal', 'pembelajaran', 'chat'];
  insert into public.nav_preferences (user_id, slots)
  values (new.id, v_default_slots)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger trg_profile_defaults
  after insert on public.profiles
  for each row execute function public.handle_new_profile_defaults();

-- ============================================================================
-- 4. Trigger Notifikasi Otomatis
-- ============================================================================

-- 4a. Perubahan Jadwal / Ruangan / Pembatalan (SCHEDULE_CHANGED, ROOM_CHANGED, CLASS_CANCELLED)
create or replace function public.notify_on_schedule_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course record;
  v_schedule record;
  v_notif_type text;
  v_priority text;
  v_title text;
  v_body text;
  v_new_status text;
  v_class_room_id uuid;
begin
  select si.*, c.id as c_id, c.name as course_name, c.class_id
  into v_schedule
  from public.schedule_items si
  join public.courses c on c.id = si.course_id
  where si.id = new.schedule_item_id;

  if new.field = 'room' then
    v_notif_type := 'ROOM_CHANGED';
    v_priority := 'urgent';
    v_title := 'Ruangan Kuliah Berubah';
    v_body := format('%s: %s → %s', v_schedule.course_name, new.old_value, new.new_value);
    v_new_status := 'changed';
    update public.schedule_items set room = new.new_value, status = 'changed' where id = new.schedule_item_id;
  elsif new.field = 'cancel' then
    v_notif_type := 'CLASS_CANCELLED';
    v_priority := 'high';
    v_title := 'Pertemuan Dibatalkan';
    v_body := format('%s (%s)', v_schedule.course_name, coalesce(new.reason, 'Pertemuan ditiadakan'));
    v_new_status := 'cancelled';
    update public.schedule_items set status = 'cancelled' where id = new.schedule_item_id;
  else
    v_notif_type := 'SCHEDULE_CHANGED';
    v_priority := 'high';
    v_title := 'Jadwal Kuliah Berubah';
    v_body := format('%s: %s → %s', v_schedule.course_name, new.old_value, new.new_value);
    v_new_status := 'changed';
    update public.schedule_items set status = 'changed' where id = new.schedule_item_id;
  end if;

  insert into public.app_notifications (user_id, category, type, priority, title, body, deep_link, meta)
  select
    ce.student_id,
    'SCHEDULE',
    v_notif_type,
    v_priority,
    v_title,
    v_body,
    format('/schedule/%s', new.schedule_item_id),
    jsonb_build_object('oldValue', new.old_value, 'newValue', new.new_value, 'field', new.field, 'courseId', v_schedule.c_id)
  from public.course_enrollments ce
  where ce.course_id = v_schedule.c_id;

  -- Jika dosen memilih siarkan ke Room Chat Kelas
  if new.broadcast_to_chat then
    select id into v_class_room_id
    from public.chat_rooms
    where type = 'class' and class_id = v_schedule.class_id
    limit 1;

    if v_class_room_id is not null then
      insert into public.chat_messages (room_id, sender_id, text, is_announcement)
      values (
        v_class_room_id,
        new.changed_by,
        format('[Perubahan Jadwal] %s: %s → %s.%s',
          v_schedule.course_name,
          new.old_value,
          new.new_value,
          case when new.reason is not null and new.reason <> '' then ' Alasan: ' || new.reason else '' end
        ),
        true
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_notify_schedule_change
  after insert on public.schedule_changes
  for each row execute function public.notify_on_schedule_change();

-- 4b. Upload Materi Baru (MATERIAL_UPLOADED)
create or replace function public.notify_on_material_uploaded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_name text;
begin
  if not new.notify_students then
    return new;
  end if;

  select name into v_course_name from public.courses where id = new.course_id;

  insert into public.app_notifications (user_id, category, type, priority, title, body, deep_link, meta)
  select
    ce.student_id,
    'LEARNING',
    'MATERIAL_UPLOADED',
    'low',
    'Materi Baru Diunggah',
    format('%s: Pertemuan %s - %s', v_course_name, new.meeting, new.title),
    format('/learning/%s/material/%s', new.course_id, new.id),
    jsonb_build_object('courseId', new.course_id, 'materialId', new.id)
  from public.course_enrollments ce
  where ce.course_id = new.course_id;

  return new;
end;
$$;

create trigger trg_notify_material_uploaded
  after insert on public.materials
  for each row execute function public.notify_on_material_uploaded();

-- 4c. Tugas Baru (ASSIGNMENT_NEW) & Tugas Dinilai (ASSIGNMENT_GRADED)
create or replace function public.notify_on_assignment_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_name text;
begin
  select name into v_course_name from public.courses where id = new.course_id;

  insert into public.app_notifications (user_id, category, type, priority, title, body, deep_link, meta)
  select
    ce.student_id,
    'ASSIGNMENT',
    'ASSIGNMENT_NEW',
    'normal',
    'Tugas Baru Tersedia',
    format('%s: %s', v_course_name, new.title),
    format('/learning/%s/assignment/%s', new.course_id, new.id),
    jsonb_build_object('courseId', new.course_id, 'assignmentId', new.id)
  from public.course_enrollments ce
  where ce.course_id = new.course_id;

  return new;
end;
$$;

create trigger trg_notify_assignment_created
  after insert on public.assignments
  for each row execute function public.notify_on_assignment_created();

create or replace function public.notify_on_submission_graded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment record;
begin
  if new.status = 'graded' and (old.status is distinct from 'graded' or old.score is distinct from new.score) then
    select a.id, a.course_id, a.title into v_assignment
    from public.assignments a where a.id = new.assignment_id;

    insert into public.app_notifications (user_id, category, type, priority, title, body, deep_link, meta)
    values (
      new.student_id,
      'ASSIGNMENT',
      'ASSIGNMENT_GRADED',
      'normal',
      'Tugas Telah Dinilai',
      format('%s — Nilai: %s/100', v_assignment.title, coalesce(new.score::text, '-')),
      format('/learning/%s/assignment/%s', v_assignment.course_id, v_assignment.id),
      jsonb_build_object('assignmentId', v_assignment.id, 'score', new.score)
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_submission_graded
  after update on public.submissions
  for each row execute function public.notify_on_submission_graded();

-- 4d. Pengumuman & Mention di Room Chat (CHAT_ANNOUNCEMENT, CHAT_MENTION)
create or replace function public.notify_on_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_name text;
  v_sender_name text;
begin
  select name into v_room_name from public.chat_rooms where id = new.room_id;
  select name into v_sender_name from public.profiles where id = new.sender_id;

  if new.is_announcement then
    insert into public.app_notifications (user_id, category, type, priority, title, body, deep_link, meta)
    select
      m.user_id,
      'CHAT',
      'CHAT_ANNOUNCEMENT',
      'high',
      format('Pengumuman di %s', v_room_name),
      format('%s: %s', v_sender_name, left(coalesce(new.text, 'Lampiran baru'), 120)),
      format('/chat/%s', new.room_id),
      jsonb_build_object('roomId', new.room_id, 'messageId', new.id)
    from public.chat_room_members m
    where m.room_id = new.room_id and m.user_id <> new.sender_id;
  elsif array_length(new.mentions, 1) > 0 then
    insert into public.app_notifications (user_id, category, type, priority, title, body, deep_link, meta)
    select
      u_id,
      'CHAT',
      'CHAT_MENTION',
      'normal',
      format('Anda disebut di %s', v_room_name),
      format('%s: %s', v_sender_name, left(coalesce(new.text, ''), 120)),
      format('/chat/%s', new.room_id),
      jsonb_build_object('roomId', new.room_id, 'messageId', new.id)
    from unnest(new.mentions) as u_id
    where u_id <> new.sender_id;
  end if;

  return new;
end;
$$;

create trigger trg_notify_chat_message
  after insert on public.chat_messages
  for each row execute function public.notify_on_chat_message();

-- 4e. Perubahan Status Tiket (TICKET_STATUS_CHANGED)
create or replace function public.notify_on_ticket_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null and new.status is distinct from old.status then
    insert into public.app_notifications (user_id, category, type, priority, title, body, deep_link, meta)
    values (
      new.user_id,
      'SUPPORT',
      'TICKET_STATUS_CHANGED',
      'normal',
      format('Status Tiket %s Diperbarui', new.code),
      format('%s → %s', new.title, new.status),
      format('/support/ticket/%s', new.id),
      jsonb_build_object('ticketId', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_ticket_status
  after update on public.tickets
  for each row execute function public.notify_on_ticket_status_change();

-- ============================================================================
-- 5. SUPABASE REALTIME PUBLICATION
-- ============================================================================

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.chat_messages;
    alter publication supabase_realtime add table public.app_notifications;
    alter publication supabase_realtime add table public.ticket_messages;
  end if;
end $$;
