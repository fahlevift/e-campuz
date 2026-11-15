# Kebijakan Keamanan (Security Policy)

## Versi yang Didukung

Pembaruan keamanan diterapkan pada branch aktif utama repositori:

| Versi / Branch | Didukung |
|---|---|
| `main` (v1.0.x) | Ya |
| Versi di bawah 1.0.0 | Tidak |

## Melaporkan Kerentanan Keamanan

Jika Anda menemukan celah keamanan pada aplikasi **E-Campuz** (misalnya kebocoran data pada Row Level Security PostgreSQL, celah autentikasi, XSS pada target Web, atau eksposur token/kredensial):

1. **Jangan** mempublikasikan kerentanan tersebut secara terbuka di GitHub Issues publik.
2. Laporkan secara privat melalui fitur **GitHub Security Advisories** pada tab **Security → Advisories → Report a vulnerability** di repositori ini.
3. Sertakan informasi berikut agar tim pengelola dapat memverifikasi dengan cepat:
   - Deskripsi kerentanan dan potensi dampaknya.
   - Langkah reproduksi (*steps to reproduce*) atau *Proof of Concept*.
   - Bagian kode, tabel RLS, atau endpoint yang terdampak.

Laporan akan ditanggapi secepat mungkin setelah diterima, dan perbaikan akan diprioritaskan pada branch `main`.

## Praktik Keamanan Proyek

- **Row Level Security (RLS):** Seluruh tabel publik PostgreSQL pada `supabase/migrations/` mengaktifkan RLS berbasis `auth.uid()` dan peran (`mahasiswa` / `dosen`).
- **Variabel Lingkungan:** Kredensial Supabase disimpan di `.env` lokal atau EAS Environment Variables dan tidak pernah di-commit ke repositori.
- **Penyimpanan Sesi:** Token autentikasi pada perangkat mobile disimpan melalui `expo-secure-store` / storage lokal yang aman.
