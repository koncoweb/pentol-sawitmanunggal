# 🧪 Testing Guide - HMS - AEP Nusantara Plantations

## Overview

Panduan lengkap untuk testing aplikasi HMS - AEP Nusantara Plantations dengan semua role yang tersedia.

## 🚀 Quick Start

### 1. Start Development Server

```bash
npm run dev
```

Aplikasi akan terbuka di browser secara otomatis.

### 2. Login dengan Akun Dummy

Gunakan salah satu akun berikut (lihat `CREDENTIALS.md` untuk detail lengkap):

| Role | Email | Password |
|------|-------|----------|
| Krani Panen | krani.panen@sawitmanunggal.com | panen123 |
| Krani Buah | krani.buah@sawitmanunggal.com | buah123 |
| Mandor | mandor@sawitmanunggal.com | mandor123 |
| Asisten | asisten@sawitmanunggal.com | asisten123 |
| Estate Manager | estate@sawitmanunggal.com | estate123 |
| Regional GM | regional@sawitmanunggal.com | regional123 |

## ✅ Test Cases

### Test Case 1: Login & Auto-Redirect

**Objective:** Verifikasi setiap role diredirect ke dashboard yang benar

**Steps:**
1. Buka aplikasi (akan muncul login screen)
2. Login dengan `krani.panen@sawitmanunggal.com` / `panen123`
3. ✅ Verifikasi: Diredirect ke Dashboard Krani Panen
4. Logout
5. Ulangi untuk setiap role

**Expected Results:**
- ✅ Krani Panen → Dashboard Krani Panen (index)
- ✅ Krani Buah → Dashboard Krani Buah
- ✅ Mandor → Dashboard Mandor
- ✅ Asisten → Dashboard Asisten
- ✅ Estate Manager → Dashboard Estate Manager
- ✅ Regional GM → Dashboard Regional

---

### Test Case 2: Tab Navigation

**Objective:** Verifikasi tab visibility berdasarkan role

**Test untuk Krani Panen:**
1. Login sebagai Krani Panen
2. ✅ Tab yang terlihat: Beranda, Profil
3. ✅ Tab yang hidden: Approval, Monitoring, Reports, Analytics

**Test untuk Krani Buah:**
1. Login sebagai Krani Buah
2. ✅ Tab yang terlihat: Beranda, Profil
3. ✅ Tab yang hidden: Approval, Monitoring, Reports, Analytics

**Test untuk Mandor:**
1. Login sebagai Mandor
2. ✅ Tab yang terlihat: Beranda, Approval, Profil
3. ✅ Tab yang hidden: Monitoring, Reports, Analytics

**Test untuk Asisten:**
1. Login sebagai Asisten
2. ✅ Tab yang terlihat: Beranda, Monitoring, Profil
3. ✅ Tab yang hidden: Approval, Reports, Analytics

**Test untuk Estate Manager:**
1. Login sebagai Estate Manager
2. ✅ Tab yang terlihat: Beranda, Laporan, Monitoring, Profil
3. ✅ Tab yang hidden: Approval, Analytics

**Test untuk Regional GM:**
1. Login sebagai Regional GM
2. ✅ Tab yang terlihat: Beranda, Laporan, Analytics, Profil
3. ✅ Tab yang hidden: Approval, Monitoring

---

### Test Case 3: Dashboard Content

**Objective:** Verifikasi konten dashboard sesuai role

**For Each Role:**
1. Login dengan role tertentu
2. ✅ Header menampilkan nama user yang benar
3. ✅ Role badge menampilkan role yang benar
4. ✅ Menu cards sesuai dengan fungsi role
5. ✅ Stats/metrics sesuai dengan role

**Krani Panen Dashboard Should Show:**
- Welcome message dengan nama "Budi Santoso"
- Role badge "Krani Panen"
- Stats: Data Hari Ini, Pending Approval
- Menu: Input Data Panen, Foto TPH, Grading Buah, Losses Monitoring

**Krani Buah Dashboard Should Show:**
- Welcome message dengan nama "Andi Wijaya"
- Role badge "Krani Buah / Transport"
- Stats: SPB Hari Ini, Truk Terkirim, Restan
- Menu: Buat SPB, Data Truk, Validasi Muatan, Cek Restan

**Mandor Dashboard Should Show:**
- Welcome message dengan nama "Hendra Kusuma"
- Role badge "Mandor Panen"
- Stats: Pending Approval, Target, Realisasi, Anggota Gang
- Task cards dengan urgency badges

**Asisten Dashboard Should Show:**
- Welcome message dengan nama "Rudi Hartono"
- Role badge "Asisten Divisi"
- KPI cards: Achievement, Quality Score, Losses Rate
- Gang performance cards

**Estate Manager Dashboard Should Show:**
- Welcome message dengan nama "Bambang Suryanto"
- Role badge "Estate Manager"
- Summary cards: Produksi, Achievement, Divisi, Pekerja
- Divisi performance list

**Regional GM Dashboard Should Show:**
- Welcome message dengan nama "Ir. Ahmad Yani"
- Role badge "Regional / General Manager"
- Regional statistics grid
- Estate comparison cards

