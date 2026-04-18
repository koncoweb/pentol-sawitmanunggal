# Changelog

## 2026-04-11

### Added
- Menambahkan dokumentasi requirement teknis aplikasi di `requirement.md`.
- Menyusun ulang dokumentasi frontend untuk panduan arsitektur dan alur offline-first di `docs/Frontend.md`.
- Menyusun ulang dokumentasi backend untuk panduan data flow, sinkronisasi, dan operasional di `docs/Backend.md`.

### Changed
- Memperkuat sinkronisasi master offline:
  - menambahkan guard agar sync master tidak berjalan paralel,
  - menambahkan transaksi SQLite agar sync master atomic,
  - mengubah strategi refresh master lokal menjadi refresh penuh dataset untuk mencegah data parsial.
- Memperbaiki alur refresh data dropdown di form input panen:
  - menambahkan invalidasi cache master data setelah sync,
  - menambahkan force refresh data divisi/gang/blok/pemanen/tph setelah sync awal, reconnect, dan periodic sync.
- Menambahkan fallback query schema pada sinkronisasi master Neon -> SQLite untuk kompatibilitas kolom lama/baru:
  - divisi (`rayon_id` atau `region_name`),
  - pemanen (`nik/status_aktif` atau `operator_code/active`),
  - tph (`name` atau `nomor_tph`).
- Menyaring data master invalid/null-critical sebelum insert ke SQLite agar proses sync tidak gagal total akibat baris rusak.
- Menyamakan strategi query online di hook offline-data dengan fallback schema yang sama seperti sinkronisasi master.
- Menambahkan normalisasi data master sebelum write ke SQLite:
  - deduplikasi per `id`,
  - validasi relasi parent-child (`divisi -> gang/blok -> pemanen/tph`),
  - sanitasi nilai kosong agar tidak memicu constraint error.
- Menambahkan verifikasi integritas hasil write master data di SQLite sebelum `COMMIT`:
  - membandingkan jumlah data lokal per tabel dengan jumlah data hasil normalisasi,
  - membatalkan transaksi jika ada mismatch agar tidak menghasilkan snapshot lokal yang tidak sesuai.
- Memperbaiki binding parameter SQLite agar `NULL` tetap disimpan sebagai `NULL` (tidak dipaksa menjadi string kosong).
- Memperbaiki mekanisme lock sinkronisasi (`syncMasterData` dan `syncHarvestQueue`) agar:
  - tidak stuck saat koneksi DB gagal sebelum proses utama,
  - caller berikutnya menunggu proses sync aktif yang sama (shared promise) alih-alih return semu.
- Menyetel ulang penutupan client DB agar kegagalan `end()` tidak mengunci status sinkronisasi.
- Mengubah pengambilan data dropdown di form input panen menjadi sumber lokal SQLite yang konsisten untuk mencegah cache campuran online/offline saat jaringan tidak stabil.
- Mengaktifkan konfigurasi runtime SQLite:
  - `PRAGMA journal_mode=WAL`,
  - `PRAGMA foreign_keys=ON`,
  - `enableChangeListener` saat membuka database lokal.
