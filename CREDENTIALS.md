# 🔐 Akun Dummy untuk Testing - HMS - AEP Nusantara Plantations

## ⚠️ SETUP REQUIRED

**Akun dummy belum dibuat otomatis.** Ikuti salah satu metode berikut untuk membuat akun testing.

## 🚀 Metode 1: Via Setup Page (TERCEPAT)

1. **Start aplikasi:**
```bash
npm run dev
```

2. **Buka Setup Page:**
   - Navigate ke: `http://localhost:8081/setup-users` (atau URL dev server Anda)
   - Atau tambahkan `/setup-users` di browser

3. **Klik tombol "1. Buat Users"**
   - Tunggu hingga semua users dibuat

4. **Klik tombol "2. Update Profiles"**
   - Ini akan update role dan nama

5. **Jalankan SQL untuk Divisi/Gang Assignment:**

Buka Supabase Dashboard → SQL Editor, lalu run:

```sql
-- Update assignments
UPDATE profiles SET
  divisi_id = (SELECT id FROM divisi WHERE name = 'Divisi A' LIMIT 1),
  gang_id = (SELECT g.id FROM gang g JOIN divisi d ON g.divisi_id = d.id WHERE d.name = 'Divisi A' AND g.name = 'Gang 1' LIMIT 1)
WHERE email IN ('krani.panen@sawitmanunggal.com', 'mandor@sawitmanunggal.com');

UPDATE profiles SET
  divisi_id = (SELECT id FROM divisi WHERE name = 'Divisi A' LIMIT 1)
WHERE email IN ('krani.buah@sawitmanunggal.com', 'asisten@sawitmanunggal.com');
```

6. **Done! Kembali ke login dan test.**

---

## 🖥️ Metode 2: Via Supabase Dashboard

Lihat panduan lengkap di `scripts/setup-users-simple.md`

---

## Daftar Akun Testing

Setelah setup selesai, gunakan akun berikut untuk testing:

---

## 1. 👷 Krani Panen

**Role:** Krani Panen (Input data panen lapangan)

**Credentials:**
- **Email:** `krani.panen@sawitmanunggal.com`
- **Password:** `panen123`

**Informasi:**
- Nama: Budi Santoso
- Divisi: Divisi A
- Gang: Gang 1

**Akses Dashboard:**
- Input Data Panen
- Grading Buah
- Foto TPH
- Losses Monitoring

---

## 2. 🚛 Krani Buah

**Role:** Krani Buah / Transport

**Credentials:**
- **Email:** `krani.buah@sawitmanunggal.com`
- **Password:** `buah123`

**Informasi:**
- Nama: Andi Wijaya
- Divisi: Divisi A
- Gang: -

**Akses Dashboard:**
- Buat SPB
- Data Truk
- Validasi Muatan
- Cek Restan

---

## 3. 👨‍💼 Mandor

**Role:** Mandor Panen

**Credentials:**
- **Email:** `mandor@sawitmanunggal.com`
- **Password:** `mandor123`

**Informasi:**
- Nama: Hendra Kusuma
- Divisi: Divisi A
- Gang: Gang 1

**Akses Dashboard:**
- Dashboard Mandor
- Approval Data Panen
- Monitoring Target Gang
- Profile

---

## 4. 📊 Asisten

**Role:** Asisten Divisi

**Credentials:**
- **Email:** `asisten@sawitmanunggal.com`
- **Password:** `asisten123`

**Informasi:**
- Nama: Rudi Hartono
- Divisi: Divisi A
- Gang: -

**Akses Dashboard:**
- Dashboard Asisten
- KPI Monitoring Divisi
- Performa Gang
- Monitoring
- Profile

---

## 5. 🏢 Estate Manager

**Role:** Estate Manager

**Credentials:**
- **Email:** `estate@sawitmanunggal.com`
- **Password:** `estate123`

**Informasi:**
- Nama: Bambang Suryanto
- Divisi: All (Akses ke semua divisi)
- Gang: -

**Akses Dashboard:**
- Dashboard Estate Manager
- Performa Divisi
- Reports
- Monitoring
- Profile

---

## 6. 🌍 Regional GM

**Role:** Regional / General Manager

**Credentials:**
- **Email:** `regional@sawitmanunggal.com`
- **Password:** `regional123`

**Informasi:**
- Nama: Ir. Ahmad Yani
- Divisi: All (Akses ke semua divisi)
- Gang: -

**Akses Dashboard:**
- Dashboard Regional
- Global Reports
- Profile

---

## 7. 🛠️ Administrator

**Role:** Administrator (Full Access)

**Credentials:**
- **Email:** `nurrahman.hakim@sawitmanunggal.com`
- **Password:** `rahina112218`

**Informasi:**
- Nama: Nurrahman Hakim
- Divisi: -
- Gang: -

**Akses Dashboard:**
- Manajemen User
- Master Data (Divisi, Gang, Blok, Pemanen, TPH)
- Semua Menu
