# 🚀 Quick Start - Sawit Manunggal

## Setup dalam 5 Menit

### Langkah 1: Install Dependencies

```bash
npm install
```

### Langkah 2: Start Aplikasi

```bash
npm run dev
```

Aplikasi akan terbuka di browser otomatis (biasanya `http://localhost:8081`)

### Langkah 3: Setup Dummy Users

**Anda akan melihat login screen. Jangan login dulu - belum ada user!**

1. **Klik link "Setup Dummy Users untuk Testing"** di bagian bawah login screen

   ATAU

   Navigate manual ke: `http://localhost:8081/setup-users`

2. **Di halaman Setup Users:**
   - Klik tombol **"1. Buat Users"**
   - Tunggu hingga muncul 6 checkmarks ✅
   - Klik tombol **"2. Update Profiles"**
   - Success alert akan muncul

3. **Assign Divisi dan Gang:**

   Buka **Supabase Dashboard** (https://supabase.com/dashboard)
   - Pilih project Anda
   - Go to **SQL Editor**
   - Copy-paste SQL berikut:

```sql
-- Assign Divisi & Gang
UPDATE profiles SET
  divisi_id = (SELECT id FROM divisi WHERE name = 'Divisi A' LIMIT 1),
  gang_id = (SELECT g.id FROM gang g JOIN divisi d ON g.divisi_id = d.id
             WHERE d.name = 'Divisi A' AND g.name = 'Gang 1' LIMIT 1)
WHERE email IN ('krani.panen@sawitmanunggal.com', 'mandor@sawitmanunggal.com');

UPDATE profiles SET
  divisi_id = (SELECT id FROM divisi WHERE name = 'Divisi A' LIMIT 1)
WHERE email IN ('krani.buah@sawitmanunggal.com', 'asisten@sawitmanunggal.com');
```

   - Klik **"Run"**
   - Jika success, akan muncul "Success. No rows returned"

4. **Kembali ke login page:**
   - Klik tombol **"Ke Login"** di setup page
   - ATAU navigate ke root `/`

### Langkah 4: Test Login

Login dengan salah satu akun berikut:

| Role | Email | Password |
|------|-------|----------|
| **Krani Panen** | krani.panen@sawitmanunggal.com | panen123 |
| **Krani Buah** | krani.buah@sawitmanunggal.com | buah123 |
| **Mandor** | mandor@sawitmanunggal.com | mandor123 |
| **Asisten** | asisten@sawitmanunggal.com | asisten123 |
| **Estate Manager** | estate@sawitmanunggal.com | estate123 |
| **Regional GM** | regional@sawitmanunggal.com | regional123 |

**Expected Result:**
- ✅ Login berhasil
- ✅ Redirect otomatis ke dashboard sesuai role
- ✅ Header menampilkan nama user
- ✅ Tab navigation sesuai role

---

## ✅ Verification Checklist

Setelah setup, test hal berikut:

### Test 1: Krani Panen
```
Login: krani.panen@sawitmanunggal.com / panen123
Expected: Dashboard Krani Panen
Tabs visible: Beranda, Profil
```

### Test 2: Mandor
```
Login: mandor@sawitmanunggal.com / mandor123
Expected: Dashboard Mandor
Tabs visible: Beranda, Approval, Profil
```

### Test 3: Estate Manager
```
Login: estate@sawitmanunggal.com / estate123
Expected: Dashboard Estate Manager
Tabs visible: Beranda, Laporan, Monitoring, Profil
```

---

## 🐛 Troubleshooting

### "Invalid login credentials"

**Kemungkinan penyebab:**
1. Users belum dibuat → Jalankan setup page
2. Typo di email/password → Check case-sensitive
3. Email belum confirmed → Users dari setup page otomatis confirmed

**Solution:**
- Clear browser cache
- Buka `/setup-users` lagi
- Re-run "Buat Users"

### Login berhasil tapi profil tidak muncul

**Kemungkinan penyebab:**
- Profile trigger tidak jalan
- Role tidak ter-set

**Solution:**
```sql
-- Check profiles
SELECT email, full_name, role FROM profiles
WHERE email LIKE '%@sawitmanunggal.com';
```

Jika role NULL, jalankan "Update Profiles" di setup page.

### Dashboard tidak sesuai role

**Kemungkinan penyebab:**
- Role salah di database
- Cache issue

**Solution:**
1. Logout
2. Clear browser storage (F12 → Application → Clear storage)
3. Login ulang

---

## 📚 Next Steps

Setelah berhasil login:

1. **Explore Dashboards** - Test semua 6 role
2. **Check Navigation** - Test tab routing
3. **View Profile** - Verify user info
4. **Read Documentation:**
   - `CREDENTIALS.md` - Detail semua akun
   - `TESTING_GUIDE.md` - Comprehensive testing guide
   - `docs/Features.md` - Feature specifications

---

## 💡 Tips

- **Quick role switching**: Logout → Login dengan akun role lain
- **Test all roles**: Setiap role punya dashboard berbeda
- **Check console**: Buka browser DevTools untuk debug
- **SQL Editor**: Gunakan untuk manual data verification

---

## 🆘 Need Help?

Jika masih ada masalah:
1. Check browser console untuk errors
2. Verify Supabase connection di Network tab
3. Check `.env` file sudah benar
4. Review logs di Supabase Dashboard

---

**Version:** 1.0.0
**Last Updated:** 2026-01-10
