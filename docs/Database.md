# Dokumentasi Database - PENTOL

## Overview

Database aplikasi **PENTOL (Pencatatan Online)** - Harvest Management System menggunakan PostgreSQL melalui Supabase. Database dirancang untuk mendukung sistem tracking panen kelapa sawit dengan role-based access control.

## Database Schema

### 1. Enums

#### user_role
Enum untuk mendefinisikan role pengguna dalam sistem:
- `krani_panen` - Krani Panen (Lapangan)
- `krani_buah` - Krani Buah/Transport
- `mandor` - Mandor Panen
- `asisten` - Asisten Divisi
- `estate_manager` - Estate Manager
- `regional_gm` - Regional/General Manager

### 2. Tables

#### profiles
Tabel utama untuk menyimpan informasi profil pengguna.

**Columns:**
- `id` (uuid, PK) - Foreign key ke auth.users
- `email` (text, UNIQUE, NOT NULL) - Email pengguna
- `full_name` (text, NOT NULL) - Nama lengkap pengguna
- `role` (user_role, NOT NULL) - Role pengguna dalam sistem
- `divisi_id` (uuid, NULLABLE) - Foreign key ke tabel divisi
- `gang_id` (uuid, NULLABLE) - Foreign key ke tabel gang
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Indexes:**
- Primary key pada `id`
- Unique constraint pada `email`
- Foreign key ke `divisi(id)` dengan ON DELETE SET NULL
- Foreign key ke `gang(id)` dengan ON DELETE SET NULL

**RLS Policies:**
- `Users can view own profile` (SELECT) - User hanya bisa melihat profil sendiri
- `Users can update own profile` (UPDATE) - User hanya bisa update profil sendiri
- `Allow profile creation via trigger` (INSERT) - Membolehkan trigger create profile saat signup (WITH CHECK true untuk bypass auth context)

#### divisi
Tabel untuk menyimpan data divisi/afdeling.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `name` (text, NOT NULL) - Nama divisi
- `estate_name` (text, NOT NULL) - Nama kebun/estate
- `region_name` (text, NOT NULL, DEFAULT 'Region 1') - Nama regional
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**RLS Policies:**
- `Users can view divisi based on their role`
  - Regional GM & Estate Manager: Lihat semua divisi
  - Asisten, Mandor, Krani: Hanya lihat divisi sendiri

#### gang
Tabel untuk menyimpan data gang/kemandoran.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `divisi_id` (uuid, NOT NULL) - Foreign key ke divisi
- `name` (text, NOT NULL) - Nama gang
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**RLS Policies:**
- `Users can view gang based on their role`
  - Regional GM & Estate Manager: Lihat semua gang
  - Asisten: Lihat gang dalam divisi sendiri
  - Mandor: Hanya lihat gang sendiri
  - Krani: Lihat gang dalam divisi sendiri

## Database Functions

### handle_new_user()
Function yang otomatis membuat record di tabel profiles saat ada user baru registrasi.

**Trigger:** `on_auth_user_created` pada tabel `auth.users`

**Security:** `SECURITY DEFINER` dengan `SET search_path = public`

**Logic:**
- Mengambil email dan metadata dari user baru
- Membuat record di tabel profiles dengan default role `krani_panen`
- Metadata `full_name` dan `role` dari `raw_user_meta_data` akan digunakan jika ada
- Include error handling dengan EXCEPTION block untuk prevent user creation failure

**Error Handling:**
- Jika gagal create profile, trigger akan log warning tapi tetap return NEW
- Ini memastikan user tetap bisa dibuat di auth.users walaupun profile gagal

## Row Level Security (RLS)

Semua tabel menggunakan RLS untuk keamanan data:

### Prinsip RLS:
1. **Default Deny** - Semua tabel di-enable RLS dan default tidak bisa diakses
2. **Authenticated Only** - Hanya user yang sudah login yang bisa akses data
3. **Role-Based** - Access control berdasarkan role user
4. **Own Data First** - User selalu bisa akses data sendiri

### Hierarchy Access:
- Regional GM: Full access ke semua data
- Estate Manager: Access ke semua data dalam estate
- Asisten: Access ke data dalam divisi sendiri
- Mandor: Access ke data gang sendiri
- Krani: Access terbatas pada divisi sendiri

## Sample Data

Database sudah terisi dengan sample data:

### Divisi:
1. Divisi 1 - Estate Manunggal 1 (Region Sumatra)
2. Divisi 2 - Estate Manunggal 1 (Region Sumatra)
3. Divisi 3 - Estate Manunggal 1 (Region Sumatra)
4. Divisi 4 - Estate Manunggal 1 (Region Sumatra)
5. Divisi 5 - Estate Manunggal 2 (Region Kalimantan)
6. Divisi 6 - Estate Manunggal 2 (Region Kalimantan)
7. Divisi 7 - Estate Manunggal 3 (Region Sumatra)
8. Divisi 8 - Estate Manunggal 3 (Region Sumatra)