---

### Test Case 4: Profile Screen

**Objective:** Verifikasi profile information

**Steps:**
1. Login dengan salah satu akun
2. Navigate ke tab Profile
3. ✅ Avatar dengan icon user
4. ✅ Nama lengkap yang benar
5. ✅ Role badge yang sesuai
6. ✅ Email yang benar
7. ✅ Divisi assignment (jika ada)
8. ✅ Gang assignment (jika ada)

**Expected Divisi/Gang:**
- Krani Panen: Divisi A, Gang 1
- Krani Buah: Divisi A, no gang
- Mandor: Divisi A, Gang 1
- Asisten: Divisi A, no gang
- Estate Manager: No divisi (access all)
- Regional GM: No divisi (access all)

---

### Test Case 5: Logout Functionality

**Objective:** Verifikasi logout berfungsi dengan benar

**Steps:**
1. Login dengan salah satu akun
2. Click tombol "Keluar" di header (kanan atas)
3. ✅ Diredirect ke login screen
4. ✅ Session cleared
5. Try access dashboard dengan back button
6. ✅ Tetap di login screen (tidak bisa akses)

---

### Test Case 6: Session Persistence

**Objective:** Verifikasi session tetap ada setelah refresh

**Steps:**
1. Login dengan salah satu akun
2. Refresh browser (F5)
3. ✅ Tetap login (tidak kembali ke login screen)
4. ✅ Dashboard tetap menampilkan data yang benar
5. ✅ Profile data tetap tersedia

---

### Test Case 7: Role-Based Access Control

**Objective:** Verifikasi user tidak bisa akses route yang tidak diizinkan

**Manual Test (via URL):**
1. Login sebagai Krani Panen
2. Manually navigate to `/(tabs)/mandor` via URL
3. ✅ Tab tidak visible (tidak bisa akses)
4. Navigate to `/(tabs)/approval`
5. ✅ Tab tidak visible (tidak bisa akses)

**Expected Behavior:**
- User hanya bisa akses tab yang visible untuk role mereka
- Direct URL access ke tab yang tidak diizinkan akan di-block

---

## 🔍 Visual Verification

### Color Scheme Check
- ✅ Primary green (#2d5016) untuk header dan buttons
- ✅ White background untuk cards
- ✅ Consistent spacing dan padding
- ✅ Shadows pada cards untuk depth

### Typography Check
- ✅ Headers bold dan jelas
- ✅ Body text readable (min 12px)
- ✅ Consistent font weights

### Icons Check
- ✅ Icons sesuai dengan fungsi (Home, FileText, etc)
- ✅ Icon size consistent (24px untuk tabs)
- ✅ Icon colors match design

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **No Real Data**: Semua stats menampilkan "0" (backend belum terintegrasi)
2. **Menu Items Inactive**: Menu cards belum terhubung ke functionality
3. **No Camera**: Foto TPH belum terimplementasi
4. **No Reports**: Report generation belum ada
5. **No Charts**: Analytics charts belum ada

### These Are Expected
- Empty states untuk reports, analytics, dan monitoring
- Placeholder data untuk KPI metrics
- Menu buttons belum fully functional

---

## 📊 Testing Checklist

### Authentication ✅
- [x] Login dengan email/password
- [x] Auto-redirect berdasarkan role
- [x] Session persistence
- [x] Logout functionality
- [x] Secure session storage

### Navigation ✅
- [x] Tab navigation
- [x] Role-based tab visibility
- [x] Default route per role
- [x] Back navigation
- [x] Deep linking ready

### UI/UX ✅
- [x] Responsive layout
- [x] Consistent styling
- [x] Loading states
- [x] Profile display
- [x] Role badges

### Data Display ✅
- [x] User information correct
- [x] Role-specific content
- [x] Divisi/Gang assignment
- [x] Empty states

---

## 🚨 Error Scenarios to Test

### Invalid Login
**Test:**
1. Try login dengan email salah
2. ✅ Alert: "Login Gagal"

**Test:**
1. Try login dengan password salah
2. ✅ Alert: "Invalid login credentials"

### Network Issues
**Test:**
1. Stop Supabase connection
2. Try login
3. ✅ Error message muncul

### Session Expiry
**Test:**
1. Login
2. Wait untuk session expire (atau manual clear storage)
3. Try navigate
4. ✅ Redirect ke login

---

## 📝 Reporting Issues

Jika menemukan bug:
1. Note role yang sedang digunakan
2. Screenshot error/issue
3. Steps to reproduce
4. Expected vs Actual behavior
5. Browser & version

---

## ✨ Success Criteria

Aplikasi dianggap berhasil jika:
- ✅ Semua 6 role bisa login
- ✅ Setiap role diredirect ke dashboard yang benar
- ✅ Tab visibility sesuai dengan role
- ✅ Profile information accurate
- ✅ Logout berfungsi dengan benar
- ✅ No TypeScript errors
- ✅ No runtime errors di console

---

**Last Updated:** 2026-01-10
**Version:** 1.0.0
