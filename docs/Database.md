# Dokumentasi Database - PENTOL

## Overview

Database aplikasi **PENTOL (Pencatatan Online)** - Harvest Management System menggunakan PostgreSQL yang di-host di **Neon Database**. Database dirancang untuk mendukung sistem tracking panen kelapa sawit dengan sinkronisasi offline-first.

## Authentication Schema (Better Auth)

Sistem autentikasi menggunakan **Better Auth**, yang secara otomatis mengelola tabel-tabel berikut:

- `user`: Data profil pengguna (id, email, name, role, dll).
- `session`: Data sesi aktif pengguna.
- `account`: Link ke provider autentikasi.
- `verification`: Data verifikasi email/password.

### User Roles
Role pengguna didefinisikan dalam kolom `role` pada tabel `user`:
- `krani_panen`, `krani_buah`, `mandor`, `asisten`, `senior_asisten`, `estate_manager`, `regional_gm`, `general_manager`, `administrator`.

## Core Tables (Master Data)

### 1. divisi
Menyimpan data divisi/afdeling.
- `id` (uuid, PK)
- `name` (text)
- `estate_name` (text)
- `region_name` (text)

### 2. gang
Menyimpan data gang/kemandoran.
- `id` (uuid, PK)
- `divisi_id` (uuid, FK)
- `name` (text)

### 3. blok
Menyimpan data blok kebun.
- `id` (uuid, PK)
- `divisi_id` (uuid, FK)
- `name` (text)
- `tahun_tanam` (integer)

### 4. pemanen
Menyimpan data pemanen.
- `id` (uuid, PK)
- `divisi_id` (uuid, FK)
- `gang_id` (uuid, FK)
- `nik` (text) - Digunakan sebagai operator code.
- `name` (text)
- `status_aktif` (boolean)

### 5. tph
Tempat Pengumpulan Hasil.
- `id` (uuid, PK)
- `blok_id` (uuid, FK)
- `name` (text) - Nomor TPH.

## Transaction Tables

### 1. harvest_records
Menyimpan data panen harian.
- `id` (uuid, PK)
- `tanggal` (date)
- `divisi_id`, `blok_id`, `pemanen_id`, `tph_id` (uuid, FK)
- `rotasi` (integer)
- `hasil_panen_bjd` (numeric) - Jumlah janjang.
- `bjr`, `buah_masak`, `buah_mentah`, `buah_mengkal`, `overripe`, `abnormal`, `buah_busuk`, `tangkai_panjang`, `jangkos` (integer)
- `jumlah_jjg` (integer)
- `jumlah_brondolan_kg` (numeric)
- `foto_url` (text) - Berisi ID referensi ke `harvest_photos` (format: `db-photo://{id}`).
- `status` (text) - `submitted`, `approved`, `rejected`.
- `created_by` (text) - ID User pembuat.
- `nomor_panen` (text)
- `keterangan` (text)

### 2. harvest_photos
Penyimpanan foto berbasis database untuk menghindari ketergantungan pada Object Storage eksternal.
- `id` (uuid, PK)
- `photo_data` (text) - Data foto dalam format Base64.
- `mime_type` (text) - Contoh: `image/jpeg`.
- `created_at` (timestamp)

## Offline Storage (SQLite)

Mobile app menggunakan SQLite (via `expo-sqlite`) untuk menyimpan data master secara lokal dan mengantrekan transaksi panen.

### Tabel Master (Local Mirror)
Tabel `divisi`, `gang`, `blok`, `pemanen`, dan `tph` direplikasi dari Neon ke SQLite untuk pencarian cepat saat offline.

### Tabel Antrean: `harvest_records_queue`
Menyimpan data panen yang belum terkirim ke server.
- `local_id` (integer, PK AUTOINCREMENT)
- Semua kolom dari `harvest_records` Neon.
- `foto_path` (text) - Path lokal ke file gambar di device.
- `status` (text) - `pending`, `synced`, `error`.
- `sync_error` (text) - Pesan error jika sinkronisasi gagal.

## Performance Optimization

- **Indexes**: Telah diimplementasikan pada kolom `divisi_id`, `tanggal`, dan `status` untuk mempercepat query laporan.
- **Serverless Scaling**: Menggunakan fitur autoscaling Neon untuk menangani beban kerja variabel.