### Gang:
1. Gang A - Divisi 1, 2
2. Gang B - Divisi 1
3. Gang C - Divisi 1, 2, 3, 4

### Blok:
Sample blok sudah ditambahkan untuk semua divisi:
- **Divisi 1 & 2**: A.5, C5, Y.5, I.6, R.6, I.2, I.7, A10
- **Divisi 3**: A.8, B.8, C.8, D.8
- **Divisi 4**: E.9, F.9, G.9, H.9
- **Divisi 5**: I.10, J.10, K.10, L.10
- **Divisi 6**: M.11, N.11, O.11, P.11
- **Divisi 7**: Q.12, R.12, S.12, T.12
- Total: 36 blok dengan tahun tanam, luas (ha), dan jumlah pokok

### Pemanen:
Sample pemanen dengan operator code untuk semua divisi:
- **Divisi 1 & 2**: 2011 - AGUS SANJAYA, 2000 - HADI, 2003 - RIVAN, dan lainnya
- **Divisi 3**: 3001 - AHMAD SUPARDI, 3002 - BUDI RAHMAT, 3003 - TONO SUTRISNO
- **Divisi 4**: 4001 - DEDI HERMAWAN, 4002 - EKO PRASETYO, 4003 - FIRMAN HIDAYAT
- **Divisi 5**: 5001 - GANI SAPUTRA, 5002 - HASAN BASRI, 5003 - IWAN SETIAWAN
- **Divisi 6**: 6001 - JOKO SUSILO, 6002 - KRIS WIBOWO, 6003 - LUKAS MANDALA
- **Divisi 7**: 7001 - MAMAN SURYADI, 7002 - NANDA WIJAYA, 7003 - OKIE PRATAMA
- Total: 27 pemanen aktif

### TPH:
Sample TPH sudah dibuat untuk semua divisi:
- Nomor TPH 1-20 untuk setiap divisi (1, 2, 3, 4, 5, 6, 7)
- Total: 140 TPH aktif

### User Profiles:
Semua user sudah dilengkapi dengan divisi/gang assignment:
- **Budi Santoso** (krani.panen@sawitmanunggal.com) → Divisi 1
- **Andi Wijaya** (krani.buah@sawitmanunggal.com) → Divisi 1
- **Hendra Kusuma** (mandor@sawitmanunggal.com) → Divisi 1, Gang A
- **Rudi Hartono** (asisten@sawitmanunggal.com) → Divisi 1
- **Bambang Suryanto** (estate@sawitmanunggal.com) → Full access (no divisi)
- **Ir. Ahmad Yani** (regional@sawitmanunggal.com) → Full access (no divisi)

## Migration Files

Lokasi: Dikelola oleh Supabase Migration System

**File migration yang sudah ada:**
- `20260110021459_create_initial_schema` - Setup initial schema dengan tabel profiles, divisi, gang, dan RLS policies
- `20260110025220_fix_profiles_insert_policy` - Attempt pertama fix INSERT policy (deprecated)
- `20260110025424_fix_profiles_insert_policy_v2` - Attempt kedua dengan service_role grants (deprecated)
- `20260110025502_fix_profiles_trigger_final` - **Final fix** - Recreate trigger function dengan proper error handling dan RLS bypass
- `20260110030445_create_harvest_tables` - Create tables untuk harvest management: blok, pemanen, tph, harvest_records dengan sample data
- `add_foto_to_harvest_records` - Menambah field foto_url dan foto_thumbnail_url ke harvest_records, setup Supabase Storage bucket dan policies

## Data Types & Conventions

### UUID
- Semua primary key menggunakan UUID
- Default value: `gen_random_uuid()`

### Timestamps
- Format: `timestamptz` (timezone aware)
- Default: `now()` untuk created_at dan updated_at

### Naming Convention
- Table names: lowercase, singular (profiles, divisi, gang)
- Column names: snake_case (divisi_id, created_at)
- Enum values: lowercase with underscore (krani_panen, estate_manager)

## Security Best Practices

1. ✅ RLS enabled pada semua tabel
2. ✅ Restrictive policies - default deny access
3. ✅ Auth check menggunakan `auth.uid()`
4. ✅ Foreign key constraints dengan proper ON DELETE
5. ✅ Unique constraints pada email
6. ✅ Trigger untuk auto-create profile pada user registration

## Troubleshooting

### Trigger Functions dan RLS

**Problem:** Trigger function gagal INSERT ke table dengan RLS enabled

