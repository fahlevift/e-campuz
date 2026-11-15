-- Migration 0002: Row Level Security (RLS) & Storage Buckets
-- Prinsip: setiap tabel publik wajib mengaktifkan RLS dengan kebijakan berbasis peran.

-- ============================================================================
-- 1. HELPER FUNCTIONS UNTUK KEBIJAKAN RLS
-- ============================================================================

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_course_lecturer(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.course_lecturers
    where course_id = p_course_id and lecturer_id = auth.uid()
  );
$$;

create or replace function public.is_course_participant(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.course_enrollments
    where course_id = p_course_id and student_id = auth.uid()
  ) or public.is_course_lecturer(p_course_id);
$$;

create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_room_members
    where room_id = p_room_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_room_admin(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_room_members
    where room_id = p_room_id and user_id = auth.uid() and is_admin = true
  );
$$;

-- ============================================================================
-- 2. AKTIFKAN RLS DI SEMUA TABEL
-- ============================================================================

alter table public.classes enable row level security;
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_lecturers enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.schedule_items enable row level security;
alter table public.schedule_changes enable row level security;
alter table public.materials enable row level security;
alter table public.material_reads enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.app_notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.nav_preferences enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_room_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_reports enable row level security;
alter table public.bills enable row level security;
alter table public.faqs enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.campus_announcements enable row level security;

-- ============================================================================
-- 3. POLICIES
-- ============================================================================

-- classes & profiles
create policy "Authenticated users can read classes"
  on public.classes for select to authenticated using (true);

create policy "Authenticated users can read profiles"
  on public.profiles for select to authenticated using (true);

create policy "Users can update own avatar only"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- courses, lecturers, enrollments
create policy "Authenticated users can read courses"
  on public.courses for select to authenticated using (true);

create policy "Authenticated users can read course lecturers"
  on public.course_lecturers for select to authenticated using (true);

create policy "Participants can read enrollments"
  on public.course_enrollments for select to authenticated
  using (student_id = auth.uid() or public.is_course_lecturer(course_id));

-- schedule_items & schedule_changes
create policy "Participants can read schedule"
  on public.schedule_items for select to authenticated
  using (public.is_course_participant(course_id));

create policy "Course lecturers can manage schedule"
  on public.schedule_items for all to authenticated
  using (public.is_course_lecturer(course_id))
  with check (public.is_course_lecturer(course_id));

create policy "Participants can read schedule changes"
  on public.schedule_changes for select to authenticated
  using (
    exists (
      select 1 from public.schedule_items si
      where si.id = schedule_item_id and public.is_course_participant(si.course_id)
    )
  );

create policy "Course lecturers can insert schedule changes"
  on public.schedule_changes for insert to authenticated
  with check (
    changed_by = auth.uid() and
    exists (
      select 1 from public.schedule_items si
      where si.id = schedule_item_id and public.is_course_lecturer(si.course_id)
    )
  );

-- materials & material_reads
create policy "Participants can read materials"
  on public.materials for select to authenticated
  using (public.is_course_participant(course_id));

create policy "Course lecturers can manage materials"
  on public.materials for all to authenticated
  using (public.is_course_lecturer(course_id))
  with check (public.is_course_lecturer(course_id) and uploaded_by = auth.uid());

create policy "Users manage own material read markers"
  on public.material_reads for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- assignments & submissions
create policy "Participants can read assignments"
  on public.assignments for select to authenticated
  using (public.is_course_participant(course_id));

create policy "Course lecturers can manage assignments"
  on public.assignments for all to authenticated
  using (public.is_course_lecturer(course_id))
  with check (public.is_course_lecturer(course_id) and created_by = auth.uid());

create policy "Students read own submissions, lecturers read course submissions"
  on public.submissions for select to authenticated
  using (
    student_id = auth.uid() or
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.is_course_lecturer(a.course_id)
    )
  );

create policy "Enrolled students can submit own assignment"
  on public.submissions for insert to authenticated
  with check (
    student_id = auth.uid() and
    exists (
      select 1 from public.assignments a
      join public.course_enrollments ce on ce.course_id = a.course_id
      where a.id = assignment_id and ce.student_id = auth.uid()
    )
  );

create policy "Students can update ungraded submission, lecturers can grade"
  on public.submissions for update to authenticated
  using (
    (student_id = auth.uid() and status <> 'graded') or
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.is_course_lecturer(a.course_id)
    )
  );

