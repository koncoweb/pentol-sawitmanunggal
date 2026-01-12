# Dokumentasi Backend - PENTOL

## Overview

Backend aplikasi **PENTOL (Pencatatan Online)** - Harvest Management System menggunakan Supabase sebagai Backend-as-a-Service (BaaS) yang menyediakan:
- Authentication
- Database (PostgreSQL)
- Row Level Security (RLS)
- Real-time subscriptions
- Storage (untuk future development)
- Edge Functions (untuk future development)

## Authentication

### Provider
Supabase Auth dengan email/password authentication.

### Configuration

**File:** `lib/supabase.ts`

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### Storage Adapter

Menggunakan custom adapter untuk persistent storage:
- **Web**: localStorage
- **Native**: expo-secure-store

### Auth Methods

#### Sign In
```typescript
await supabase.auth.signInWithPassword({
  email: string,
  password: string
})
```

#### Sign Out
```typescript
await supabase.auth.signOut()
```

#### Get Session
```typescript
const { data: { session } } = await supabase.auth.getSession()
```

#### Auth State Listener
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  // Handle auth state changes
})
```

## Database Client

### Supabase Client Setup

**File:** `lib/supabase.ts`

Client dikonfigurasi dengan:
- Auto refresh token: enabled
- Persist session: enabled
- Detect session in URL: disabled (karena mobile app)
- Custom headers: 'x-client-info' untuk tracking
- Realtime: throttled ke 2 events per second untuk efisiensi

### Performance Optimizations

Untuk meningkatkan performa loading aplikasi, telah diterapkan beberapa optimasi:

#### 1. Query Optimization
- **Select Specific Columns**: Hanya mengambil kolom yang dibutuhkan
  ```typescript
  .select('id, full_name, email, role, divisi_id, gang_id')
  ```
- **Limit Results**: Membatasi jumlah data yang diambil
  ```typescript
  .limit(100)
  ```
- **Parallel Queries**: Menggunakan Promise.all() untuk query paralel
  ```typescript
  const [gangResult, blokResult, pemanenResult, tphResult] = await Promise.all([...])
  ```

#### 2. Connection Optimization
- Mengurangi jumlah round-trip ke database
- Timeout protection untuk mencegah hanging (10 detik timeout)
- Lazy loading: Data hanya dimuat saat dibutuhkan

#### 3. Data Loading Strategy
- **Initial Load**: Hanya load data divisi list
- **On-Demand**: Load data spesifik divisi setelah dipilih
- **Avoid Double Loading**: Menggunakan useEffect dengan dependency yang tepat

### Type Safety

Database types sudah didefinisikan untuk TypeScript:

```typescript
export type Database = {
  public: {
    Tables: {
      profiles: { ... },
      divisi: { ... },
      gang: { ... }
    }
  }
}
```

### Query Examples

#### Get User Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .maybeSingle()
```

#### Get Divisi List
```typescript
const { data, error } = await supabase
  .from('divisi')
  .select('*')
```

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
```typescript
supabase
  .from('harvest_records')
  .select(`
    id, tanggal, created_at, divisi_name, gang_name,
    blok_names, pemanen_details, rotasi, nomor_panen,
    hasil_panen_jjg, nomor_tph, bjr, jumlah_brondolan_kg,
    buah_masak, buah_mentah, buah_mengkal, overripe,
    abnormal, buah_busuk, tangkai_panjang, jangkos,
    keterangan, foto_url, created_by_name
  `)
  .gte('tanggal', startDate)
  .lte('tanggal', endDate)
  .order('tanggal', { ascending: false })
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
Select scope (Divisi/Estate)
Select date range
    ↓
fetchReportData(filter)
    ↓
Query Supabase with filters
    ↓
transformToExportFormat(rawData)
    ↓
exportToExcel() or exportToPDF()
    ↓
File downloaded to user's device
```

### Type Definitions

**ExportRecord:**
```typescript
type ExportRecord = {
  tanggal: string;
  waktu: string;
  krani: string;
  divisi: string;
  gang: string;
  blok: string;
  op: string;
  rotasi: number;
  nama_pemanen: string;
  nomor_panen: number;
  hasil_panen_jjg: number;
  nomor_tph: string;
  bjr: number;
  brondolan_kg: number;
  buah_masak: number;
  buah_mentah: number;
  buah_mengkal: number;
  overripe: number;
  abnormal: number;
  buah_busuk: number;
  tangkai_panjang: number;
  jangkos: number;
  keterangan: string;
};
```

