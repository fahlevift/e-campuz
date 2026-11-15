<div align="center">

# E-Campuz

**Aplikasi Mobile Akademik & Kemahasiswaan Terpadu**

[![Expo SDK 58](https://img.shields.io/badge/Expo-SDK%2058-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-1E40AF?style=for-the-badge)](./LICENSE)

[![GitHub Stars](https://img.shields.io/github/stars/fahlevift/e-campuz?style=flat-square&color=1E40AF)](https://github.com/fahlevift/e-campuz/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/fahlevift/e-campuz?style=flat-square&color=0EA5E9)](https://github.com/fahlevift/e-campuz/issues)
[![Last Commit](https://img.shields.io/github/last-commit/fahlevift/e-campuz?style=flat-square&color=10B981)](https://github.com/fahlevift/e-campuz/commits/main)

</div>

---

## Tentang E-Campuz

**E-Campuz** adalah aplikasi mobile lintas platform (Android, iOS, dan Web) yang dirancang untuk menyatukan aktivitas akademik mahasiswa dan dosen dalam satu antarmuka yang bersih, responsif, dan terhubung secara *real-time*.

### Fitur Utama

| Modul | Ringkasan Kemampuan |
|---|---|
| **Autentikasi & Profil** | Login berbasis NIM/NIP menggunakan Supabase Auth RPC (`resolve_login_email`), pemulihan sesi aman, dan manajemen profil mahasiswa/dosen. |
| **Beranda Terstruktur** | Ringkasan jadwal hari ini, item mendesak (*perlu perhatian*), akses cepat, serta tampilan khusus peran **Mahasiswa** dan **Dosen**. |
| **Jadwal Kuliah** | Tampilan mingguan/harian, detail sesi kuliah, riwayat perubahan ruang/waktu, serta pembaruan jadwal oleh dosen dengan siaran ke room chat. |
| **Pembelajaran & Tugas** | Daftar mata kuliah, materi per pertemuan (PDF/PPT/video/link), penugasan dengan tenggat waktu, pengumpulan file/teks, dan penilaian dosen. |
| **Room Chat Kelas & MK** | Diskusi *real-time* kelas dan mata kuliah, `@mention`, balasan pesan, pesan tersemat (*pinned*), pengumuman resmi, moderasi admin, serta mute room. |
| **Pusat & Preferensi Notifikasi** | Filter kategori, penanda belum dibaca, preferensi pengingat kelas & tugas, serta pengaturan *Quiet Hours*. |
| **Keuangan / UKT** | Informasi tagihan semester, rincian komponen biaya, status pembayaran/jatuh tempo, dan nomor Virtual Account. |
| **Layanan Bantuan** | Pusat FAQ yang dapat dicari serta sistem tiket pengaduan akademik dengan pelacakan status percakapan. |
| **Navigasi Prioritas** | Kustomisasi 3 slot utama pada bottom navigation bar sesuai kebutuhan pengguna. |

---

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| **Framework & UI** | React Native, Expo SDK 58, Expo Router, Lucide React Native |
| **Bahasa** | TypeScript (`strict: true`) |
| **State & Data** | Zustand, TanStack React Query v5, React Hook Form + Zod |
| **Backend & Database** | Supabase (PostgreSQL, Auth, Realtime, Storage, Row Level Security) |
| **Native Modules** | `expo-notifications`, `expo-secure-store`, `expo-document-picker`, `expo-file-system` |

---

## Struktur Proyek

```text
.
├── app/                   # Halaman & routing berbasis Expo Router
│   ├── (auth)/            # Splash, login NIM/NIP, izin notifikasi
│   ├── (tabs)/            # Beranda, Jadwal, Pembelajaran, Chat, Keuangan, Layanan, Menu
│   ├── chat/              # Room diskusi kelas/mata kuliah & info room
│   ├── finance/           # Detail tagihan & pembayaran UKT
│   ├── learning/          # Detail MK, viewer materi, detail & pengumpulan tugas
│   ├── schedule/          # Detail & editor perubahan jadwal/ruang
│   ├── settings/          # Pengaturan aplikasi, navigasi prioritas, notifikasi
│   └── support/           # Detail FAQ, buat tiket, percakapan tiket
├── src/
│   ├── components/ui/     # Komponen antarmuka yang dapat digunakan ulang
│   ├── features/          # Hooks & integrasi React Query per fitur
│   ├── lib/               # Konfigurasi Supabase client
│   ├── services/          # Layer akses data, Realtime, Storage, dan fallback cache
│   ├── store/             # State global Zustand
│   ├── theme/             # Token warna, tipografi, spacing, elevasi
│   ├── types/             # Definisi tipe TypeScript
│   └── utils/             # Utilitas format tanggal (id-ID) & mata uang (IDR)
└── supabase/
    ├── config.toml        # Konfigurasi proyek & storage bucket
    ├── migrations/        # Skema PostgreSQL, RLS, trigger notifikasi, & Realtime
    └── seed.sql           # Data awal pengembangan
```

---

## Memulai Pengembangan Lokal

### Prasyarat

- **Node.js** >= 20 LTS & **npm**
- Akun/proyek **Supabase** (Cloud atau lokal via Supabase CLI)
- **Expo Go** (Android/iOS) atau browser untuk target Web

### 1. Clone & Instalasi Dependensi

```bash
git clone https://github.com/fahlevift/e-campuz.git
cd e-campuz
npm install
```

### 2. Konfigurasi Variabel Lingkungan

Buat file `.env` di root proyek (jangan di-commit ke Git):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Siapkan Database Supabase

Jalankan seluruh file migrasi SQL secara berurutan di folder `supabase/migrations/` pada Supabase SQL Editor atau melalui Supabase CLI, lalu jalankan `supabase/seed.sql` untuk data awal pengembangan.

### 4. Jalankan Aplikasi

```bash
# Jalankan Metro bundler (pilih Android / iOS / Web)
npm start

# Jalankan langsung versi Web
npm run web

# Verifikasi tipe TypeScript
npm run typecheck
```

---

## Standar Komunitas & Kontribusi

Kontribusi sangat terbuka untuk peningkatan fitur, perbaikan bug, maupun dokumentasi:

- [Panduan Kontribusi](./CONTRIBUTING.md)
- [Kode Etik Komunitas](./CODE_OF_CONDUCT.md)
- [Kebijakan Keamanan](./SECURITY.md)
- [Komitmen Aksesibilitas](./ACCESSIBILITY.md)
- [Laporkan Bug atau Ajukan Fitur](https://github.com/fahlevift/e-campuz/issues/new/choose)

---

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](./LICENSE).
