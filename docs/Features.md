# Dokumentasi Fitur - PENTOL

## Overview

**PENTOL (Pencatatan Online)** adalah aplikasi Harvest Management System yang dirancang untuk mendigitalkan seluruh rantai pasok panen kelapa sawit, dari perencanaan hingga pengiriman ke PKS (Pabrik Kelapa Sawit).

## Core Features by Role

### 1. Krani Panen (Lapangan)

**Tujuan:** Input dan dokumentasi data panen di lapangan

#### Fitur Utama

##### A. Input Data Panen
**Status:** ✅ Implemented

**Deskripsi:** Mencatat hasil panen lengkap per lokasi dengan grading dan losses

**Data yang Dicatat:**

**Informasi Umum:**
- Tanggal panen
- Blok (pilih dari master blok)
- Pemanen (pilih dari master pemanen dengan operator code)
- Rotasi panen
- Nomor Panen (opsional)

**Hasil Panen (JJG):**
- Hasil Panen (JJG) - Jumlah Janjang
- BJR (Brondolan Janjang Raw)

**Kriteria Buah:**
- Buah Masak
- Buah Mentah
- Buah Mengkal
- Overripe (buah terlalu matang)
- Abnormal
- Buah Busuk
- Tangkai Panjang
- Jangkos

**Foto Hasil Panen:**
- Ambil foto hasil panen menggunakan kamera device (mobile only)
- Preview foto sebelum submit
- Foto diupload ke Supabase Storage bucket 'harvest-photos'
- Foto bersifat opsional
- Menampilkan loading overlay saat upload foto

**Keterangan:**
- Catatan tambahan (opsional)

**Flow:**
1. Krani membuka menu "Input Data Panen" dari dashboard
2. Aplikasi navigasi ke `/input-panen` (stack navigation)
3. Sistem load master data (divisi list, dan data terkait divisi user)
4. **Informasi Umum:**
   - Auto-fill Nama Krani dari profile (read-only)
   - Pilih Divisi (wajib) dari dropdown - default dari profile, bisa diubah
   - Pilih Tahun Tanam (opsional) dari dropdown (2010-2025)
   - Saat divisi berubah, otomatis reload data Gang, Blok, Pemanen, TPH
5. **Lokasi & Blok:**
   - Pilih Gang (opsional) dari dropdown dengan search
   - Pilih Blok (wajib, bisa lebih dari 1) dari multi-select dropdown dengan search
   - Pilih Nomor Panen (opsional) dari dropdown dengan search
6. **Detail Panen:**
   - Pilih Nama Pemanen (wajib, bisa lebih dari 1) dari multi-select dropdown dengan search
   - Input Rotasi (wajib)
   - Input Nomor Panen (opsional) - editable dropdown (bisa ketik manual atau pilih dari list 1-20)
7. **Hasil Panen (JJG):** Input data BJD dan BJR (semua field opsional dengan default 0)
8. **Kriteria Buah:** Input semua field kriteria buah termasuk Tangkai Panjang dan Jangkos (semua opsional dengan default 0)
9. (Opsional) Ambil foto hasil panen menggunakan kamera:
    - Klik tombol "Ambil Foto Hasil Panen"
    - Request izin kamera (jika belum granted)
    - Buka camera view dengan overlay controls
    - Ambil foto dengan tombol capture
    - Preview foto yang sudah diambil
    - Bisa hapus foto dan ambil ulang jika perlu
10. Tambahkan keterangan jika perlu
11. Simpan data dengan status "draft"
12. Jika ada foto, upload foto ke Supabase Storage
13. Data tersimpan di database dan siap untuk di-submit ke Mandor
14. Auto-navigate back ke dashboard

**Database Tables:**
- `harvest_records` - Menyimpan semua data panen
- `divisi` - Master data divisi
- `gang` - Master data gang/kemandoran
- `blok` - Master data blok kebun
- `pemanen` - Master data pemanen/operator
- `tph` - Master data Tempat Pengumpulan Hasil

**UI/UX Features:**
- **Header Design:**
  - Logo perusahaan AEP di header (kiri atas)
  - Green header dengan title "Input Panen Sawit"
  - Back button di kiri
  - Calendar icon di kanan atas
