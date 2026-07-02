# 📋 Proyek SIMMAG - Ultimate Linear TODO List

## 🔴 FASE 1: Database Architecture & Core Security
*Prinsip: Selesaikan semua urusan DB & API di sini agar sekali tes Postman langsung beres semuanya tanpa bolak-balik rilis kolom baru.*

### 1. Finalisasi Struktur Tabel & Kolom (Supabase BE)
- [x] **Normalisasi Database Lanjutan:** Buat tabel master `kelas` dan `jurusan` (mengikat foreign key ID, bukan string manual lagi).
- [x] **Denormalisasi Tabel Magang:** Tambahkan kolom fisik `nama_siswa_cache` dan `nama_dudi_cache` di tabel `magang`, lengkap dengan `TRIGGER` otomatisnya biar data sinkron saat ada insert/update.
- [x] **Kolom Bukti Jurnal:** Tambahkan kolom `bukti_url text` langsung di dalam tabel `public.jurnal` dari sekarang, biar struktur tabel jurnal sudah final.

### 2. Security & Testing (Supabase BE)
- [x] **Database RLS (Row Level Security):** Aktifkan RLS di semua tabel (`users`, `siswa`, `guru`, `magang`, `jurnal`, `jurusan`, `kelas`). Batasi hak akses data sesuai role user (Siswa, Guru, Admin).
- [x] **Testing REST API via Postman:** Uji seluruh endpoint Supabase di Postman **sekarang**. Pastikan RLS-nya aman, denormalisasinya jalan otomatis, dan kolom `bukti_url` serta relasi `jurusan_id`/`kelas_id` merespons dengan benar.

---

## 🟡 FASE 2: Authentication & Custom Auth Flow (BE & FE Integration)
*Sistem autentikasi dan gerbang masuk aplikasi.*

- [x] **Google OAuth:** Aktifkan login via Google Auth di dashboard Supabase dan frontend.
- [x] **Email Verification & Custom Template:** Aktifkan verifikasi email pendaftaran dengan template email kustom.
- [x] **Forgot & Reset Password:** Buat halaman tangkapan link reset password di Next.js untuk mengubah password.
- [x] **OTP Login via Email:** Tambahkan opsi login alternatif menggunakan kode OTP.
- [x] **Google reCAPTCHA:** Pasang reCAPTCHA di halaman Login & Register untuk menangkal bot.

---

## 🔵 FASE 3: Data Management & Next.js Core Optimization (FE & BE Service)
*Mengoptimalkan cara aplikasi mengambil, menampilkan, dan mengolah data massal.*

### 1. Batch Operations & API
- [x] **Batch Insert & Batch Upsert:** Buat server action/fungsi khusus Admin untuk import data massal siswa/dudi.
- [x] **Custom Endpoint API:** Buat custom endpoint di Next.js API Routes (`/api/...`) untuk logic internal.
- [x] **Backend Pagination:** Terapkan limit/offset server-side di query Supabase.

### 2. Optimasi Navigasi & UI Dasar
- [x] **Next/Link Migration:** Ganti tombol navigasi manual menjadi `<Link>` dari Next.js biar gak ada *hard reload* yang ngilangin state.
- [x] **Search Debounce:** Pasang fungsi debounce pada input pencarian biar gak spam query ke database.
- [x] **Skeleton Loading:** Ganti teks loading kaku dengan komponen Shimmer/Skeleton Loading.

---

## 🟢 FASE 4: Image Storage & Advance Jurnal Feature (Fitur Mandiri)
*Mengeksekusi fitur upload gambar harian yang sudah disiapkan kolomnya di Fase 1.*

- [x] **Supabase Storage Setup:** Buat bucket `jurnal_bukti` dan atur kebijakan akses filenya.
- [x] **Browser Image Compression (FE):** Pasang `browser-image-compression` untuk kompres foto di browser siswa sebelum di-upload.
- [x] **Server Resize via Sharp (API Route):** Buat Next.js API Route untuk menangkap gambar, me-resize dengan `sharp`, dan mengubah formatnya menjadi **WebP**.
- [x] **Integrasi Form Jurnal:** Pasang input file di form jurnal, kirim ke API Sharp ➔ simpan URL-nya ke kolom `bukti_url` tabel `jurnal` yang sudah kita buat di Fase 1.

---

## 🟣 FASE 5: Anti-Faking System (QR Code, Geolokasi, & Real-time)
*Fitur validasi kehadiran mutakhir.*

- [x] **Fitur Generate QR (Admin/Guru):** Buat halaman generate QR Code unik per perusahaan mitra (DUDI).
- [x] **Fitur Scan QR Jurnal (Siswa):** Buat komponen kamera pemindai QR di halaman siswa.
- [x] **Real-time Geolocation:** Tangkap koordinat GPS via browser saat siswa scan QR, validasikan dengan lokasi DUDI (otomatis dianggap presensi hadir).
- [x] **Notifikasi Real-time:** Pasang notifikasi instan untuk Guru Pembimbing saat siswanya upload jurnal/daftar magang.

---

## 🟤 FASE 6: Progressive Web App (PWA) & Analytics Dashboard
*Finishing proyek tingkat dewa biar aplikasi bisa di-install di HP dan admin dapet grafik keren.*

- [x] **IndexedDB Offline Storage:** Setup `idb` atau `Dexie.js` untuk menampung draf jurnal siswa saat internet putus.
- [x] **Auto-sync Online:** Buat logic otomatis upload draf jurnal dari IndexedDB ke Supabase saat sinyal kembali online.
- [x] **Status Online/Offline Indicator:** Tampilkan lingkaran indikator status koneksi internet di layout global web.
- [ ] **CSS Sprites / Icon Optimization:** Optimalkan asset SVG agar memotong jumlah request jaringan.
- [ ] **Responsive Embed Video/Foto:** Terapkan komponen `<Image>` Next.js dan utilitas `aspect-ratio` Tailwind untuk asset media.
- [ ] **Dashboard Analytics:** Buat grafik visual (Chart) di halaman beranda Admin untuk memantau data SIMMAG secara keseluruhan.
- [ ] **Desktop to Mobile Responsive:** Optimasi semua tabel panjang menjadi bentuk card mobile yang responsif.
- [ ] **Web App Manifest:** Buat `manifest.json` dan setup PWA agar website bisa di-add to homescreen di HP siswa.

## OPTIONAL
- [ ] **Export Data Presensi ke Excel/PDF** 