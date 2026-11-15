# Komitmen Aksesibilitas (Accessibility)

## Tujuan

**E-Campuz** berkomitmen menyediakan pengalaman penggunaan yang dapat diakses secara nyaman oleh seluruh mahasiswa dan dosen pada perangkat Android, iOS, maupun Web.

## Prinsip yang Diterapkan

- **Label Aksesibilitas:** Tombol ikon dan kontrol interaktif menggunakan atribut `accessibilityLabel` serta `accessibilityRole` untuk mendukung pembaca layar (*TalkBack* di Android, *VoiceOver* di iOS, dan screen reader Web).
- **Kontras Warna & Status:** Teks dan indikator status dirancang mengikuti kontras yang jelas pada tema terang, serta memadukan ikon/teks label selain warna agar informasi tetap terbaca bagi pengguna dengan gangguan penglihatan warna.
- **Ukuran Target Sentuh:** Elemen interaktif (tombol, tab navigasi, daftar menu) dirancang dengan area sentuh yang memadai untuk navigasi satu tangan di perangkat mobile.
- **Umpan Balik Jelas:** Form autentikasi, pengumpulan tugas, dan aksi sensitif dilengkapi validasi skema (`zod`), pesan error deskriptif dalam Bahasa Indonesia, serta konfirmasi sebelum tindakan destruktif.

## Keterbatasan Diketahui

- Beberapa layar pada target Web masih menggunakan komponen standar `react-native-web` sehingga dukungan navigasi keyboard penuh (*focus ring* dan urutan tab kompleks) terus disempurnakan secara bertahap.

## Melaporkan Hambatan Aksesibilitas

Jika Anda menemukan kendala aksesibilitas saat menggunakan aplikasi (misalnya teks sulit terbaca, label screen reader kurang jelas, atau elemen tidak dapat difokuskan), silakan laporkan melalui [GitHub Issues](https://github.com/fahlevift/e-campuz/issues/new/choose) dengan mencantumkan platform (Android / iOS / Web) dan layar yang terdampak.