- **Dropdown Selector** untuk pilihan tunggal (Divisi, Gang, TPH, Tahun Tanam)
  - Modal bottom sheet dengan smooth animation
  - Search functionality untuk list panjang (>5 items)
  - Visual feedback dengan selected state (light green background)
  - Clear placeholder dan label text
- **Multi-Select Dropdown** untuk Blok dan Nama Pemanen
  - Bisa pilih lebih dari 1 item sekaligus
  - Tampilan chip untuk item terpilih
  - Counter jumlah item dipilih
  - Tombol "Hapus Semua" untuk clear selection
  - Checkmark icon untuk item terpilih
  - Tombol "Selesai" di footer modal
  - Search functionality
- **Editable Dropdown** untuk Nomor Panen
  - TextInput yang bisa diketik manual
  - Tombol dropdown di sebelah kanan untuk membuka pilihan
  - List 1-20 tersedia untuk quick select
  - Keyboard type: number-pad
- **Form Layout:**
  - Section-based layout (Informasi Umum, Lokasi & Blok, Detail Panen, dll)
  - Side-by-side fields untuk Divisi & Tahun Tanam, Rotasi & Nomor Panen
  - Auto-filled field untuk Nama Krani (read-only)
  - Dropdown Divisi yang dapat diubah (tidak lagi read-only)
- Input fields dengan keyboard type yang sesuai (number-pad, decimal-pad)
- Form validation untuk field wajib
- Camera integration dengan expo-camera:
  - Fullscreen camera view dengan overlay controls
  - Tombol capture dengan circular design
  - Close button untuk cancel
  - Photo preview dengan opsi hapus
  - Dashed border button untuk trigger camera
- Loading state saat menyimpan data dan upload foto
- Loading overlay dengan progress indicator
- Success alert dan auto-navigate back ke dashboard

##### B. Kriteria Buah
**Status:** ✅ Implemented

**Deskripsi:** Klasifikasi kualitas buah hasil panen yang sudah terintegrasi dalam form Input Panen

**Kategori Kriteria Buah:**
- **Buah Masak** - Buah matang sempurna
- **Buah Mentah** - Buah belum matang
- **Buah Mengkal** - Buah setengah matang
- **Overripe** - Buah terlalu matang
- **Abnormal** - Buah dengan kondisi khusus
- **Buah Busuk** - Buah rusak/busuk
- **Tangkai Panjang** - Buah dengan tangkai yang terlalu panjang
- **Jangkos** - Janjang kosong

**Flow:**
- Data kriteria buah diinput langsung dalam form Input Panen (section "Kriteria Buah")
- Semua field opsional dengan default nilai 0
- Data tersimpan bersamaan dengan data panen

##### C. Foto TPH (Tempat Pengumpulan Hasil)
**Status:** UI Ready, Camera Integration Pending

**Deskripsi:** Dokumentasi visual TPH dengan GPS tagging

**Requirements:**
- GPS aktif (geofencing)
- Foto hanya bisa diambil dalam radius blok yang sesuai
- Prevent location manipulation

**Flow:**
1. Krani buka menu "Foto TPH"
2. Sistem check GPS location
3. Validasi lokasi dalam radius blok
4. Ambil foto TPH
5. Upload dengan GPS metadata

##### D. Losses Monitoring
**Status:** ✅ Terintegrasi dalam Kriteria Buah

**Deskripsi:** Data losses seperti Tangkai Panjang dan Jangkos sekarang sudah terintegrasi dalam form Input Panen sebagai bagian dari Kriteria Buah

**Field Losses dalam Kriteria Buah:**
- Tangkai Panjang - Diinput sebagai bagian dari kriteria buah
- Jangkos - Diinput sebagai bagian dari kriteria buah

**Catatan:**
- Data losses tidak lagi dalam section terpisah
- Sudah terintegrasi untuk memudahkan input dan monitoring

**Impact:**
- Otomatis hitung potongan premi
- Masuk ke KPI Mandor dan Asisten

**Flow:**
1. Krani input jenis dan jumlah losses
2. Sistem hitung denda otomatis
3. Data masuk ke monitoring dashboard