- Mengubah write transaction sinkronisasi master ke mode transaksi eksklusif (dengan fallback aman) agar operasi sinkronisasi tetap terisolasi dari query async lain.
- Menambahkan invalidasi cache dropdown berbasis `SQLite.addDatabaseChangeListener` untuk tabel master (`divisi`, `gang`, `blok`, `pemanen`, `tph`).
- Menambahkan shim type lokal untuk `@tencentcloud/chat-uikit-react-native` dan alias path TypeScript agar typecheck aplikasi tidak memproses deklarasi tipe bawaan package yang tidak kompatibel.
- Menyesuaikan dependency React Hooks pada `chat.tsx`, `input-panen.tsx`, dan `app/_layout.tsx` agar inisialisasi sinkronisasi/chat lebih konsisten dan tidak memicu warning dependency kritis.
- Menyesuaikan konfigurasi auth client mobile agar endpoint Better Auth tidak fallback ke `localhost` di Expo Go, dengan fallback URL runtime yang kompatibel device.
- Menambahkan konfigurasi `expo.extra.neonAuthUrl` pada `app.json` agar URL auth tetap tersedia saat env lokal belum dimuat.
- Menyesuaikan konfigurasi database client mobile agar endpoint Neon database untuk sinkronisasi tidak gagal di Expo Go saat env runtime tidak termuat.
- Menambahkan guard sinkronisasi master/queue untuk melakukan graceful skip saat konfigurasi database Neon belum tersedia di runtime, sehingga tidak memicu error berulang di layar input panen.
- Menambahkan retry bertahap pada transaksi write master saat SQLite melaporkan `database is locked`.
- Menunda refresh dropdown berbasis listener selama fase bootstrap sinkronisasi awal di form input panen untuk mengurangi konflik baca/tulis SQLite.
- Menambahkan guard koneksi internet pada halaman chat agar inisialisasi TUIKit/Chat engine tidak dijalankan saat offline, sehingga tidak memunculkan error UserSig.
- Menambahkan fallback query master data yang mempertimbangkan hasil kosong (bukan hanya error) untuk tabel `blok`, `pemanen`, dan `tph` agar sinkronisasi tetap kompatibel saat variasi schema/relasi menyebabkan query join menghasilkan 0 row.
- Menyesuaikan pengambilan master data `pemanen` dan `tph` agar tidak bergantung pada join untuk memperoleh `divisi_id`; pemetaan `divisi_id` dihitung dari relasi lokal (`pemanen.gang_id -> gang.divisi_id`, `tph.blok_id -> blok.divisi_id`) untuk mencegah dropdown kosong saat data relasi parsial.
- Menyesuaikan konfigurasi `app.json` agar lolos validasi schema Expo:
  - menghapus `android.minSdkVersion` (mengandalkan `expo-build-properties`),
  - mengganti `icon`, `android.adaptiveIcon.foregroundImage`, dan `splash.image` ke asset PNG.
- Menyelaraskan dependency dengan versi yang diharapkan oleh Expo SDK:
  - menurunkan `react-native-worklets` ke versi yang kompatibel,
  - menghapus `@types/react-native` (tipe sudah dibundel oleh `react-native`).
- Menyesuaikan Android `compileSdkVersion` dan `targetSdkVersion` ke 35 untuk memenuhi requirement dependency AndroidX terbaru saat build release/preview.

### Fixed
- Mengurangi risiko dropdown offline tampil tidak lengkap akibat:
  - data master lokal parsial setelah sync gagal di tengah,
  - cache dropdown yang stale setelah download/sinkron data master.
- Mengurangi risiko perbedaan isi dropdown online vs offline saat terjadi variasi struktur kolom Neon antar environment.
- Memperbaiki kegagalan login `network error` di Expo Go akibat fallback endpoint auth yang tidak bisa diakses dari perangkat fisik.
- Memperbaiki kegagalan sinkronisasi master/queue (`Database connection string is missing` / `Database configuration error`) di Expo Go dengan fallback konfigurasi runtime database.
- Mengurangi error startup form input panen terkait `NativeDatabase.execAsync ... database is locked` saat sync master berjalan bersamaan dengan pembacaan data dropdown.
- Mengurangi error saat membuka halaman chat di kondisi offline dengan membatalkan proses inisialisasi chat dan menampilkan notifikasi offline.
- Memperbaiki stabilitas ambil/upload foto di Android build dengan menyimpan foto offline lewat penulisan base64 ke storage aplikasi dan memastikan permission galeri diminta sebelum membuka image picker.

### Notes
- Verifikasi command proyek berhasil dijalankan: `npm run typecheck` lulus tanpa error, `npm run lint` lulus dengan warning existing (tanpa error).
- `npx expo-doctor` lulus tanpa temuan.
