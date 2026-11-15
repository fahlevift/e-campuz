-- Migration 0001: Skema Awal Database E-Campuz Mobile App
-- Skema tabel utama aplikasi

create extension if not exists "pgcrypto" with schema extensions;

-- ============================================================================
-- 1. KELAS & PENGGUNA
-- ============================================================================

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,              -- mis. 'TI-3A'
  prodi text not null,
  faculty text not null default 'Fakultas Ilmu Komputer',
  cohort_year integer not null,           -- mis. 2024
  homeroom_lecturer_id uuid,              -- FK ditambahkan setelah tabel profiles dibuat
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('mahasiswa', 'dosen')),
  name text not null,
  nim_nip text not null unique,
  email text not null unique,
  phone text,
  prodi text not null,
  faculty text not null default 'Fakultas Ilmu Komputer',
  semester smallint,
  cohort_year integer,
  class_id uuid references public.classes(id) on delete set null,
  is_class_leader boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.classes
  add constraint classes_homeroom_lecturer_fkey
  foreign key (homeroom_lecturer_id) references public.profiles(id) on delete set null;

-- ============================================================================
-- 2. MATA KULIAH & JADWAL
-- ============================================================================

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null,                     -- mis. 'IF3201'
  name text not null,
  sks smallint not null check (sks > 0),
  class_id uuid not null references public.classes(id) on delete cascade,
  semester text not null,                 -- mis. 'Ganjil 2026/2027'
  description text,
  rps_url text,
  created_at timestamptz not null default now(),
  unique (code, class_id, semester)
);

create table public.course_lecturers (
  course_id uuid not null references public.courses(id) on delete cascade,
  lecturer_id uuid not null references public.profiles(id) on delete cascade,
  is_primary boolean not null default true,
  primary key (course_id, lecturer_id)
);

create table public.course_enrollments (
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (course_id, student_id)
);

create table public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  day smallint not null check (day between 1 and 6), -- 1=Senin .. 6=Sabtu
  start_time time not null,
  end_time time not null,
  room text not null,
  type text not null check (type in ('teori', 'praktikum', 'online')),
  online_url text,
  status text not null default 'normal' check (status in ('normal', 'changed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table public.schedule_changes (
  id uuid primary key default gen_random_uuid(),
  schedule_item_id uuid not null references public.schedule_items(id) on delete cascade,
  field text not null check (field in ('time', 'room', 'day', 'cancel')),
  old_value text not null,
  new_value text not null,
  scope text not null check (scope in ('once', 'permanent')),
  effective_date date,
  reason text,
  broadcast_to_chat boolean not null default true,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  changed_at timestamptz not null default now()
);

-- ============================================================================
-- 3. MATERI & TUGAS
-- ============================================================================

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  meeting smallint not null check (meeting between 1 and 16),
  title text not null,
  description text,
  type text not null check (type in ('pdf', 'ppt', 'doc', 'video', 'link')),
  url text not null,
  storage_path text,
  size_bytes bigint,
  notify_students boolean not null default true,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  uploaded_at timestamptz not null default now()
);

create table public.material_reads (
  material_id uuid not null references public.materials(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (material_id, user_id)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null,
  attachments jsonb not null default '[]'::jsonb,
  due_at timestamptz not null,
  allow_late boolean not null default false,
  submission_type text not null check (submission_type in ('file', 'text')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  files jsonb not null default '[]'::jsonb,
  text_answer text,
  notes text,
  status text not null default 'submitted' check (status in ('submitted', 'late', 'graded')),
  score numeric(5, 2) check (score is null or (score >= 0 and score <= 100)),
  feedback text,
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz,
  unique (assignment_id, student_id)
);

-- ============================================================================
-- 4. NOTIFIKASI & PREFERENSI
-- ============================================================================

create table public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('SCHEDULE', 'ASSIGNMENT', 'FINANCE', 'LEARNING', 'CHAT', 'SUPPORT', 'ANNOUNCEMENT')),
  type text not null,
  priority text not null default 'normal' check (priority in ('urgent', 'high', 'normal', 'low')),
  title text not null,
  body text not null,
  deep_link text not null,
  is_read boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  push_enabled boolean not null default true,
  categories jsonb not null default '{
    "SCHEDULE":     {"enabled": true, "types": {"SCHEDULE_CHANGED": true, "ROOM_CHANGED": true, "CLASS_CANCELLED": true, "CLASS_REMINDER": true}},
    "ASSIGNMENT":   {"enabled": true, "types": {"ASSIGNMENT_NEW": true, "ASSIGNMENT_DUE_REMINDER": true, "ASSIGNMENT_GRADED": true}},
    "FINANCE":      {"enabled": true, "types": {"UKT_BILL_ISSUED": true, "UKT_DUE_REMINDER": true, "UKT_OVERDUE": true, "UKT_PAID": true}},
    "LEARNING":     {"enabled": true, "types": {"MATERIAL_UPLOADED": true}},
    "CHAT":         {"enabled": true, "types": {"CHAT_MENTION": true, "CHAT_ANNOUNCEMENT": true, "CHAT_ALL": false}},
    "SUPPORT":      {"enabled": true, "types": {"TICKET_STATUS_CHANGED": true, "TICKET_REPLIED": true}},
    "ANNOUNCEMENT": {"enabled": true, "types": {"CAMPUS_ANNOUNCEMENT": true}}
  }'::jsonb,
  class_reminder_minutes smallint not null default 30 check (class_reminder_minutes in (15, 30, 60)),
  assignment_reminders text[] not null default array['H-1', '6h'],
  muted_course_ids_for_material uuid[] not null default '{}',
  quiet_hours jsonb not null default '{"enabled": false, "start": "22:00", "end": "06:00", "allowUrgent": true}'::jsonb,
  expo_push_token text,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 5. NAVBAR PRIORITAS