---

### 2. Krani Buah / Transport

**Tujuan:** Mengelola pengiriman buah ke PKS

#### Fitur Utama

##### A. Digital SPB (Surat Pengantar Barang)
**Status:** UI Ready, Backend Pending

**Deskripsi:** Generate surat pengantar untuk pengiriman

**Data yang Diinput:**
- Nomor SPB (auto-generated)
- Nomor Polisi Truk
- Nama Driver
- List janjang dari berbagai blok

**Flow:**
1. Krani Buah buka "Buat SPB"
2. Pilih data panen yang sudah approved
3. Input data truk dan driver
4. Generate SPB digital
5. Print atau kirim digital ke PKS

##### B. Validasi Muatan
**Status:** UI Ready, Backend Pending

**Deskripsi:** Menghitung dan validasi janjang yang dimuat

**Fungsi:**
- Cek jumlah janjang per blok
- Ensure tidak ada janjang tertinggal (Restan)
- Match dengan data approved dari Mandor

**Flow:**
1. Pilih data panen approved
2. Hitung total janjang yang akan dimuat
3. Validasi dengan fisik di lapangan
4. Confirm muatan
5. Generate SPB

##### C. Cek Restan
**Status:** UI Ready, Backend Pending

**Deskripsi:** Monitoring buah yang belum dikirim

**Alert System:**
- Notifikasi jika ada data approved tapi belum SPB
- Warning sebelum akhir hari kerja
- Prevent losses karena buah tertinggal

**Flow:**
1. System auto-check data approved
2. Compare dengan SPB yang sudah dibuat
3. Highlight buah yang belum dikirim
4. Alert ke Krani Buah

---

### 3. Mandor Panen

**Tujuan:** Validasi dan approval data panen

#### Fitur Utama

##### A. Approval Workflow
**Status:** UI Ready, Backend Pending

**Deskripsi:** Validasi data Krani terhadap fisik buah di lapangan

**Proses:**
1. Mandor lihat list pending approval
2. Cek detail data panen dari Krani
3. Validasi fisik di lapangan
4. Approve atau Reject dengan catatan

**Deadline:** Sebelum jam kerja berakhir

**Impact:**
- Approved data → bisa dibuat SPB
- Rejected data → kembali ke Krani untuk revisi

##### B. Daily Achievement Monitoring
**Status:** UI Ready, Backend Pending

**Deskripsi:** Monitoring target vs realisasi harian

**Metrics:**
- Target janjang per Gang (dari RKH)
- Realisasi aktual
- Persentase achievement
- Gap analysis

**Flow:**
1. View target harian
2. Monitor realisasi real-time
3. Alert jika realisasi < target
4. Take action untuk boost performance

##### C. Gang Performance
**Status:** UI Ready, Backend Pending

**Deskripsi:** Monitoring performa anggota gang

**Data yang Ditampilkan:**
- List anggota gang
- Individual achievement
- Quality score per anggota
- Losses rate

---

### 4. Asisten Divisi

**Tujuan:** Monitoring dan management divisi

#### Fitur Utama

##### A. KPI Monitoring
**Status:** UI Ready, Backend Pending

**Deskripsi:** Dashboard KPI untuk seluruh divisi

**KPI yang Dimonitor:**
1. **Achievement vs RKH**
   - Target: ≥ 95%
   - Real-time tracking
   - Per gang breakdown

2. **Quality Score**
   - BMT (Buah Mentah) rate
   - Target: < 2%
   - Akurasi Kriteria Buah

3. **Losses Rate**
   - Total losses per divisi
   - Breakdown per jenis
   - Trend analysis

##### B. Gang Performance Comparison
**Status:** UI Ready, Backend Pending

**Deskripsi:** Perbandingan performa antar gang

**Metrics:**
- Achievement ranking
- Quality comparison
- Productivity per gang
- Best practices sharing

##### C. Divisi Reports
**Status:** UI Ready, Backend Pending

**Deskripsi:** Generate laporan divisi

**Report Types:**
- Daily summary
- Weekly performance
- Monthly comprehensive report
- Export to Excel/PDF

---

### 5. Estate Manager

