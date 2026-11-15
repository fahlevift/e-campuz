-- Seed Data Awal (Pengembangan & Pengujian)
-- Akun demo (password semua akun: ecampuz123):
--   Mahasiswa : NIM 22053181  (rina.salsabila@student.kampus.ac.id)
--   Ketua Kls : NIM 22053182  (ahmad.fadil@student.kampus.ac.id)
--   Dosen     : NIP 198204152010121001 (ahmad.fauzi@kampus.ac.id)
--   Dosen Wali: NIP 197804122005011002 (bambang.sutrisno@kampus.ac.id)

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
  v_sched_pm_id uuid := '55555555-5555-5555-5555-555555555501';
  v_sched_rpl_id uuid := '55555555-5555-5555-5555-555555555502';
  v_room_class_id uuid := '66666666-6666-6666-6666-666666666601';
  v_room_pm_id uuid := '66666666-6666-6666-6666-666666666602';
  v_room_rpl_id uuid := '66666666-6666-6666-6666-666666666603';
  v_room_imk_id uuid := '66666666-6666-6666-6666-666666666604';
  v_assign_pm_id uuid := '77777777-7777-7777-7777-777777777701';
  v_pw text := extensions.crypt('ecampuz123', extensions.gen_salt('bf'));
begin
  -- 1. Auth Users (kolom token harus '' bukan NULL agar GoTrue/Supabase Auth tidak error)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, reauthentication_token, phone_change, phone_change_token,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    (v_rina_id,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rina.salsabila@student.kampus.ac.id', v_pw, now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{"name":"Rina Salsabila"}', now(), now()),
    (v_fadil_id,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ahmad.fadil@student.kampus.ac.id',    v_pw, now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{"name":"Ahmad Fadil"}',    now(), now()),
    (v_fauzi_id,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ahmad.fauzi@kampus.ac.id',            v_pw, now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{"name":"Dr. Ir. Ahmad Fauzi, M.Kom."}', now(), now()),
    (v_bambang_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bambang.sutrisno@kampus.ac.id',       v_pw, now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{"name":"Dr. Bambang Sutrisno, M.Kom."}', now(), now())
  on conflict (id) do update set
    confirmation_token = coalesce(auth.users.confirmation_token, ''),
    recovery_token = coalesce(auth.users.recovery_token, ''),
    email_change_token_new = coalesce(auth.users.email_change_token_new, ''),
    email_change = coalesce(auth.users.email_change, ''),
    email_change_token_current = coalesce(auth.users.email_change_token_current, ''),
    reauthentication_token = coalesce(auth.users.reauthentication_token, ''),
    phone_change = coalesce(auth.users.phone_change, ''),
    phone_change_token = coalesce(auth.users.phone_change_token, '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select
    u.id,
    u.id,
    u.id::text,
    jsonb_build_object('sub', u.id::text, 'email', u.email),
    'email',
    now(),
    now(),
    now()
  from auth.users u
  where u.id in (v_rina_id, v_fadil_id, v_fauzi_id, v_bambang_id)
  on conflict do nothing;

  -- 2. Class
  insert into public.classes (id, name, prodi, cohort_year)
  values (v_class_id, 'TI-3A', 'S1 Teknik Informatika', 2024)
  on conflict (id) do nothing;

  -- 3. Profiles
  insert into public.profiles (id, role, name, nim_nip, email, phone, prodi, semester, cohort_year, class_id, is_class_leader)
  values
    (v_rina_id,    'mahasiswa', 'Rina Salsabila',               '22053181',             'rina.salsabila@student.kampus.ac.id', '+62 812-3456-7890', 'S1 Teknik Informatika', 5, 2024, v_class_id, false),
    (v_fadil_id,   'mahasiswa', 'Ahmad Fadil',                  '22053182',             'ahmad.fadil@student.kampus.ac.id',    '+62 812-3456-7891', 'S1 Teknik Informatika', 5, 2024, v_class_id, true),
    (v_fauzi_id,   'dosen',     'Dr. Ir. Ahmad Fauzi, M.Kom.',  '198204152010121001',   'ahmad.fauzi@kampus.ac.id',            '+62 812-1111-2222', 'S1 Teknik Informatika', null, null, null, false),
    (v_bambang_id, 'dosen',     'Dr. Bambang Sutrisno, M.Kom.', '197804122005011002',   'bambang.sutrisno@kampus.ac.id',       '+62 812-1111-3333', 'S1 Teknik Informatika', null, null, null, false)
  on conflict (id) do nothing;

  update public.classes set homeroom_lecturer_id = v_bambang_id where id = v_class_id;

  -- 4. Courses
  insert into public.courses (id, code, name, sks, class_id, semester, description)
  values
    (v_course_pm_id,  'IF3201', 'Pemrograman Perangkat Bergerak', 3, v_class_id, 'Ganjil 2026/2027', 'Pengembangan aplikasi mobile dengan React Native, Expo, dan Supabase.'),
    (v_course_rpl_id, 'IF308',  'Rekayasa Perangkat Lunak',       3, v_class_id, 'Ganjil 2026/2027', 'Analisis kebutuhan, arsitektur perangkat lunak, dan pengujian.'),
    (v_course_imk_id, 'IMK201', 'Interaksi Manusia & Komputer',   3, v_class_id, 'Ganjil 2026/2027', 'Desain antarmuka pengguna, heuristic evaluation, dan prototipe.')
  on conflict (id) do nothing;

  insert into public.course_lecturers (course_id, lecturer_id)
  values
    (v_course_pm_id, v_fauzi_id),
    (v_course_rpl_id, v_bambang_id),
    (v_course_imk_id, v_bambang_id)
  on conflict do nothing;

  insert into public.course_enrollments (course_id, student_id)
  values
    (v_course_pm_id, v_rina_id), (v_course_pm_id, v_fadil_id),
    (v_course_rpl_id, v_rina_id), (v_course_rpl_id, v_fadil_id),
    (v_course_imk_id, v_rina_id), (v_course_imk_id, v_fadil_id)
  on conflict do nothing;

  -- 5. Schedules
  insert into public.schedule_items (id, course_id, day, start_time, end_time, room, type, status)
  values
    (v_sched_pm_id,  v_course_pm_id,  1, '08:00', '09:40', 'B201',            'teori',     'normal'),
    (v_sched_rpl_id, v_course_rpl_id, 1, '10:00', '11:40', 'Lab Komputer 2',  'praktikum', 'normal')
  on conflict (id) do nothing;

  -- 6. Chat Rooms
  insert into public.chat_rooms (id, type, name, description, class_id)
  values (v_room_class_id, 'class', 'TI-3A Angkatan 2024', 'Room koordinasi resmi kelas TI-3A bersama dosen wali.', v_class_id)
  on conflict (id) do nothing;

  insert into public.chat_rooms (id, type, name, description, course_id)
  values
    (v_room_pm_id, 'course', 'Pemrograman Perangkat Bergerak – TI-3A', 'Diskusi materi, tugas, dan perkuliahan Pemrograman Bergerak.', v_course_pm_id),
    (v_room_rpl_id, 'course', 'Rekayasa Perangkat Lunak – TI-3A', 'Diskusi materi, tugas, dan praktikum Rekayasa Perangkat Lunak.', v_course_rpl_id),
    (v_room_imk_id, 'course', 'Interaksi Manusia & Komputer – TI-3A', 'Diskusi proyek UI/UX, evaluasi heuristik, dan perkuliahan IMK.', v_course_imk_id)
  on conflict (id) do nothing;

  insert into public.chat_room_members (room_id, user_id, is_admin)
  values
    (v_room_class_id, v_rina_id, false),
    (v_room_class_id, v_fadil_id, true),
    (v_room_class_id, v_fauzi_id, true),
    (v_room_class_id, v_bambang_id, true),
    (v_room_pm_id, v_rina_id, false),
    (v_room_pm_id, v_fadil_id, true),
    (v_room_pm_id, v_fauzi_id, true),
    (v_room_pm_id, v_bambang_id, true),
    (v_room_rpl_id, v_rina_id, false),
    (v_room_rpl_id, v_fadil_id, true),
    (v_room_rpl_id, v_fauzi_id, true),
    (v_room_rpl_id, v_bambang_id, true),
    (v_room_imk_id, v_rina_id, false),
    (v_room_imk_id, v_fadil_id, true),
    (v_room_imk_id, v_fauzi_id, true),
    (v_room_imk_id, v_bambang_id, true)
  on conflict do nothing;

  -- 7. Simulasi Perubahan Ruangan (otomatis memicu notifikasi & broadcast chat via trigger)
  if not exists (select 1 from public.schedule_changes where schedule_item_id = v_sched_pm_id) then
    insert into public.schedule_changes (schedule_item_id, field, old_value, new_value, scope, effective_date, reason, broadcast_to_chat, changed_by)
    values (v_sched_pm_id, 'room', 'B201', 'C305', 'once', current_date, 'Ruangan B201 sedang renovasi proyektor.', true, v_fauzi_id);
  end if;

  -- 8. Materi & Tugas Contoh
  insert into public.materials (course_id, meeting, title, description, type, url, size_bytes, uploaded_by)
  values (v_course_pm_id, 7, 'Pertemuan 7 – State Management & Supabase', 'Modul PDF penggunaan Zustand dan integrasi Supabase.', 'pdf', 'https://example.com/modul-07.pdf', 3565158, v_fauzi_id)
  on conflict do nothing;

  insert into public.assignments (id, course_id, title, description, due_at, allow_late, submission_type, created_by)
  values (v_assign_pm_id, v_course_pm_id, 'Tugas 04: Implementasi State Management & Auth Supabase', 'Unggah arsip ZIP source code proyek Expo beserta screenshot aplikasi.', now() + interval '18 hours', true, 'file', v_fauzi_id)
  on conflict (id) do nothing;

  -- 9. Tagihan UKT
  insert into public.bills (student_id, semester, amount, due_date, status, va_number, bank_name, components)
  values
    (v_rina_id, 'Ganjil 2026/2027', 4500000, current_date + 4, 'unpaid', '8802081294012341', 'BNI',
      '[{"label":"SPP Tetap","amount":2500000},{"label":"SPP Variabel (20 SKS)","amount":1500000},{"label":"Iuran Praktikum & Lab","amount":350000},{"label":"Asuransi & Kesehatan","amount":150000}]'::jsonb),
    (v_rina_id, 'Genap 2025/2026', 4500000, '2026-02-20', 'paid', '8802081294012341', 'BNI', '[]'::jsonb)
  on conflict do nothing;

  -- 10. FAQ Layanan Bantuan & Pengumuman Kampus
  insert into public.faqs (category, question, summary, steps, warning_note, is_popular)
  values
    ('Keuangan/UKT', 'Bagaimana alur pengajuan dispensasi keterlambatan pembayaran UKT?',
     'Dispensasi UKT dapat diajukan hingga H-3 sebelum penutupan KRS dengan melampirkan surat permohonan dan slip penghasilan orang tua.',
     '["Unduh formulir dispensasi resmi.","Minta persetujuan Dosen Pembimbing Akademik (DPA).","Buat tiket pengaduan online kategori Keuangan/UKT.","Tunggu verifikasi petugas BAAK maksimal 2x24 jam kerja."]'::jsonb,
     'Dispensasi hanya memperpanjang masa bayar dan tidak memotong nominal UKT.', true),
    ('Akademik & KRS', 'Ruangan kuliah berubah mendadak di jadwal, ke mana saya harus konfirmasi?',
     'Periksa tab Jadwal atau Pusat Notifikasi. Perubahan resmi dari dosen langsung muncul dengan tag Berubah beserta catatan dosen.',
     '["Cek detail jadwal atau pesan tersemat di Room Chat Kelas.","Jika belum jelas, mention dosen/ketua kelas di Room Chat."]'::jsonb,
     null, true),
    ('Fasilitas', 'Apakah pengaduan fasilitas kampus bisa dikirim secara anonim?',
     'Ya, pada form Buat Tiket aktifkan opsi Kirim sebagai Anonim untuk kategori Fasilitas dan Lainnya.',
     '["Buka Layanan Bantuan > Buat Tiket.","Pilih jenis Pengaduan dan kategori Fasilitas atau Lainnya.","Aktifkan toggle Kirim sebagai Anonim."]'::jsonb,
     null, true);

  insert into public.campus_announcements (title, body, category, published_by)
  values
    ('Batas Akhir Pengisian & Validasi KRS Semester Genap', 'Mahasiswa diharapkan menyelesaikan pelunasan UKT sebelum 25 November 2026 untuk kelancaran pengisian KRS.', 'Akademik', v_bambang_id);
end $$;