**ReportFilter:**
```typescript
type ReportFilter = {
  startDate: Date;
  endDate: Date;
  divisiId?: string;
  gangId?: string;
};
```

## API Routes

### Current Status
Belum ada API routes custom. Semua operasi menggunakan Supabase client-side queries dengan RLS protection.

### Future API Routes
Untuk fase development selanjutnya, akan ditambahkan:
- `/api/harvest/submit` - Submit data panen
- `/api/harvest/approve` - Approve data panen
- `/api/spb/generate` - Generate SPB
- `/api/reports/daily` - Generate daily reports
- `/api/reports/monthly` - Generate monthly reports

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

#### Estate Manager
- SELECT: All data in estate (all divisi)
- VIEW: Comprehensive reports
- EXPORT: Reports

#### Regional GM
- SELECT: All data across regions
- VIEW: Regional analytics
- EXPORT: Regional reports

## Security Implementation

### Row Level Security (RLS)

Semua query otomatis di-filter oleh RLS policies:

```sql
-- Example: User hanya bisa lihat profil sendiri
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```

### Authentication Check

Setiap request otomatis include JWT token:
```typescript
// Token otomatis disertakan dalam header
Authorization: Bearer <jwt_token>
```

### Rate Limiting

Default Supabase rate limits:
- Anonymous requests: 300 requests/hour
- Authenticated requests: 3000 requests/hour

## Error Handling

### Common Errors

#### Authentication Errors
```typescript
{
  message: "Invalid login credentials",
  status: 400
}
```

#### Permission Errors (RLS)
```typescript
{
  message: "new row violates row-level security policy",
  status: 403
}
```

#### Not Found
```typescript
{
  data: null,
  error: null  // using maybeSingle()
}
```

### Error Handling Pattern

```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select('*')

  if (error) throw error
  return data
} catch (error) {
  console.error('Error:', error)
  // Handle error appropriately
}
```

## Performance Optimization

### Query Optimization

1. **Select only needed columns**
```typescript
.select('id, name, email')  // ✅ Good
.select('*')  // ❌ Avoid when possible
```

2. **Use indexes** - Database sudah di-index untuk foreign keys

3. **Pagination** (future)
```typescript
.range(0, 9)  // First 10 items
```

### Caching Strategy

Current: No caching (semua real-time)

Future considerations:
- Cache reference data (divisi, gang) di client
- Real-time subscription untuk critical data
- Background sync untuk reports

## Environment Variables

### Required Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

### Security Notes

- ✅ Anon key aman untuk client-side (RLS protection)
- ❌ NEVER expose service_role_key di client
- ✅ Environment variables menggunakan EXPO_PUBLIC_ prefix

## Logging & Monitoring

### Current Status
- Console logging untuk development
- Error tracking belum diimplementasikan

### Future Implementation
- Sentry untuk error tracking
- Supabase dashboard untuk monitoring queries
- Custom analytics untuk business metrics

## Database Migrations

### Management
Semua migrations dikelola melalui Supabase Migration Tool via MCP.

### Migration Process
1. Buat migration dengan `mcp__supabase__apply_migration`
2. Migration otomatis ter-apply ke database
3. Schema changes langsung tersedia

### Best Practices
- ✅ Gunakan IF NOT EXISTS untuk idempotency
- ✅ Include detailed markdown documentation
- ✅ Test dengan sample data
- ❌ NEVER gunakan DROP table di production
- ✅ Gunakan ALTER untuk modify existing tables

## Testing

### Current Status
Manual testing through UI

### Future Testing Strategy
- Unit tests untuk Supabase client functions
- Integration tests untuk auth flow
- E2E tests untuk critical paths
- Load testing untuk performance validation

## Deployment

### Supabase Project
- Environment: Production
- Region: Auto-selected by Supabase
- Database: PostgreSQL 15
- Connection pooling: Enabled

### Updates & Rollback
- Schema changes: Applied via migrations
- Rollback: Manual via Supabase dashboard
- Zero-downtime deployments untuk RLS policy updates