**Tujuan:** Monitoring dan management estate

#### Fitur Utama

##### A. Estate Dashboard
**Status:** UI Ready, Backend Pending

**Deskripsi:** Overview seluruh estate

**Metrics:**
- Total produksi (Ton)
- Overall achievement (%)
- Total divisi aktif
- Total pekerja aktif

##### B. Divisi Performance
**Status:** UI Ready, Backend Pending

**Deskripsi:** Monitoring performa per divisi

**Data per Divisi:**
- Achievement percentage
- Production volume
- Quality score
- Status indicator

##### C. Comprehensive Reports
**Status:** ✅ Implemented

**Deskripsi:** Laporan lengkap estate dengan fitur export

**Report Types:**
- Laporan Harian (1 hari terakhir)
- Laporan Mingguan (7 hari terakhir)
- Laporan Bulanan (30 hari terakhir)

**Export Features:**
- **Format:** Excel (.xlsx) atau PDF
- **Scope:**
  - Per Divisi (pilih divisi tertentu)
  - Seluruh Estate (semua divisi)
- **Custom Date Range:** Pilih periode tanggal mulai dan tanggal akhir
- **Data yang Diekspor:**
  - Tanggal dan waktu panen
  - Nama krani panen
  - Divisi dan gang
  - Blok dan operator pemanen
  - Rotasi dan nomor panen
  - Hasil panen (JJG)
  - Nomor TPH
  - BJR (Brondolan Janjang Raw)
  - Jumlah brondolan (kg)
  - Kriteria buah lengkap (masak, mentah, mengkal, overripe, abnormal, busuk)
  - Tangkai panjang dan jangkos
  - Keterangan

**Flow Export:**
1. Estate Manager membuka menu "Laporan"
2. Pilih jenis laporan (Harian/Mingguan/Bulanan)
3. Klik tombol download di header
4. Modal export terbuka dengan pilihan:
   - Format: Excel atau PDF
   - Scope: Per Divisi atau Seluruh Estate
   - Pilih divisi (jika per divisi)
   - Custom date range
5. Klik "Export"
6. File otomatis terdownload dengan nama:
   - Format: `laporan_panen_{scope}_{type}_{date}.xlsx/pdf`
   - Contoh: `laporan_panen_divisi_a_monthly_2026-01-11.xlsx`

**Report Contents:**
- Production summary per periode
- Achievement analysis
- Yield monitoring (Ton/Ha)
- BJR (Berat Janjang Rata-rata)
- Quality & Losses score
- Recommendations

---

### 6. Regional / General Manager

**Tujuan:** Monitoring regional dan strategic insights

#### Fitur Utama

##### A. Regional Dashboard
**Status:** UI Ready, Backend Pending

**Deskripsi:** Overview seluruh regional

**Metrics:**
- Total produksi regional (Ton)
- Jumlah estate aktif
- Average achievement
- Regional quality score

##### B. Estate Comparison
**Status:** UI Ready, Backend Pending

**Deskripsi:** Perbandingan performa antar estate

**Comparison Metrics:**
- Achievement ranking
- Production volume
- Quality score
- Efficiency metrics

**Visual Representation:**
- Estate cards dengan status indicator
- Color-coded performance (green/yellow/red)
- Trend arrows (up/down/stable)

##### C. Regional Analytics & Reports
**Status:** ✅ Implemented

**Deskripsi:** Advanced analytics dan insights dengan fitur export regional

**Analytics Features:**
- Trend analysis (monthly/yearly)
- Predictive analytics
- Best practice identification
- ROI analysis
- Strategic recommendations

**Export Features (Same as Estate Manager):**
- **Format:** Excel (.xlsx) atau PDF
- **Scope:**
  - Per Divisi (pilih divisi tertentu)
  - Seluruh Estate/Regional (semua divisi)
- **Custom Date Range:** Pilih periode tanggal mulai dan tanggal akhir
- **Comprehensive Data:** Semua data panen dengan detail lengkap

**Report Types Available:**
- Laporan Harian (1 hari terakhir)
- Laporan Mingguan (7 hari terakhir)
- Laporan Bulanan (30 hari terakhir)

