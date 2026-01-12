# 🔐 Akun Dummy untuk Testing - Sawit Manunggal

## ⚠️ SETUP REQUIRED

Akun dummy belum dibuat otomatis. Ikuti salah satu metode berikut untuk membuat akun testing.

## 🚀 Metode 1: Via Setup Page (TERCEPAT)

1. **Start aplikasi:**
```bash
npm run dev
```

2. **Buka Setup Page:**
   - Navigate ke: `http://localhost:8081/setup-users` (atau URL dev server Anda)
   - Atau tambahkan `/setup-users` di browser

3. **Klik tombol "1. Buat Users"**
   - Tunggu hingga semua 6 users dibuat

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
- Divisi: All (Akses ke semua region)
- Gang: -

**Akses Dashboard:**
- Dashboard Regional
- Perbandingan Estate
- Analytics
- Reports
- Profile

---

## 🔧 Cara Testing

### 1. Login ke Aplikasi

```bash
npm run dev
```

Buka browser dan akses aplikasi.

### 2. Test Setiap Role

**Testing Flow:**
1. Login dengan salah satu akun di atas
2. Verifikasi dashboard yang muncul sesuai role
3. Cek menu tabs yang tersedia
4. Test navigation antar menu
5. Logout
6. Ulangi dengan role lain

### 3. Test Routing

**Expected Behavior:**
- ✅ Login dengan Krani Panen → Dashboard Krani Panen
- ✅ Login dengan Krani Buah → Dashboard Krani Buah
- ✅ Login dengan Mandor → Dashboard Mandor + Tab Approval
- ✅ Login dengan Asisten → Dashboard Asisten + Tab Monitoring
- ✅ Login dengan Estate Manager → Dashboard Estate + Tabs Reports & Monitoring
- ✅ Login dengan Regional GM → Dashboard Regional + Tabs Reports & Analytics

### 4. Test Tab Navigation

Setiap role memiliki tab berbeda:

| Role | Tabs Visible |
|------|-------------|
| Krani Panen | Dashboard, Profile |
| Krani Buah | Dashboard, Profile |
| Mandor | Dashboard, Approval, Profile |
| Asisten | Dashboard, Monitoring, Profile |
| Estate Manager | Dashboard, Reports, Monitoring, Profile |
| Regional GM | Dashboard, Reports, Analytics, Profile |

---

## 🔒 Security Notes

### ⚠️ PENTING

- **Password ini adalah dummy untuk testing saja**
- **JANGAN gunakan di production**
- **Ganti semua password sebelum deploy**

### Production Setup

Untuk production:
1. Hapus semua akun dummy
2. Buat akun baru dengan password yang kuat
3. Gunakan 2FA jika memungkinkan
4. Implement password reset functionality
5. Set password expiry policy

---

## 🐛 Troubleshooting

### Login Gagal
**Problem:** "Invalid login credentials"

**Solution:**
1. Check email dan password (case-sensitive)
2. Pastikan koneksi ke Supabase aktif
3. Check `.env` file sudah benar

### Dashboard Tidak Sesuai Role
**Problem:** Login berhasil tapi dashboard salah

**Solution:**
1. Check role di database (tabel profiles)
2. Clear browser cache
3. Logout dan login ulang
4. Check navigation logic di `app/(tabs)/_layout.tsx`

### Tidak Bisa Akses Menu Tertentu
**Problem:** Tab menu tidak muncul

**Solution:**
1. Check role-based tab visibility di `_layout.tsx`
2. Verifikasi profile loaded dengan benar
3. Check console untuk errors

---

## 📊 Database Verification

Untuk verifikasi akun di database:

```sql
-- Check semua dummy users
SELECT
  p.email,
  p.full_name,
  p.role,
  d.name as divisi_name,
  g.name as gang_name
FROM profiles p
LEFT JOIN divisi d ON p.divisi_id = d.id
LEFT JOIN gang g ON p.gang_id = g.id
WHERE p.email LIKE '%@sawitmanunggal.com'
ORDER BY p.email;
```

---

## 📞 Support

Jika menemukan masalah:
1. Check console browser untuk errors
2. Verifikasi Supabase connection
3. Check network tab untuk API calls
4. Review logs di Supabase dashboard

---

**Created:** 2026-01-10
**Last Updated:** 2026-01-10
**Version:** 1.0.0