**Symptoms:**
- Error "Database error saving new user" saat signup
- Trigger execute tapi tidak ada data inserted
- User dibuat di `auth.users` tapi tidak ada profile di `profiles`

**Root Cause:**
- RLS policies check `auth.uid()` yang return NULL dalam trigger context
- Function `SECURITY DEFINER` masih respect RLS policies
- Policy WITH CHECK gagal karena tidak ada authenticated session

**Solution:**
1. Gunakan `SECURITY DEFINER` dan `SET search_path` di function
2. Buat INSERT policy dengan `WITH CHECK (true)` untuk bypass auth requirement
3. Tambahkan EXCEPTION handling untuk graceful error
4. Grant EXECUTE permission ke service_role

**Best Practice untuk Trigger Functions:**
```sql
CREATE OR REPLACE FUNCTION trigger_function()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Your logic here
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in trigger: %', SQLERRM;
    RETURN NEW; -- Don't fail the parent operation
END;
$$ LANGUAGE plpgsql;
```

#### blok
Tabel untuk menyimpan data blok kebun.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `divisi_id` (uuid, NOT NULL) - Foreign key ke divisi
- `name` (text, NOT NULL) - Nama blok (C5, A.5, Y.5, dll)
- `tahun_tanam` (integer, NULLABLE) - Tahun tanam blok
- `luas_ha` (decimal, NULLABLE) - Luas blok dalam hektar
- `jumlah_pokok` (integer, DEFAULT 0) - Jumlah pokok dalam blok
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Unique Constraints:**
- Unique pada (divisi_id, name)

**RLS Policies:**
- `Users can view blok based on role` - Regional GM & Estate Manager lihat semua, lainnya lihat divisi sendiri
- `Managers can insert blok` - Regional GM, Estate Manager, Asisten bisa insert
- `Managers can update blok` - Regional GM, Estate Manager, Asisten bisa update

#### pemanen
Tabel untuk menyimpan data pemanen/operator.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `divisi_id` (uuid, NOT NULL) - Foreign key ke divisi
- `gang_id` (uuid, NULLABLE) - Foreign key ke gang
- `operator_code` (text, NOT NULL) - Kode operator (2011, 2000, dll)
- `name` (text, NOT NULL) - Nama pemanen
- `active` (boolean, DEFAULT true) - Status aktif pemanen
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Unique Constraints:**
- Unique pada (divisi_id, operator_code)

**RLS Policies:**
- `Users can view pemanen based on role` - Regional GM & Estate Manager lihat semua, lainnya lihat divisi sendiri
- `Managers can manage pemanen` - Regional GM, Estate Manager, Asisten, Mandor bisa manage

#### tph
Tabel untuk Tempat Pengumpulan Hasil.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `divisi_id` (uuid, NOT NULL) - Foreign key ke divisi
- `blok_id` (uuid, NULLABLE) - Foreign key ke blok
- `nomor_tph` (text, NOT NULL) - Nomor TPH
- `latitude` (decimal, NULLABLE) - GPS latitude
- `longitude` (decimal, NULLABLE) - GPS longitude
- `active` (boolean, DEFAULT true) - Status aktif TPH
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Unique Constraints:**
- Unique pada (divisi_id, nomor_tph)

**RLS Policies:**
- `Users can view tph based on role` - Role-based access
- `Managers can manage tph` - Regional GM, Estate Manager, Asisten, Mandor bisa manage

#### harvest_records
Tabel untuk menyimpan data panen harian.

**Columns:**
- `id` (uuid, PK, DEFAULT gen_random_uuid())
- `tanggal` (date, NOT NULL) - Tanggal panen
- `divisi_id` (uuid, NOT NULL) - Foreign key ke divisi
- `blok_id` (uuid, NOT NULL) - Foreign key ke blok
- `pemanen_id` (uuid, NOT NULL) - Foreign key ke pemanen
- `tph_id` (uuid, NULLABLE) - Foreign key ke TPH
- `rotasi` (integer, NOT NULL) - Rotasi panen
- `hasil_panen_bjd` (decimal, NOT NULL, DEFAULT 0) - Hasil Panen (JJG) - Jumlah Janjang
- `bjr` (integer, DEFAULT 0) - Brondolan Janjang Raw
- `buah_masak` (integer, DEFAULT 0) - Jumlah buah masak (kriteria buah)
- `buah_mentah` (integer, DEFAULT 0) - Jumlah buah mentah (kriteria buah)
- `buah_mengkal` (integer, DEFAULT 0) - Jumlah buah mengkal (kriteria buah)
- `overripe` (integer, DEFAULT 0) - Buah overripe/terlalu matang (kriteria buah)
- `abnormal` (integer, DEFAULT 0) - Buah abnormal (kriteria buah)
- `buah_busuk` (integer, DEFAULT 0) - Buah busuk (kriteria buah)
- `tangkai_panjang` (integer, DEFAULT 0) - Tangkai panjang (kriteria buah)
- `jangkos` (integer, DEFAULT 0) - Jangkos (kriteria buah)
- `keterangan` (text, NULLABLE) - Keterangan tambahan
- `foto_url` (text, NULLABLE) - URL foto hasil panen dari Supabase Storage
- `foto_thumbnail_url` (text, NULLABLE) - URL thumbnail foto untuk preview
- `status` (text, DEFAULT 'draft') - Status: draft, submitted, approved, rejected
- `created_by` (uuid, NOT NULL) - Foreign key ke profiles (krani panen)
- `approved_by` (uuid, NULLABLE) - Foreign key ke profiles (mandor)
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**RLS Policies:**
- `Users can view harvest based on role` - Role-based access
- `Krani panen can insert harvest` - Krani panen bisa insert data panen
- `Creator can update own draft harvest` - Creator bisa update harvest dengan status draft
- `Mandor can approve harvest` - Mandor, Asisten, Estate Manager, Regional GM bisa approve