Regional Manager memiliki akses penuh untuk export data dari semua divisi dan estate untuk analisis regional yang komprehensif.

---

## Supporting Features

### 1. Authentication & Authorization

**Status:** ✅ Implemented

**Features:**
- Email/password login
- Secure session management
- Auto-logout on session expire
- Role-based access control

**Security:**
- JWT token authentication
- Row Level Security (RLS)
- Encrypted storage (expo-secure-store)

### 2. Profile Management

**Status:** ✅ Implemented

**Features:**
- View user information
- Display role badge
- Show divisi & gang assignment
- Logout functionality

**Future:**
- Edit profile
- Change password
- Profile photo
- Preferences

### 3. Monitoring Screen

**Status:** ✅ UI Implemented, Backend Pending

**Features:**
- Real-time KPI display
- Progress bars untuk metrics
- Achievement tracking
- Quality monitoring
- Losses tracking

### 4. Reports Screen

**Status:** ✅ Fully Implemented

**Deskripsi:** Sistem pelaporan lengkap dengan format spreadsheet yang menampilkan seluruh data panen beserta foto hasil panen.

#### Fitur Utama

##### A. Jenis Laporan
**Laporan Harian:**
- Data panen 24 jam terakhir
- Quick access untuk monitoring harian
- Real-time update

**Laporan Mingguan:**
- Rekap 7 hari terakhir
- Summary produktivitas
- Trend analysis

**Laporan Bulanan:**
- Data bulan berjalan
- Comprehensive analysis
- Performa per divisi

##### B. Format Tabel Spreadsheet
Laporan ditampilkan dalam format tabel horizontal scrollable dengan kolom:

**Kolom Data Umum:**
- TANGGAL - Tanggal panen (dd/mm/yyyy)
- WAKTU - Waktu input data (HH:mm:ss)
- KRANI - Nama krani yang input data
- DIVISI - Nama divisi/afdeling
- GANG - Nama gang/kemandoran
- BLOK - Nama blok (bisa multiple)
- OP - Operator code pemanen (bisa multiple)
- ROTASI - Rotasi panen
- NAMA PEMANEN - Nama lengkap pemanen (bisa multiple)

**Kolom Hasil Panen:**
- NOMOR PANEN - Nomor panen
- HASIL PANEN (JJG) - Jumlah janjang
- NOMOR TPH - Nomor tempat pengumpulan hasil
- BJR - Brondolan Janjang Raw
- JUMLAH BRONDOLAN (KG) - Berat brondolan dalam kg

**Kolom Kriteria Buah:**
- BUAH MASAK - Jumlah buah masak
- BUAH MENTAH - Jumlah buah mentah
- BUAH MENGKAL - Jumlah buah mengkal
- OVERRIPE - Jumlah overripe
- ABNORMAL - Jumlah abnormal
- BUAH BUSUK - Jumlah buah busuk
- TANGKAI PANJANG - Jumlah tangkai panjang
- JANGKOS - Jumlah jangkos

**Kolom Tambahan:**
- KETERANGAN - Catatan atau keterangan
- FOTO - Thumbnail foto hasil panen

##### C. Fitur Filter
**Filter Divisi:**
- Search/filter berdasarkan nama divisi
- Live filter saat mengetik
- Case-insensitive search

**Filter Tanggal:**
- Filter berdasarkan tanggal panen
- Format dd/mm/yyyy
- Partial match support

**Toggle Filter Panel:**
- Tombol filter di header
- Slide in/out animation
- Minimize space saat tidak digunakan

##### D. Foto Hasil Panen
**Thumbnail Display:**
- Foto ditampilkan sebagai thumbnail 60x60px
- Preview dalam tabel
- Border radius untuk estetika
- Placeholder icon untuk data tanpa foto

**Full Image View:**
- Tap thumbnail untuk view foto full screen
- Modal overlay dengan background gelap
- Pinch to zoom support
- Close button di top-right
- Smooth fade animation

**Image Loading:**
- Lazy loading untuk performa
- Cached images
- Error handling untuk broken images

