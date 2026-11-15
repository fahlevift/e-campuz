-- Migration 0004: Perbaikan Penuh Realtime Publication, Keanggotaan Room Chat Lintas Peran, & Sinkronisasi Data

-- ============================================================================
-- 1. PASTIKAN SEMUA ROOM MATA KULIAH & ANGGOTA TERDAFTAR LENGKAP
-- ============================================================================

do $$
declare
  v_class_id uuid := '11111111-1111-1111-1111-111111111111';
  v_rina_id uuid := '22222222-2222-2222-2222-222222222201';
  v_fadil_id uuid := '22222222-2222-2222-2222-222222222202';
  v_fauzi_id uuid := '33333333-3333-3333-3333-333333333301';
  v_bambang_id uuid := '33333333-3333-3333-3333-333333333302';
  v_course_pm_id uuid := '44444444-4444-4444-4444-444444444401';
  v_course_rpl_id uuid := '44444444-4444-4444-4444-444444444402';
  v_course_imk_id uuid := '44444444-4444-4444-4444-444444444403';
  v_room_class_id uuid := '66666666-6666-6666-6666-666666666601';
  v_room_pm_id uuid := '66666666-6666-6666-6666-666666666602';
  v_room_rpl_id uuid := '66666666-6666-6666-6666-666666666603';
  v_room_imk_id uuid := '66666666-6666-6666-6666-666666666604';
begin
  -- Tambahkan room untuk mata kuliah IF308 dan IMK201 jika belum ada
  insert into public.chat_rooms (id, type, name, description, course_id)
  values
    (v_room_rpl_id, 'course', 'Rekayasa Perangkat Lunak – TI-3A', 'Diskusi materi, tugas, dan praktikum Rekayasa Perangkat Lunak.', v_course_rpl_id),
    (v_room_imk_id, 'course', 'Interaksi Manusia & Komputer – TI-3A', 'Diskusi proyek UI/UX, evaluasi heuristik, dan perkuliahan IMK.', v_course_imk_id)
  on conflict (id) do nothing;

  -- Pastikan seluruh dosen dan mahasiswa terdaftar di semua room agar pengujian 2 user (Mahasiswa A, Mahasiswa B, Dosen) selalu terhubung
  insert into public.chat_room_members (room_id, user_id, is_admin)
  values
    -- Room Kelas TI-3A
    (v_room_class_id, v_rina_id, false),
    (v_room_class_id, v_fadil_id, true),
    (v_room_class_id, v_fauzi_id, true),
    (v_room_class_id, v_bambang_id, true),
    -- Room Pemrograman Perangkat Bergerak
    (v_room_pm_id, v_rina_id, false),
    (v_room_pm_id, v_fadil_id, true),
    (v_room_pm_id, v_fauzi_id, true),
    (v_room_pm_id, v_bambang_id, true),
    -- Room Rekayasa Perangkat Lunak
    (v_room_rpl_id, v_rina_id, false),
    (v_room_rpl_id, v_fadil_id, true),
    (v_room_rpl_id, v_fauzi_id, true),
    (v_room_rpl_id, v_bambang_id, true),
    -- Room Interaksi Manusia & Komputer
    (v_room_imk_id, v_rina_id, false),
    (v_room_imk_id, v_fadil_id, true),
    (v_room_imk_id, v_fauzi_id, true),
    (v_room_imk_id, v_bambang_id, true)
  on conflict (room_id, user_id) do update set is_admin = excluded.is_admin;

  -- Pastikan kedua dosen dapat mengelola ketiga mata kuliah saat demo
  insert into public.course_lecturers (course_id, lecturer_id)
  values
    (v_course_pm_id, v_fauzi_id),
    (v_course_pm_id, v_bambang_id),
    (v_course_rpl_id, v_fauzi_id),
    (v_course_rpl_id, v_bambang_id),
    (v_course_imk_id, v_fauzi_id),
    (v_course_imk_id, v_bambang_id)
  on conflict do nothing;

  -- Pastikan tagihan UKT juga tersedia untuk mahasiswa ke-2 (Ahmad Fadil)
  if not exists (select 1 from public.bills where student_id = v_fadil_id) then
    insert into public.bills (student_id, semester, amount, due_date, status, va_number, bank_name, components)
    values
      (v_fadil_id, 'Ganjil 2026/2027', 4500000, current_date + 4, 'unpaid', '8802081294012342', 'BNI',
        '[{"label":"SPP Tetap","amount":2500000},{"label":"SPP Variabel (20 SKS)","amount":1500000},{"label":"Iuran Praktikum & Lab","amount":350000},{"label":"Asuransi & Kesehatan","amount":150000}]'::jsonb),
      (v_fadil_id, 'Genap 2025/2026', 4500000, '2026-02-20', 'paid', '8802081294012342', 'BNI', '[]'::jsonb);
  end if;
end $$;

-- ============================================================================
-- 2. TRIGGER AUTO-JOIN ROOM & COURSE UNTUK USER BARU DI PROFILES
-- ============================================================================

create or replace function public.auto_enroll_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'mahasiswa' then
    insert into public.course_enrollments (course_id, student_id)
    select id, new.id from public.courses
    on conflict do nothing;
  else
    insert into public.course_lecturers (course_id, lecturer_id)
    select id, new.id from public.courses
    on conflict do nothing;
  end if;

  insert into public.chat_room_members (room_id, user_id, is_admin)
  select id, new.id, (new.role = 'dosen' or coalesce(new.is_class_leader, false))
  from public.chat_rooms
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists trg_auto_enroll_profile on public.profiles;
create trigger trg_auto_enroll_profile
  after insert on public.profiles
  for each row execute function public.auto_enroll_new_profile();

-- ============================================================================
-- 3. REPLICA IDENTITY FULL & SUPABASE REALTIME PUBLICATION LENGKAP
-- ============================================================================

alter table public.chat_messages replica identity full;
alter table public.chat_rooms replica identity full;
alter table public.chat_room_members replica identity full;
alter table public.app_notifications replica identity full;
alter table public.schedule_items replica identity full;
alter table public.schedule_changes replica identity full;
alter table public.materials replica identity full;
alter table public.assignments replica identity full;
alter table public.submissions replica identity full;
alter table public.tickets replica identity full;
alter table public.ticket_messages replica identity full;

do $$
declare
  v_tbl text;
  v_tables text[] := array[
    'chat_messages',
    'chat_rooms',
    'chat_room_members',
    'app_notifications',
    'schedule_items',
    'schedule_changes',
    'materials',
    'assignments',
    'submissions',
    'tickets',
    'ticket_messages',
    'bills',
    'campus_announcements'
  ];
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach v_tbl in array v_tables loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = v_tbl
      ) then
        execute format('alter publication supabase_realtime add table public.%I', v_tbl);
      end if;
    end loop;
  end if;
end $$;
