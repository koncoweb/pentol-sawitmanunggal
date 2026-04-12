# Requirement Teknis Aplikasi PENTOL

## Tujuan Produk

Aplikasi PENTOL dipakai untuk operasional panen sawit dengan kebutuhan utama:
- tetap bisa input data saat internet tidak tersedia,
- sinkronisasi aman saat koneksi kembali,
- konsistensi data master dropdown antara online (Neon) dan offline (SQLite),
- dukungan alur kerja berdasarkan role.

## Requirement Fungsional Utama

### 1. Autentikasi & Otorisasi
- User login menggunakan Better Auth.
- Session user harus menentukan route dan menu sesuai role.
- Role minimal: `krani_panen`, `krani_buah`, `mandor`, `asisten`, `estate_manager`, `regional_gm`, `administrator`.

### 2. Input Panen (Offline-First)
- Form input panen tetap bisa dipakai saat offline.
- Saat offline, data disimpan ke antrean lokal (`harvest_records_queue`).
- Saat online, data dikirim ke Neon dan status antrean diperbarui.
- Jika submit online gagal, wajib fallback ke antrean lokal.

### 3. Data Master Dropdown
- Dropdown `divisi`, `gang`, `blok`, `tph`, `pemanen` harus tersedia saat offline.
- Data master diambil dari Neon lalu dimirror ke SQLite.
- Setelah sync master sukses, data dropdown di UI harus di-refresh dari sumber terbaru.

### 4. Sinkronisasi Master
- Sync master harus atomic (all-or-nothing) di SQLite.
- Sync master tidak boleh berjalan paralel.
- Bila sync gagal, data lama tetap konsisten dan tidak setengah ter-update.
- Sync master harus kompatibel terhadap variasi schema Neon lintas environment (kolom legacy dan kolom terbaru) tanpa menyebabkan kegagalan total.
- Mapping field master online ke SQLite harus deterministik agar hasil dropdown offline sama dengan online.
- Sebelum write ke SQLite, data master harus melalui normalisasi (deduplikasi, sanitasi nilai, validasi relasi) untuk mencegah rollback akibat data anomali.
- Sebelum `COMMIT`, wajib ada verifikasi integritas jumlah data master per tabel di SQLite sesuai hasil normalisasi untuk menjamin kelengkapan data dropdown offline.
- Mekanisme lock sinkronisasi wajib tahan terhadap kegagalan koneksi/inisialisasi (tidak boleh stuck) agar sync berikutnya tetap dapat berjalan.
- Semua trigger sinkronisasi harus menunggu proses sync aktif yang sama (`shared promise`) agar tidak terjadi false-success pada caller lain.
- Runtime SQLite wajib mengaktifkan `PRAGMA journal_mode=WAL` dan `PRAGMA foreign_keys=ON`.
- Operasi write massal master data harus memakai transaksi eksklusif (atau fallback transaksi manual yang setara) agar query lain tidak menyusup ke transaksi aktif.

### 5. Sinkronisasi Queue Panen
- Item antrean status `pending/error` harus dicoba sinkron ulang saat online.
- Upload foto harus ditangani lebih dulu sebelum insert record panen.
- Gagal sinkron harus menyimpan pesan error per item agar bisa ditinjau.

### 6. Monitoring Sinkronisasi
- Tersedia halaman untuk melihat jumlah data lokal dan trigger download master.
- User bisa melihat status antrean pending/error/synced.

## Requirement Non-Fungsional

### Keandalan
- Operasi sinkronisasi harus idempotent dan tahan retry.
- Perubahan koneksi jaringan tidak boleh menyebabkan crash.

### Performa
- Query master data harus efisien untuk dipakai di perangkat mobile.
- Render dropdown harus responsif untuk data puluhan hingga ratusan item.

### Keamanan
- Secret (token, API key, connection string) tidak boleh ditulis di repository.
- Hindari logging data sensitif.

### Maintainability
- Semua perubahan perilaku aplikasi harus diikuti update dokumentasi.
- Struktur kode mengikuti modul: route, service/db, offline sync, reusable component.
- Query master online dan query sinkronisasi master wajib dijaga tetap sejalan agar hasil data dropdown identik antara mode online dan offline.
- Data dropdown form input panen harus dibaca dari sumber lokal yang konsisten setelah sync untuk menghindari cache campuran saat jaringan fluktuatif.
- Cache dropdown wajib memiliki invalidasi berbasis perubahan SQLite (database change listener) agar UI tidak menampilkan data stale setelah sinkronisasi.

## Aturan Perubahan (Wajib)

Jika ada perubahan pada:
- fitur,
- alur kerja aplikasi,
- UX/UI,
- mekanisme sinkronisasi/data,

maka wajib memperbarui:
- `requirement.md`
- `CHANGELOG.md`

## Kriteria Selesai untuk Perubahan Sinkronisasi

Perubahan sinkronisasi dianggap selesai jika:
1. Tidak ada data master parsial setelah proses sync.
2. Dropdown offline konsisten dengan data master Neon.
3. Queue panen tetap berfungsi untuk mode offline.
4. Laporan perubahan dicatat di `CHANGELOG.md`.