-- app_notifications, notification_preferences, nav_preferences
create policy "Users read and update own notifications"
  on public.app_notifications for select to authenticated
  using (user_id = auth.uid());

create policy "Users mark own notifications read or delete"
  on public.app_notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own notifications"
  on public.app_notifications for delete to authenticated
  using (user_id = auth.uid());

create policy "Users manage own notification preferences"
  on public.notification_preferences for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage own nav preferences"
  on public.nav_preferences for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- chat_rooms, chat_room_members, chat_messages, chat_reports
create policy "Room members can read rooms"
  on public.chat_rooms for select to authenticated
  using (public.is_room_member(id));

create policy "Room admins can update pinned message"
  on public.chat_rooms for update to authenticated
  using (public.is_room_admin(id))
  with check (public.is_room_admin(id));

create policy "Room members can view member list"
  on public.chat_room_members for select to authenticated
  using (public.is_room_member(room_id));

create policy "Users can update own mute or last_read"
  on public.chat_room_members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Room members can read messages"
  on public.chat_messages for select to authenticated
  using (public.is_room_member(room_id));

create policy "Room members can send messages"
  on public.chat_messages for insert to authenticated
  with check (
    sender_id = auth.uid() and
    public.is_room_member(room_id) and
    (not is_announcement or public.is_room_admin(room_id))
  );

create policy "Room admins or senders can soft-delete messages"
  on public.chat_messages for update to authenticated
  using (sender_id = auth.uid() or public.is_room_admin(room_id));

create policy "Room members can report messages"
  on public.chat_reports for insert to authenticated
  with check (reported_by = auth.uid() and public.is_room_member(room_id));

-- bills
create policy "Students read own bills"
  on public.bills for select to authenticated
  using (student_id = auth.uid());

-- faqs, tickets, ticket_messages
create policy "Anyone can read FAQs including login help"
  on public.faqs for select to anon, authenticated
  using (true);

create policy "Users read own tickets"
  on public.tickets for select to authenticated
  using (user_id = auth.uid());

create policy "Authenticated users create own tickets"
  on public.tickets for insert to authenticated
  with check (user_id = auth.uid());

create policy "Unauthenticated users create Akun & IT help ticket (lupa password)"
  on public.tickets for insert to anon
  with check (
    user_id is null and
    kind = 'bantuan' and
    category = 'Akun & IT' and
    anonymous = false
  );

create policy "Users update own ticket rating or reopen"
  on public.tickets for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users read messages on own tickets"
  on public.ticket_messages for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

create policy "Users reply on own open tickets"
  on public.ticket_messages for insert to authenticated
  with check (
    sender_id = auth.uid() and
    sender_role = 'student' and
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id and t.user_id = auth.uid() and t.status <> 'closed'
    )
  );

-- campus_announcements
create policy "Authenticated users read campus announcements"
  on public.campus_announcements for select to authenticated
  using (true);

-- ============================================================================
-- 4. STORAGE BUCKETS & POLICIES
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('materials', 'materials', false, 52428800),          -- 50 MB
  ('submissions', 'submissions', false, 26214400),      -- 25 MB
  ('chat-attachments', 'chat-attachments', false, 26214400),
  ('ticket-attachments', 'ticket-attachments', false, 10485760),
  ('avatars', 'avatars', true, 5242880)
on conflict (id) do nothing;

create policy "Authenticated users read materials files"
  on storage.objects for select to authenticated
  using (bucket_id = 'materials');

create policy "Lecturers upload and delete materials files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'materials' and public.current_user_role() = 'dosen');

create policy "Lecturers delete own materials files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'materials' and owner = auth.uid());

create policy "Users manage own submission files"
  on storage.objects for all to authenticated
  using (bucket_id = 'submissions' and (owner = auth.uid() or public.current_user_role() = 'dosen'))
  with check (bucket_id = 'submissions' and owner = auth.uid());

create policy "Authenticated users read and upload chat attachments"
  on storage.objects for select to authenticated
  using (bucket_id = 'chat-attachments');

create policy "Authenticated users upload own chat attachments"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-attachments' and owner = auth.uid());

create policy "Users manage own ticket attachments"
  on storage.objects for all to authenticated
  using (bucket_id = 'ticket-attachments' and owner = auth.uid())
  with check (bucket_id = 'ticket-attachments' and owner = auth.uid());

create policy "Public read avatars and owner upload"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

create policy "Users upload own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and owner = auth.uid());