##### E. UI/UX Features
**Header:**
- Green gradient background (#2d5016)
- Judul laporan dinamis (Harian/Mingguan/Bulanan)
- Counter total data
- Back button
- Filter toggle button

**Table Design:**
- Horizontal scrollable untuk kolom banyak
- Fixed header saat scroll vertikal
- Alternating row colors (white/light gray)
- Cell borders untuk clarity
- Compact font size (11-12px) untuk muat banyak data
- Proper column widths per tipe data

**Performance:**
- Limit 100 records per load
- Optimized query dengan index
- Parallel data loading
- Smooth scrolling

**Responsive:**
- Auto-adjust untuk berbagai screen size
- Touch-friendly cell size
- Optimized untuk mobile dan tablet

##### F. Data Loading Strategy
**Initial Load:**
- Load data sesuai rentang waktu report type
- Show loading indicator
- Error handling

**Query Optimization:**
- Select only needed columns
- Date range filter di database
- Indexed queries untuk speed
- Limit results untuk performa

**Flow:**
1. User buka tab "Laporan"
2. Pilih jenis laporan (Harian/Mingguan/Bulanan)
3. Aplikasi navigasi ke `/report-detail` dengan parameter type
4. Load data dari database sesuai date range
5. Display dalam format tabel spreadsheet
6. User bisa:
   - Scroll horizontal untuk lihat semua kolom
   - Scroll vertical untuk lihat semua data
   - Tap thumbnail foto untuk view full image
   - Filter data berdasarkan divisi/tanggal
   - Close foto modal dengan tap X atau outside

**Database Tables:**
- `harvest_records` - Sumber data utama
- Join dengan master data untuk nama-nama

**Export (Future):**
- Export to Excel/CSV
- Export to PDF
- Email report
- Share report

### 5. Analytics Screen

**Status:** ✅ UI Implemented, Backend Pending

**Features:**
- Trend analysis
- Performance charts
- Comparative analytics
- Insights dashboard

---

## Business Rules

### 1. Traceability
Setiap janjang yang masuk ke PKS harus terhubung dengan:
- Data Blok asal
- Tahun Tanam
- Gang Pemanen
- Tanggal panen
- Kriteria Buah information

### 2. Geofencing
- Dokumentasi foto hanya bisa diambil dalam radius blok yang sesuai
- GPS harus aktif
- Prevent location spoofing
- Validation di backend

### 3. Automatic Penalties
- Sistem otomatis hitung potongan premi
- Berdasarkan input denda losses
- Transparent calculation
- Visible di dashboard

### 4. Restan Warning
- Notifikasi otomatis jika ada janjang approved tanpa SPB
- Alert sebelum akhir hari
- Prevent overnight restan
- Automatic escalation

### 5. Approval Deadline
- Data harus approved sebelum jam kerja berakhir
- Late approval: require special approval
- Track approval time
- Performance metric untuk Mandor

---

## Success Metrics (KPI)

### 1. Achievement vs RKH
**Target:** ≥ 95% realisasi dari rencana

**Calculation:**
```
Achievement = (Actual Production / RKH Target) × 100%
```

**Tracking:**
- Daily basis
- Per gang/divisi/estate
- Trend over time

### 2. Zero Restan
**Target:** 0 janjang tertinggal

**Monitoring:**
- Real-time tracking
- End-of-day check
- Alert system

**Metrics:**
- Restan count
- Restan percentage
- Reason analysis

### 3. Data Accuracy
**Target:** < 0.2% selisih dengan laporan PKS

**Validation:**
- Compare data Krani vs PKS receipt
- Track discrepancies
- Root cause analysis

**Improvement:**
- Training based on errors
- Process refinement
- System enhancement

### 4. Quality Control
**Target:** BMT < 2% dari total produksi

**Monitoring:**
- Real-time grading data
- Trend analysis
- Mandor performance correlation

**Actions:**
- Alert pada high BMT
- Training untuk Krani
- Process improvement

---

## Workflow Process

### 1. Harvest & Transport Flow

```
[Perencanaan]
    ↓
[RKH & Budget] → Target per Blok/Gang
    ↓
[Krani Panen] → Input Data + Kriteria Buah + Foto TPH
    ↓
[Mandor] → Validasi Fisik + Approval
    ↓
[Krani Buah] → Generate SPB + Load Truk
    ↓
[Transport] → Kirim ke PKS
    ↓
[PKS Receipt] → Validation & Payment
    ↓
[Management] → Analytics & Reports
```

### 2. Approval Workflow

```
[Data Input by Krani]
    ↓
[Pending Status]
    ↓
[Mandor Review] → Check Details
    ↓
[Physical Validation] → Field Check
    ↓
├─[Approve] → Data Available for SPB
└─[Reject] → Back to Krani with Notes
    ↓
[Krani Revise] → Resubmit
```

### 3. Daily Operations

**Morning:**
- Review RKH target
- Assign tasks to gang
- Equipment check

**During Harvest:**
- Input data panen
- Real-time grading
- Photo documentation

**Before End of Day:**
- Mandor approval
- Generate SPB
- Load & dispatch trucks

**Evening:**
- Daily reports
- Achievement review
- Plan for next day

---

## System Requirements

### Connectivity
- **Offline-First Storage** - Data disimpan lokal saat offline
- **Smart Sync** - Auto-sync saat online (WiFi/4G)
- **Retry Mechanism** - Auto-retry failed uploads

### Audit Trail
- Track semua perubahan data
- Log user actions
- Prevent data manipulation
- Compliance & accountability

### Performance
- Fast data entry (< 2s per record)
- Quick photo upload
- Real-time dashboard updates
- Responsive UI (< 100ms)

---

## Future Enhancements

### Phase 2 Features

1. **Camera Integration**
   - Native camera access
   - GPS tagging
   - Image compression
   - Offline queue

2. **Offline Mode**
   - Local database (SQLite)
   - Background sync
   - Conflict resolution
   - Sync status indicator

3. **Push Notifications**
   - Approval requests
   - Restan warnings
   - Achievement alerts
   - System announcements

4. **Advanced Analytics**
   - Predictive models
   - Yield forecasting
   - Weather integration
   - Historical comparison

5. **Mobile App (iOS/Android)**
   - Native performance
   - Better offline support
   - Device features access
   - App store distribution

### Phase 3 Features

1. **Integration dengan PKS**
   - Real-time data exchange
   - Auto-reconciliation
   - Payment integration
   - Quality feedback loop

2. **AI/ML Features**
   - Auto-grading dari foto
   - Anomaly detection
   - Optimization recommendations
   - Fraud prevention

3. **Advanced Reporting**
   - Custom report builder
   - Scheduled reports
   - Email distribution
   - Dashboard customization

---

## Permissions Matrix

| Role | Data Access | Validate/Approve | Export Reports | Monitor Targets |
|------|------------|------------------|----------------|-----------------|
| Krani Panen | Own Divisi/Gang | ❌ | ❌ | ❌ |
| Krani Buah | Approved Data | ❌ | ❌ | ❌ |
| Mandor | Own Gang | ✅ | ❌ | ✅ (Gang) |
| Asisten | Own Divisi | ✅ | ✅ | ✅ (Divisi) |
| Estate Manager | All Estate | ✅ | ✅ | ✅ (Estate) |
| Regional GM | All Regions | ❌ | ✅ | ✅ (Regional) |

---

## Glossary

**Terms & Definitions:**

- **RKH** - Rencana Kerja Harian (Daily Work Plan)
- **PKS** - Pabrik Kelapa Sawit (Palm Oil Mill)
- **TPH** - Tempat Pengumpulan Hasil (Harvest Collection Point)
- **SPB** - Surat Pengantar Barang (Delivery Note)
- **JJG** - Janjang (Fresh Fruit Bunch)
- **BMK** - Buah Masak (Ripe Fruit)
- **BMT** - Buah Mentah (Unripe Fruit)
- **JKO** - Janjang Kosong (Empty Bunch)
- **BJR** - Berat Janjang Rata-rata (Average Bunch Weight)
- **Gang** - Kemandoran (Work Group)
- **Divisi** - Afdeling (Division)
- **Brondolan** - Loose fruits that have fallen from bunches
- **Restan** - Unharvested or undelivered fruit
- **Losses** - Fruit left behind or not collected
