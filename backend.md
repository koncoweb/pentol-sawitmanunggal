# Backend Guide - PENTOL

## Stack & Komponen
- Neon PostgreSQL sebagai database utama
- Better Auth untuk autentikasi (`neon_auth` schema)
- Driver DB: `@neondatabase/serverless`
- Sinkronisasi offline: `lib/offline/sync.ts`

## Domain Data
- Master: `divisi`, `gang`, `blok`, `tph`, `pemanen`
- Transaksi: `harvest_records`, `harvest_photos`, `spb*`
- User profile: `profiles`

## Mekanisme Sinkronisasi

### Downsync Master
- Neon → SQLite mirror untuk kebutuhan dropdown offline.
- Strategi terbaru:
  - lock proses sync master,
  - transaksi SQLite atomic,
  - refresh penuh tabel master lokal.

### Upsync Queue
- SQLite queue → Neon saat online.
- Foto diproses dulu ke `harvest_photos`, lalu transaksi panen diinsert.
- Status queue diperbarui jadi `synced` atau `error`.

## Prinsip Operasional
- Jangan commit secret (URL DB/token/API key).
- Setiap perubahan schema master wajib sinkron ke layer offline.
- Pastikan query join untuk `pemanen`/`tph` tetap kompatibel dengan struktur data.
- Lakukan audit periodik:
  - jumlah master Neon vs SQLite,
  - item queue pending/error.

## Referensi Detail
- Detail lengkap backend ada di `docs/Backend.md`.