-- ============================================================================

create table public.nav_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  slots text[] not null default array['jadwal', 'pembelajaran', 'chat']
    check (array_length(slots, 1) = 3 and slots <@ array['jadwal', 'pembelajaran', 'chat', 'tugas', 'keuangan', 'layanan', 'notifikasi', 'profil']),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 6. ROOM CHAT KELAS & MATA KULIAH
-- ============================================================================

create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('class', 'course')),
  name text not null,
  description text,
  class_id uuid references public.classes(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  pinned_message_id uuid,                 -- FK ditambahkan setelah tabel chat_messages dibuat
  created_at timestamptz not null default now(),
  check (
    (type = 'class' and class_id is not null and course_id is null) or
    (type = 'course' and course_id is not null)
  )
);

create table public.chat_room_members (
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_admin boolean not null default false,
  muted_until timestamptz,
  last_read_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text,
  attachments jsonb not null default '[]'::jsonb,
  reply_to_id uuid references public.chat_messages(id) on delete set null,
  mentions uuid[] not null default '{}',
  is_announcement boolean not null default false,
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.chat_rooms
  add constraint chat_rooms_pinned_message_fkey
  foreign key (pinned_message_id) references public.chat_messages(id) on delete set null;

create table public.chat_reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  reported_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 7. KEUANGAN / UKT
-- ============================================================================

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  semester text not null,
  amount bigint not null check (amount >= 0),
  due_date date not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'overdue', 'installment')),
  va_number text not null,
  bank_name text not null default 'BNI',
  components jsonb not null default '[]'::jsonb,
  invoice_code text,
  receipt_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 8. LAYANAN BANTUAN, FAQ & PENGADUAN
-- ============================================================================

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Akademik & KRS', 'Nilai', 'Keuangan/UKT', 'Akun & IT', 'Fasilitas', 'Lainnya')),
  question text not null,
  summary text not null,
  steps jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  warning_note text,
  is_popular boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,              -- mis. 'TKT-2026-00123'
  user_id uuid references public.profiles(id) on delete set null,
  guest_nim_nip text,                     -- dipakai untuk lupa password tanpa login (S-02 -> S-72)
  guest_email text,
  kind text not null check (kind in ('bantuan', 'pengaduan')),
  category text not null check (category in ('Akademik & KRS', 'Nilai', 'Keuangan/UKT', 'Akun & IT', 'Fasilitas', 'Lainnya')),
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  description text not null,
  attachments jsonb not null default '[]'::jsonb,
  anonymous boolean not null default false,
  status text not null default 'submitted' check (status in ('submitted', 'in_progress', 'need_info', 'resolved', 'closed')),
  history jsonb not null default '[]'::jsonb,
  rating smallint check (rating is null or (rating between 1 and 5)),
  rating_comment text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Opsi anonim hanya untuk Pengaduan kategori Fasilitas dan Lainnya
  check (not anonymous or (kind = 'pengaduan' and category in ('Fasilitas', 'Lainnya')))
);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  sender_role text not null check (sender_role in ('student', 'staff')),
  sender_label text not null,
  message text not null,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 9. PENGUMUMAN KAMPUS
-- ============================================================================

create table public.campus_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null default 'Umum',
  published_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz not null default now()
);

-- ============================================================================
-- 10. INDEX PERFORMA
-- ============================================================================

create index idx_profiles_nim_nip on public.profiles (nim_nip);
create index idx_profiles_class_id on public.profiles (class_id);
create index idx_courses_class_id on public.courses (class_id);
create index idx_schedule_items_course_day on public.schedule_items (course_id, day);
create index idx_schedule_changes_item on public.schedule_changes (schedule_item_id, changed_at desc);
create index idx_materials_course_meeting on public.materials (course_id, meeting);
create index idx_assignments_course_due on public.assignments (course_id, due_at);
create index idx_submissions_student on public.submissions (student_id, assignment_id);
create index idx_notifications_user_created on public.app_notifications (user_id, created_at desc);
create index idx_notifications_user_unread on public.app_notifications (user_id, is_read) where is_read = false;
create index idx_chat_messages_room_created on public.chat_messages (room_id, created_at desc);
create index idx_bills_student_due on public.bills (student_id, due_date desc);
create index idx_tickets_user_status on public.tickets (user_id, status, created_at desc);
create index idx_ticket_messages_ticket on public.ticket_messages (ticket_id, created_at asc);