**Indexes:**
- Index pada tanggal untuk query reporting
- Index pada divisi_id, status, created_by untuk performance

## Supabase Storage

### harvest-photos Bucket
Bucket untuk menyimpan foto hasil panen yang diambil oleh Krani Panen.

**Configuration:**
- **Bucket Name:** `harvest-photos`
- **Public Access:** Yes (untuk kemudahan preview)
- **Folder Structure:** `{user_id}/{timestamp}.jpg`
  - Contoh: `1d12fe51-7cde-4f82-858e-574b48721321/1736475123456.jpg`

**Storage Policies:**
- `Authenticated users can upload harvest photos` (INSERT) - User yang sudah login bisa upload foto
- `Anyone can view harvest photos` (SELECT) - Foto bisa diakses public untuk preview
- `Users can update own harvest photos` (UPDATE) - User bisa update foto sendiri
- `Users can delete own harvest photos` (DELETE) - User bisa delete foto sendiri

**Technical Details:**
- **Format:** JPEG dengan quality 0.7 untuk optimasi size
- **Naming:** Timestamp-based untuk avoid conflicts
- **Upload Flow:**
  1. User ambil foto dengan camera
  2. Foto di-convert ke blob
  3. Upload ke Supabase Storage dengan content-type `image/jpeg`
  4. Get public URL dari Storage
  5. Simpan URL ke field `foto_url` di `harvest_records` table

**Notes:**
- Foto bersifat opsional dan tidak required
- Thumbnail URL reserved untuk future optimization (lazy loading, image resizing)
- File cleanup/retention policy akan diimplementasi di fase berikutnya

## Performance Indexes

Untuk meningkatkan performa query, telah ditambahkan index pada kolom-kolom yang sering diquery:

### Blok Indexes
- `idx_blok_divisi_id`: Index pada divisi_id untuk mempercepat filter per divisi
- `idx_blok_divisi_name`: Composite index pada divisi_id dan name untuk sorting yang lebih cepat

### Pemanen Indexes
- `idx_pemanen_divisi_id`: Index pada divisi_id untuk filter per divisi
- `idx_pemanen_divisi_active`: Composite index pada divisi_id dan active untuk filter pemanen aktif per divisi
- `idx_pemanen_active`: Index pada active untuk filter pemanen aktif

### TPH Indexes
- `idx_tph_divisi_id`: Index pada divisi_id untuk filter per divisi
- `idx_tph_divisi_active`: Composite index pada divisi_id dan active untuk filter TPH aktif per divisi
- `idx_tph_active`: Index pada active untuk filter TPH aktif

### Gang Indexes
- `idx_gang_divisi_id`: Index pada divisi_id untuk filter per divisi

### Harvest Records Indexes
- `idx_harvest_records_divisi_id`: Index pada divisi_id untuk reporting per divisi
- `idx_harvest_records_created_by`: Index pada created_by untuk query data user
- `idx_harvest_records_status`: Index pada status untuk filter berdasarkan status
- `idx_harvest_records_tanggal`: Index pada tanggal untuk reporting by date
- `idx_harvest_records_divisi_tanggal`: Composite index pada divisi_id dan tanggal (DESC) untuk reporting dashboard

**Impact**: Index ini mempercepat query dari detik menjadi milidetik, sangat penting untuk performa di mobile device dengan koneksi internet yang tidak stabil.

## Future Extensions

Tabel yang akan ditambahkan di fase berikutnya:
- `spb` - Surat Pengantar Barang
- `transport` - Data transport dan truk
- Image resizing & thumbnail generation untuk storage optimization
