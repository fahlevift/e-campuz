# Panduan Kontribusi E-Campuz

Terima kasih telah tertarik untuk berkontribusi pada **E-Campuz**! Dokumen ini menjelaskan alur kerja, standar kode, dan cara mengajukan perbaikan atau fitur baru.

## Cara Berkontribusi

1. **Laporkan Bug atau Ajukan Ide**
   - Sebelum membuat *issue* baru, periksa [daftar issue yang sudah ada](https://github.com/fahlevift/e-campuz/issues).
   - Gunakan template **Bug Report** atau **Feature Request** saat membuat issue baru.

2. **Alur Pengembangan (Fork & Pull Request)**
   - *Fork* repositori ini ke akun GitHub Anda.
   - Buat branch baru dari `main` dengan nama deskriptif:
     - `feat/nama-fitur` untuk fitur baru
     - `fix/nama-perbaikan` untuk perbaikan bug
     - `chore/deskripsi-singkat` untuk pemeliharaan atau dokumentasi
   - Pastikan seluruh kode mengikuti standar proyek di bawah ini.
   - Ajukan **Pull Request** ke branch `main` dan isi template PR secara lengkap.

## Standar Pengembangan & Kode

- **TypeScript Strict:** Semua kode wajib lolos pemeriksaan tipe tanpa error:
  ```bash
  npm run typecheck
  ```
- **Arsitektur Data:** Panggilan ke Supabase (`Auth`, `Query`, `Storage`, `Realtime`) dipusatkan pada `src/services/` dan dikonsumsi melalui React Query hooks di `src/features/`.
- **Desain & Tema:** Gunakan token warna, spasi, dan tipografi dari `src/theme/` tanpa nilai warna *hardcoded* di komponen.
- **State Layar:** Setiap layar yang memuat data asinkron sebaiknya menangani kondisi *loading* (skeleton), kosong (*empty state*), gagal (*error + coba lagi*), dan sukses.
- **Bahasa Antarmuka:** Seluruh teks UI pengguna ditulis dalam **Bahasa Indonesia** dengan format tanggal `id-ID` dan mata uang Rupiah (`IDR`).
- **Keamanan:** Jangan pernah menyertakan file `.env`, API key, token, atau kredensial apa pun ke dalam commit.

## Pengujian Lokal

Sebelum membuka Pull Request, pastikan:

1. `npm run typecheck` lulus dengan exit code `0`.
2. Perubahan telah diuji minimal di salah satu target (`npm run web`, Expo Go Android/iOS, atau build preview).
3. Tidak ada file sensitif atau sementara yang ikut ter-stage (`git status`).
