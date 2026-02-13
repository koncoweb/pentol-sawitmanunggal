# Dokumentasi Backend - PENTOL

## Overview

Backend aplikasi **PENTOL (Pencatatan Online)** - Harvest Management System menggunakan arsitektur serverless dengan komponen utama:
- **Database**: Neon Database (PostgreSQL)
- **Authentication**: Better Auth
- **Data Access**: Neon Serverless Driver (HTTP-based)
- **Offline Sync**: Custom synchronization logic antara SQLite (Mobile) dan Neon (Server).

## Authentication

### Provider
Menggunakan **Better Auth** untuk manajemen user, sesi, dan keamanan.

### Configuration
**File:** `lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: process.env.EXPO_PUBLIC_AUTH_URL
})
```

### Auth Methods

#### Sign In
```typescript
await authClient.signIn.email({
  email: string,
  password: string
})
```

#### Sign Out
```typescript
await authClient.signOut()
```

## Database Client

### Neon Client Setup

**File:** `lib/db.ts`

Client dikonfigurasi menggunakan `@neondatabase/serverless` untuk koneksi PostgreSQL via HTTP/WebSockets yang efisien untuk lingkungan mobile/web.

```typescript
import { neonConfig, Pool } from '@neondatabase/serverless';

export const getDbClient = async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
};
```

### Data Storage Strategy

#### 1. Master Data
Data master (Divisi, Blok, Pemanen, dll) disimpan di Neon dan disinkronkan ke SQLite lokal untuk penggunaan offline.

#### 2. Harvest Records
Data transaksi panen yang dikirim dari mobile akan disimpan di tabel `harvest_records`.

#### 3. Photo Storage (Database-based)
Foto hasil panen disimpan langsung di database dalam tabel `harvest_photos` menggunakan kolom `TEXT` (Base64) atau `BYTEA`.
- **Table**: `harvest_photos`
- **Columns**: `id` (UUID), `photo_data` (TEXT/Base64), `mime_type` (TEXT), `created_at` (TIMESTAMP).

## Offline Synchronization Logic

Backend mendukung sinkronisasi dua arah:

### 1. Downward Sync (Master Data)
Mobile menarik data terbaru dari tabel master untuk memastikan operasional lapangan tetap berjalan meskipun tanpa koneksi internet.

Tabel yang disinkronkan:
- `divisi`: Data afdeling/divisi.
- `gang`: Data kemandoran.
- `blok`: Data blok kebun beserta tahun tanam.
- `pemanen`: Data karyawan pemanen (operator).
- `tph`: Data Tempat Pengumpulan Hasil.

### 2. Upward Sync (Transaction Data)
Proses pengiriman data panen dari mobile ke server mengikuti alur:
1. **Photo Upload**: Foto panen diubah menjadi Base64 dan di-insert ke tabel `harvest_photos`.
2. **ID Retrieval**: Server mengembalikan UUID untuk foto tersebut.
3. **Record Insertion**: Data transaksi panen di-insert ke `harvest_records` dengan `foto_url` menggunakan format `db-photo://{UUID}`.
4. **Local Update**: Status di SQLite lokal diubah menjadi `synced`.

## Security & RLS (Row Level Security)

Keamanan data di Neon Database dikelola menggunakan PostgreSQL RLS:

- **Authenticated Users**: Hanya user yang terautentikasi via Better Auth yang dapat mengakses data.
- **Role-based Access**:
    - `krani_panen`: Hanya dapat melihat dan menginput data di divisi mereka sendiri.
    - `mandor`: Dapat melihat dan menyetujui data dari gang/kemandoran mereka.
    - `administrator`: Akses penuh ke seluruh data.

## Report Service & Export

### Overview
Service untuk mengambil data laporan dan export ke format Excel/PDF.

**Files:**
- `lib/reportService.ts` - Service untuk fetch data laporan dari database
- `lib/exportUtils.ts` - Utility functions untuk export ke Excel dan PDF

### Report Service

**File:** `lib/reportService.ts`

#### Functions

##### `fetchReportData(filter: ReportFilter)`
Mengambil data harvest records dari database dengan filter.

