-- Migration 0005: Lengkapi RLS Policies untuk CRUD Penuh & Pastikan Data Seed Tersedia di Remote DB

-- ============================================================================
-- 1. TAMBAHAN RLS POLICIES AGAR SEMUA OPERASI CRUD BERJALAN MULUS
-- ============================================================================

-- Izinkan dosen pengampu melakukan INSERT langsung pada submissions (mis. memberi nilai mahasiswa yang mengumpulkan manual)
drop policy if exists "Course lecturers can insert submissions" on public.submissions;
create policy "Course lecturers can insert submissions"
  on public.submissions for insert to authenticated
  with check (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.is_course_lecturer(a.course_id)
    )
  );

-- Izinkan mahasiswa memperbarui pengumpulan miliknya kapan saja dan dosen menilai
drop policy if exists "Students can update ungraded submission, lecturers can grade" on public.submissions;
create policy "Students can update submission, lecturers can grade"
  on public.submissions for update to authenticated
  using (
    student_id = auth.uid() or
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.is_course_lecturer(a.course_id)
    )
  )
  with check (
    student_id = auth.uid() or
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.is_course_lecturer(a.course_id)
    )
  );

-- Izinkan pengguna membuat notifikasi untuk anggota kelas/dirinya bila diperlukan dari client
drop policy if exists "Authenticated users can insert notifications" on public.app_notifications;
create policy "Authenticated users can insert notifications"
  on public.app_notifications for insert to authenticated
  with check (true);

-- Izinkan pengirim atau admin room menghapus pesan chat
drop policy if exists "Room admins or senders can delete messages" on public.chat_messages;
create policy "Room admins or senders can delete messages"
  on public.chat_messages for delete to authenticated
  using (sender_id = auth.uid() or public.is_room_admin(room_id));

-- Izinkan dosen pengampu menghapus log perubahan jadwal uji coba
drop policy if exists "Course lecturers can delete schedule changes" on public.schedule_changes;
create policy "Course lecturers can delete schedule changes"
  on public.schedule_changes for delete to authenticated
  using (
    changed_by = auth.uid() or
    exists (
      select 1 from public.schedule_items si
      where si.id = schedule_item_id and public.is_course_lecturer(si.course_id)
    )
  );

-- Izinkan pembuat tiket menghapus tiket miliknya
drop policy if exists "Users can delete own tickets" on public.tickets;
create policy "Users can delete own tickets"
  on public.tickets for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- 2. PASTIKAN DATA AWAL (NOTIFIKASI, JADWAL, MATERI, TUGAS, FAQ, BILLS) TERISI
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
  v_sched_pm_id uuid := '55555555-5555-5555-5555-555555555501';
  v_sched_rpl_id uuid := '55555555-5555-5555-5555-555555555502';
  v_assign_pm_id uuid := '77777777-7777-7777-7777-777777777701';
begin
  -- Pastikan jadwal tersedia
  insert into public.schedule_items (id, course_id, day, start_time, end_time, room, type, status)
  values
    (v_sched_pm_id,  v_course_pm_id,  1, '08:00', '09:40', 'C305',           'teori',     'changed'),
    (v_sched_rpl_id, v_course_rpl_id, 1, '10:00', '11:40', 'Lab Komputer 2', 'praktikum', 'normal')
  on conflict (id) do nothing;

  -- Pastikan minimal ada notifikasi awal untuk Mahasiswa A & B
  if not exists (select 1 from public.app_notifications where user_id = v_rina_id) then
    insert into public.app_notifications (user_id, category, type, priority, title, body, deep_link, is_read, meta)
    values
      (v_rina_id, 'SCHEDULE', 'ROOM_CHANGED', 'urgent', 'Ruangan Kuliah Berubah',
       'Pemrograman Perangkat Bergerak: B201 → C305', '/schedule/' || v_sched_pm_id::text, false,
       jsonb_build_object('oldValue', 'B201', 'newValue', 'C305', 'field', 'room', 'courseId', v_course_pm_id)),
      (v_rina_id, 'ASSIGNMENT', 'ASSIGNMENT_DUE_REMINDER', 'high', 'Tenggat Tugas < 24 Jam',
       'Tugas 04: Implementasi State Management & Auth Supabase berakhir besok.', '/learning/' || v_course_pm_id::text || '/assignment/' || v_assign_pm_id::text, false,
       jsonb_build_object('assignmentId', v_assign_pm_id, 'courseId', v_course_pm_id)),
      (v_rina_id, 'FINANCE', 'UKT_DUE_REMINDER', 'high', 'Pengingat Pembayaran UKT Semester Ganjil',
       'Tagihan UKT sebesar Rp 4.500.000 jatuh tempo dalam 4 hari.', '/(tabs)/finance', false, '{}'::jsonb);
  end if;

  if not exists (select 1 from public.app_notifications where user_id = v_fadil_id) then
    insert into public.app_notifications (user_id, category, type, priority, title, body, deep_link, is_read, meta)
    values
      (v_fadil_id, 'SCHEDULE', 'ROOM_CHANGED', 'urgent', 'Ruangan Kuliah Berubah',
       'Pemrograman Perangkat Bergerak: B201 → C305', '/schedule/' || v_sched_pm_id::text, false,
       jsonb_build_object('oldValue', 'B201', 'newValue', 'C305', 'field', 'room', 'courseId', v_course_pm_id));
  end if;

  -- Pastikan FAQ tersedia
  if not exists (select 1 from public.faqs) then
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
  end if;
end $$;
