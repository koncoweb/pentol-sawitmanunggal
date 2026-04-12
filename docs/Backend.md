# Dokumentasi Backend - PENTOL

## Ringkasan Arsitektur

Backend PENTOL bersifat serverless dan berpusat pada Neon PostgreSQL:
- Database: Neon Postgres
- Auth: Better Auth (schema `neon_auth`)
- Akses data: `@neondatabase/serverless` langsung dari app
- Offline bridge: SQLite lokal + mekanisme sinkronisasi custom

Dokumen ini fokus pada perilaku data dan panduan operasional teknis.

## Komponen Backend di Repo

- `lib/db.ts`  
  Koneksi client PostgreSQL memakai `EXPO_PUBLIC_NEON_DATABASE_URL`.

- `lib/auth-client.ts`  
  Better Auth client untuk login/session/reset.

- `lib/offline/sync.ts`  
  Sinkronisasi:
  - `syncMasterData` untuk master data
  - `syncHarvestQueue` untuk antrean transaksi offline

- `supabase/migrations/*.sql`  
  Riwayat DDL yang membentuk schema saat ini.

## Data Model Inti

### Schema `public` (utama)
- Master: `divisi`, `gang`, `blok`, `tph`, `pemanen`, `estates`, `rayon`, `vehicles`, `drivers`, `loaders`
- Transaksi: `harvest_records`, `harvest_photos`, `spb`, `spb_items`, `spb_loaders`, `harvest_assignments`
- Identitas aplikasi: `profiles`

### Schema `neon_auth`
- `user`, `session`, `account`, `verification`, dll untuk lifecycle autentikasi.

## Alur Sinkronisasi Offline

### 1) Downsync master (Neon → SQLite)

Master data yang dipakai dropdown di form input panen:
- `divisi`
- `gang`
- `blok`
- `pemanen`
- `tph`

Perubahan terbaru:
- Sinkronisasi master sekarang:
  - memakai lock proses (`isSyncingMaster`) agar tidak paralel,
  - memakai transaksi SQLite (atomic),
  - refresh penuh dataset untuk mencegah data parsial.

### 2) Upsync queue (SQLite → Neon)

Data panen offline disimpan ke `harvest_records_queue` lalu dikirim saat online:
- upload foto ke `harvest_photos`,
- insert data utama ke `harvest_records`,
- update status queue ke `synced`/`error`.

## Risiko Teknis yang Harus Dijaga

- Koneksi DB dari client app berarti env URL DB sangat sensitif.
- Sinkronisasi master perlu tetap atomic setiap ada perubahan query master.
- Perubahan schema master Neon harus diikuti perubahan schema SQLite + sinkronisasi.
- Cache UI tidak boleh dijadikan source of truth.

## Pedoman Perubahan Backend

Saat menambah/mengubah tabel yang dipakai offline dropdown:
1. Ubah migration/schema server.
2. Ubah `lib/offline/schema.ts` jika butuh mirror lokal.
3. Ubah query `syncMasterData` untuk tabel baru/kolom baru.
4. Ubah `lib/offline/hooks.ts` agar fallback online/offline tetap konsisten.
5. Uji:
   - sync master sukses,
   - dropdown online/offline konsisten,
   - queue transaksi tetap bisa sync.

## Checklist Operasional

- Cek project Neon aktif dan branch default.
- Cek jumlah data master Neon vs SQLite setelah sync.
- Cek tabel orphan (integritas relasi master).
- Cek queue `pending/error` secara berkala.
- Cek error sinkronisasi foto jika ada banyak retry.

## Catatan Keamanan

- Jangan commit token/API key/connection string ke repo.
- Hindari menampilkan secret di log.
- Gunakan role DB dan policy yang minimal sesuai kebutuhan.

#### Asisten
- SELECT: All data in own divisi
- UPDATE: User assignments in divisi
- VIEW: KPI reports for divisi

#### Senior Asisten
- SELECT: All data in own rayon (multiple divisi)
- VIEW: KPI reports for rayon
- EXPORT: Reports (Rayon level)

#### Estate Manager
- SELECT: All data in estate (all divisi)
- VIEW: Comprehensive reports
- EXPORT: Reports

#### Regional GM
- SELECT: All data across regions
- VIEW: Regional analytics
- EXPORT: Regional reports

#### General Manager
- SELECT: All company data
- VIEW: Corporate analytics
- EXPORT: Corporate reports

#### Administrator
- SELECT: auth.users, profiles
- INSERT/UPDATE/DELETE: User management
- VIEW: System logs

## Security Implementation

### Row Level Security (RLS)

Keamanan data di Neon dikelola langsung di level database menggunakan PostgreSQL RLS. Setiap session dari Better Auth membawa ID user yang divalidasi oleh database.

```sql
-- Example: User hanya bisa melihat data di divisinya
CREATE POLICY "Users can view records in their division"
  ON harvest_records FOR SELECT
  USING (divisi_id IN (
    SELECT divisi_id FROM profiles WHERE id = auth.uid()
  ));
```

### Authentication Check

Setiap request ke Neon via serverless driver dapat dikonfigurasi untuk menyertakan token autentikasi jika menggunakan proxy atau middleware, namun dalam setup saat ini, Better Auth mengelola session di sisi client dan server.

## Error Handling

### Common Errors

#### Database Errors
```typescript
{
  message: "relation 'table' does not exist",
  code: "42P01"
}
```

#### Authentication Errors
```typescript
{
  message: "Invalid email or password",
  status: 401
}
```

### Error Handling Pattern

```typescript
try {
  const client = await getDbClient();
  const { rows } = await client.query('SELECT * FROM table');
  return rows;
} catch (error) {
  console.error('Database Error:', error);
  throw error;
}
```

## Performance Optimization

### Query Optimization

1. **Select only needed columns**
```sql
SELECT id, name FROM pemanen; -- ✅ Good
SELECT * FROM pemanen;        -- ❌ Avoid
```

2. **Use Indexes**
Pastikan kolom yang sering digunakan dalam `WHERE` atau `JOIN` (seperti `divisi_id`, `tanggal`) memiliki index.

## Environment Variables

### Required Variables

```env
DATABASE_URL=postgres://user:pass@host/db  # Neon Connection String
EXPO_PUBLIC_AUTH_URL=http://localhost:3000 # Better Auth URL
```

### Security Notes

- ✅ Anon key aman untuk client-side (RLS protection)
- ❌ NEVER expose service_role_key di client
- ✅ Environment variables menggunakan EXPO_PUBLIC_ prefix

## Logging & Monitoring

### Current Status
- Console logging untuk sinkronisasi offline.
- Neon Dashboard untuk monitoring query performance dan autoscaling.

## Database Migrations

### Management
Migrations dikelola menggunakan SQL scripts yang dijalankan di Neon Console atau via tools migrasi database.

### Best Practices
- ✅ Gunakan `IF NOT EXISTS` untuk idempotency.
- ✅ Lakukan backup sebelum menjalankan migrasi besar.
- ✅ Gunakan `ALTER TABLE` untuk perubahan skema di production.

## Testing

### Current Status
- Manual testing melalui mobile app.
- Sinkronisasi diuji dengan mensimulasikan kondisi offline/online.

## Deployment

### Neon Project
- **Environment**: Production.
- **Region**: Singapore (aws-ap-southeast-1) untuk low latency.
- **Autoscaling**: Enabled (0.25 - 1 CU).

### Updates & Rollback
- Schema changes: Applied via migrations
- Rollback: Manual via Neon Dashboard
- Zero-downtime deployments untuk RLS policy updates