**Parameters:**
- `startDate`: Date - Tanggal mulai periode
- `endDate`: Date - Tanggal akhir periode
- `divisiId` (optional): string - Filter per divisi
- `gangId` (optional): string - Filter per gang

**Returns:** `Promise<HarvestRecordRaw[]>`

**Query:**
```sql
SELECT
  hr.id,
  hr.tanggal,
  d.name as divisi_name,
  g.name as gang_name,
  b.name as blok_name,
  p.name as pemanen_name,
  hr.hasil_panen_jjg,
  hr.foto_url
FROM harvest_records hr
LEFT JOIN divisi d ON hr.divisi_id = d.id
LEFT JOIN blok b ON hr.blok_id = b.id
LEFT JOIN pemanen p ON hr.pemanen_id = p.id
LEFT JOIN gang g ON p.gang_id = g.id
WHERE hr.tanggal >= $1 AND hr.tanggal <= $2
```

##### `transformToExportFormat(records: HarvestRecordRaw[])`
Mengubah data raw dari database ke format yang siap export.

**Parameters:**
- `records`: Array of harvest records dari database

**Returns:** `ExportRecord[]` - Array of formatted records

**Transformations:**
- Format tanggal ke 'dd/mm/yyyy'
- Format waktu ke 'HH:mm:ss'
- Join array fields (blok_names, pemanen_details) menjadi string
- Handle null values dengan default empty string

### Export Utils

**File:** `lib/exportUtils.ts`

**Dependencies:**
- `xlsx` - Library untuk Excel export
- `jspdf` - Library untuk PDF generation
- `jspdf-autotable` - Plugin untuk table di PDF

#### Functions

##### `exportToExcel(data: ExportRecord[], filename: string)`
Export data ke format Excel (.xlsx).

**Features:**
- Custom column headers (Bahasa Indonesia)
- Auto column width
- Professional formatting
- Filename dengan timestamp: `{filename}_{YYYY-MM-DD}.xlsx`

**Implementation:**
```typescript
const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Laporan Panen');
XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
```

##### `exportToPDF(data: ExportRecord[], filename: string, title: string)`
Export data ke format PDF landscape dengan table.

**Features:**
- Landscape orientation untuk tabel lebar
- Custom title dan header
- Professional table styling
- Green header sesuai brand (#2d5016)
- Alternating row colors untuk readability
- Auto page breaks
- Filename dengan timestamp: `{filename}_{YYYY-MM-DD}.pdf`

**Implementation:**
```typescript
const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: 'a4',
});

autoTable(doc, {
  head: [headers],
  body: tableData,
  styles: { fontSize: 7, cellPadding: 2 },
  headStyles: { fillColor: [45, 80, 22] },
  alternateRowStyles: { fillColor: [245, 245, 245] }
});

doc.save(`${filename}_${timestamp}.pdf`);
```

### Data Flow

```
User clicks Export
    ↓
ExportModal Component
    ↓
Select format (Excel/PDF)
    ↓
fetchReportData(filter)
    ↓
Query Neon Database via lib/db.ts
    ↓
transformToExportFormat(rawData)
    ↓
exportToExcel() or exportToPDF()
    ↓
File downloaded to user's device
```

## API Routes

### Current Status
Saat ini aplikasi tidak menggunakan API routes custom (Express/Next.js). Semua operasi database dilakukan langsung dari client menggunakan `@neondatabase/serverless` yang mendukung koneksi PostgreSQL via HTTP/WebSockets. Keamanan dikelola melalui PostgreSQL RLS (Row Level Security).

## Data Access Patterns

### By Role

#### Krani Panen
- SELECT: profiles (own), divisi (own), gang (in divisi)
- INSERT: harvest_records, grading, losses (future)

#### Krani Buah
- SELECT: profiles (own), divisi (own), approved harvests
- INSERT: spb, transport_logs (future)

#### Mandor
- SELECT: profiles (own + gang members), gang (own), harvest_records (gang)
- UPDATE: harvest_records.status (approve/reject)

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
