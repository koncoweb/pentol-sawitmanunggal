# Dokumentasi Frontend - PENTOL

## Ringkasan

Frontend PENTOL dibangun dengan Expo + React Native + Expo Router, dengan pendekatan **offline-first**:
- Online: query langsung ke Neon PostgreSQL.
- Offline: baca/tulis ke SQLite lokal.
- Sinkronisasi: master data downsync (Neon → SQLite) dan transaksi panen upsync (SQLite queue → Neon).

## Stack Utama

- Expo SDK 54 (`expo`, `expo-router`)
- React 19 + React Native 0.81
- Auth client: Better Auth (`lib/auth-client.ts`)
- DB client: Neon Serverless (`lib/db.ts`)
- Offline store: `expo-sqlite` (`lib/offline`)
- Network status: `@react-native-community/netinfo`
- UI: RN core + komponen custom (`components/`)

## Struktur Frontend

- `app/_layout.tsx`: root stack + redirect auth.
- `app/(tabs)/_layout.tsx`: tab layout berbasis role.
- `app/(tabs)/profile.tsx`: profile + entry ke sync master (`/sync-master`).
- `app/sync-master.tsx`: layar download/sinkron data master lokal.
- `app/input-panen.tsx`: form input panen online/offline.
- `components/Dropdown.tsx`: dropdown pilihan tunggal.
- `components/EditableDropdown.tsx`: input bebas + pilihan.
- `contexts/AuthContext.tsx`: session/user/profile state.
- `lib/offline/hooks.ts`: helper fetch data master dengan fallback online/offline.

## Alur Form Input Panen

1. Screen mount:
   - Coba `syncMasterData()`.
   - Lanjut `syncHarvestQueue()`.
2. Ambil data dropdown:
   - `getDivisi`, `getGang`, `getBlok`, `getPemanen`, `getTPH`.
3. Submit:
   - Jika offline: simpan ke `harvest_records_queue`.
   - Jika online: insert langsung ke `harvest_records`.
   - Jika online gagal: fallback ke queue lokal.

Referensi:
- `app/input-panen.tsx`
- `lib/offline/sync.ts`
- `lib/offline/hooks.ts`

## Perubahan Penting Terbaru (Reliability Offline Dropdown)

### 1) Sinkronisasi master dibuat lebih aman

- Ditambahkan lock proses master (`isSyncingMaster`) agar tidak race condition antar trigger sync.
- Sinkronisasi master sekarang atomic dengan transaksi SQLite:
  - `BEGIN IMMEDIATE`
  - refresh penuh tabel master lokal
  - `COMMIT` atau `ROLLBACK`

Lokasi perubahan:
- `lib/offline/sync.ts`

### 2) Refresh cache dropdown setelah sync

- Form input panen sekarang mengosongkan cache master lokal di memori dan memuat ulang data setelah:
  - initial sync
  - reconnect sync
  - periodic sync
- `loadDivisiData` sekarang mendukung `forceRefresh`.

Lokasi perubahan:
- `app/input-panen.tsx`

## Best Practices Frontend untuk Tim

- Jangan jadikan cache in-memory sebagai source of truth master data.
- Setelah sinkronisasi master sukses, selalu invalidate cache UI.
- Untuk layar offline-critical, tampilkan indikator:
  - last sync timestamp
  - status sinkronisasi master
- Hindari trigger sync paralel dari banyak screen tanpa lock global.
- Jika menambah dropdown baru untuk mode offline:
  - tambahkan tabel lokal/schema
  - tambahkan downsync query
  - tambahkan fallback hook online/offline
  - tambahkan validasi coverage di layar sync master.

## Checklist Saat Menambah Fitur Frontend

- Apakah route baru sudah masuk flow auth/role?
- Apakah fitur tetap jalan saat offline?
- Apakah data input punya fallback queue?
- Apakah data referensi dropdown tersinkron ke SQLite?
- Apakah state/cache dibersihkan setelah sync?

**Kolom Tabel:**
```
TANGGAL | WAKTU | KRANI | DIVISI | GANG | BLOK | OP | ROTASI |
NAMA PEMANEN | NOMOR PANEN | HASIL PANEN (JJG) | NOMOR TPH |
BJR | BRONDOLAN (KG) | BUAH MASAK | BUAH MENTAH | BUAH MENGKAL |
OVERRIPE | ABNORMAL | BUAH BUSUK | TANGKAI PANJANG | JANGKOS |
KETERANGAN | FOTO
```

#### Analytics Screen
**File:** `app/(tabs)/analytics.tsx`

Features:
- Trend analysis
- Chart placeholder
- Comparative metrics
- Performance insights

#### Profile Screen
**File:** `app/(tabs)/profile.tsx`

Features:
- User information display
- Role badge
- Account details
- App information
- Logout button

## Styling System

### Color Palette

**Primary Colors:**
- Dark Green: `#2d5016` (main brand)
- Medium Green: `#4a7c23`
- Light Green: `#6ba82e`
- Lighter Green: `#8ac449`

**Accent Colors:**
- Background: `#f5f5f5`
- Card Background: `#fff`
- Text Primary: `#333`
- Text Secondary: `#666`
- Text Tertiary: `#999`

**Status Colors:**
- Success: `#2d5016`
- Warning: `#f57c00`
- Error: `#d32f2f`
- Info: `#1976d2`

### Typography

```typescript
{
  // Headers
  h1: { fontSize: 32, fontWeight: '700' },
  h2: { fontSize: 24, fontWeight: '700' },
  h3: { fontSize: 20, fontWeight: '600' },
  h4: { fontSize: 18, fontWeight: '600' },

  // Body
  body: { fontSize: 16, fontWeight: '400' },
  bodySmall: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  tiny: { fontSize: 11, fontWeight: '400' },
}
```

### Component Patterns

#### Card Pattern
```typescript
{
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,  // Android shadow
}
```

#### Badge Pattern
```typescript
{
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
  backgroundColor: color,
}
```

#### Button Pattern
```typescript
{
  padding: 16,
  borderRadius: 8,
  backgroundColor: color,
  alignItems: 'center',
  justifyContent: 'center',
}
```

## Reusable Components

### Dropdown Component

**File:** `components/Dropdown.tsx`

**Purpose:** Reusable dropdown selector dengan modal bottom sheet dan search functionality.

**Props:**
```typescript
interface DropdownProps {
  label: string;              // Label field
  placeholder: string;        // Placeholder text
  value: string;             // Selected value (ID)
  items: DropdownItem[];     // Array of options
  onSelect: (value: string) => void;  // Callback saat item dipilih
  required?: boolean;        // Menampilkan tanda *
  searchable?: boolean;      // Enable search functionality
}

interface DropdownItem {
  label: string;             // Display text
  value: string;             // Unique ID
}
```

**Features:**
- Modal bottom sheet dengan smooth slide animation
- Search functionality (conditional berdasarkan prop `searchable`)
- Visual feedback untuk selected item (light green background)
- Empty state saat tidak ada data atau hasil search
- Clean close button dengan X icon
- Responsive height (max 80% viewport)

**Usage Example:**
```typescript
<Dropdown
  label="Blok"
  placeholder="Pilih Blok"
  value={formData.blok_id}
  items={blokList.map((blok) => ({
    label: blok.name,
    value: blok.id,
  }))}
  onSelect={(value) => updateField('blok_id', value)}
  required
  searchable={blokList.length > 5}
/>
```

**Styling:**
- Selector: White background dengan border, rounded corners
- Modal: Rounded top corners (20px), white background
- Selected item: `#e8f5e9` (light green) background
- Search bar: `#f5f5f5` background dengan search icon

### MultiSelectDropdown Component

**File:** `components/MultiSelectDropdown.tsx`

**Purpose:** Reusable multi-select dropdown untuk memilih multiple items dengan modal bottom sheet dan search functionality.

**Props:**
```typescript
interface MultiSelectDropdownProps {
  label: string;              // Label field
  placeholder: string;        // Placeholder text
  values: string[];           // Array of selected values (IDs)
  items: DropdownItem[];      // Array of options
  onSelect: (values: string[]) => void;  // Callback dengan array values
  required?: boolean;         // Menampilkan tanda *
  searchable?: boolean;       // Enable search functionality
}

interface DropdownItem {
  label: string;              // Display text
  value: string;              // Unique ID
}
```

**Features:**
- Multiple selection dengan checkbox/checkmark
- Modal bottom sheet dengan smooth slide animation
- Search functionality (conditional berdasarkan prop `searchable`)
- Visual feedback untuk selected items (checkmark icon + light green background)
- Chip display untuk items terpilih di luar modal
- Counter jumlah items dipilih ("3 dipilih")
- Tombol "Hapus Semua" untuk clear all selections
- Tombol "Selesai" di footer modal untuk close
- Empty state saat tidak ada data atau hasil search
- Responsive height (max 80% viewport)

**Usage Example:**
```typescript
<MultiSelectDropdown
  label="Nama Pemanen"
  placeholder="Pilih Pemanen (bisa lebih dari 1)"
  values={formData.pemanen_ids}
  items={pemanenList.map((pemanen) => ({
    label: `${pemanen.operator_code} - ${pemanen.name}`,
    value: pemanen.id,
  }))}
  onSelect={(values) => updateField('pemanen_ids', values)}
  required
  searchable
/>
```

**Styling:**
- Selector: White background dengan border, rounded corners
- Modal: Rounded top corners (20px), white background dengan footer
- Selected item: `#e8f5e9` (light green) background dengan check icon
- Selected chips: Rounded pills dengan close button (X icon)
- Search bar: `#f5f5f5` background dengan search icon
- Footer button: Primary green background (`#2d5016`)

### EditableDropdown Component

**File:** `components/EditableDropdown.tsx`

**Purpose:** Hybrid component yang menggabungkan TextInput dan Dropdown (combobox pattern). User bisa mengetik manual atau memilih dari dropdown list.

**Props:**
```typescript
interface EditableDropdownProps {
  label: string;              // Label field
  placeholder: string;        // Placeholder text
  value: string;              // Current value (text)
  items: DropdownItem[];      // Array of quick-select options
  onChangeText: (value: string) => void;  // Callback saat value berubah
  required?: boolean;         // Menampilkan tanda *
  keyboardType?: 'default' | 'numeric' | 'number-pad';  // Keyboard type
}

interface DropdownItem {
  label: string;              // Display text
  value: string;              // Value to set
}
```

**Features:**
- TextInput yang fully editable (user bisa ketik apa saja)
- Dropdown button (ChevronDown icon) di sebelah kanan input
- Modal bottom sheet dengan list pilihan untuk quick select
- Visual feedback untuk selected item (light green background)
- Empty state saat tidak ada options
- Keyboard type customizable (default, numeric, number-pad)
- Responsive height (max 60% viewport)

**Usage Example:**
```typescript
<EditableDropdown
  label="Nomor TPH"
  placeholder="Ketik atau pilih"
  value={formData.nomor_panen}
  items={Array.from({ length: 20 }, (_, i) => ({
    label: `${i + 1}`,
    value: `${i + 1}`,
  }))}
  onChangeText={(value) => updateField('nomor_panen', value)}
  keyboardType="number-pad"
/>
```

**Use Cases:**
- Nomor TPH (bisa ketik manual atau pilih 1-20)
- Kode referensi yang sering dipakai tapi bisa custom
- Field dengan suggested values tapi tidak terbatas pada list

**Styling:**
- Input: White background dengan border, rounded corners
- Dropdown button: Absolute positioned di kanan input
- Modal: Rounded top corners (20px), white background
- Selected item: `#e8f5e9` (light green) background

### ReportCard Component

**File:** `components/ReportCard.tsx`

**Purpose:** Card component untuk menampilkan summary laporan panen dengan foto thumbnail. Cocok untuk digunakan di dashboard atau list view.

**Props:**
```typescript
interface ReportCardProps {
  tanggal: string;           // Tanggal panen ISO format
  divisi: string;            // Nama divisi
  gang: string;              // Nama gang
  blok: string;              // Nama blok
  pemanen: string;           // Nama pemanen
  hasilPanen: number;        // Jumlah JJG
  fotoUrl?: string | null;   // URL foto (optional)
  keterangan: string;        // Keterangan
  onPress?: () => void;      // Handler tap card
}
```

**Features:**
- **Card Header:**
  - Tanggal dengan icon Calendar
  - Badge hasil panen (JJG) di kanan
  - Background abu-abu terang untuk kontras

- **Card Body:**
  - Info lokasi dengan icon MapPin (Divisi - Gang - Blok)
  - Info pemanen dengan icon User
  - Keterangan (max 2 lines dengan ellipsis)
  - Foto thumbnail 80x80px atau placeholder icon

- **Visual Design:**
  - Shadow dan elevation untuk depth
  - Rounded corners (12px)
  - Margin horizontal 16px
  - Photo border radius untuk estetika
  - Green color theme (#2d5016)

**Usage:**
```typescript
<ReportCard
  tanggal="2026-01-11T10:30:00Z"
  divisi="Divisi 1"
  gang="Gang A"
  blok="A3"
  pemanen="Agus Sanjaya"
  hasilPanen={12}
  fotoUrl="https://..."
  keterangan="Buah matang semua"
  onPress={() => router.push('/detail')}
/>
```

**Best For:**
- Dashboard recent activities
- List view laporan
- Preview cards
- Quick summary display

**Styling:**
- Card: White background, shadow, rounded 12px
- Header: Light gray background (#f5f5f5)
- Badge: Dark green (#2d5016) dengan white text
- Photo: 80x80px dengan border radius 8px
- Text: Multiple size hierarchy (13px, 12px)

### ExportModal Component

**File:** `components/ExportModal.tsx`

**Purpose:** Modal component untuk export laporan panen ke format Excel atau PDF dengan pilihan scope (per divisi atau estate) dan custom date range.

**Props:**
```typescript
interface ExportModalProps {
  visible: boolean;        // Control modal visibility
  onClose: () => void;     // Handler untuk close modal
  reportType: string;      // Type laporan: 'daily', 'weekly', 'monthly'
}
```

**Features:**

**1. Format Selection:**
- Excel (.xlsx) - dengan icon FileSpreadsheet
- PDF - dengan icon FileText
- Visual cards dengan active state (green border & background)

**2. Scope Selection:**
- Per Divisi - Export data satu divisi saja
- Seluruh Estate - Export data semua divisi
- Visual cards dengan active state

**3. Divisi Selection (jika scope = divisi):**
- Dynamic load dari database
- List semua divisi available
- Click to select divisi
- Active state dengan green highlight

**4. Date Range Picker:**
- Start date input (format: YYYY-MM-DD)
- End date input (format: YYYY-MM-DD)
- Auto-populated based on reportType:
  - daily: 1 hari terakhir
  - weekly: 7 hari terakhir
  - monthly: 30 hari terakhir
- User dapat customize date range

**5. Export Action:**
- Loading state saat fetch data
- Validation checks (date, divisi)
- Success/error alerts
- Auto close modal setelah berhasil

**State Management:**
```typescript
const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
const [scope, setScope] = useState<'divisi' | 'estate'>('estate');
const [selectedDivisi, setSelectedDivisi] = useState<string>('');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const [loading, setLoading] = useState(false);
```

### Export Flow:
```typescript
1. User klik Export button
2. Modal terbuka
3. User pilih format (Excel/PDF)
4. User pilih scope (Divisi/Estate)
5. Jika divisi, pilih divisi dari list
6. Adjust date range jika perlu
7. Klik tombol "Export"
8. fetchReportData(filter) - ambil data dari database
9. transformToExportFormat(data) - format data
10. exportToExcel() atau exportToPDF() - generate file
11. File downloaded ke device user
12. Alert success & modal close
```

## Offline-first Mechanism

Aplikasi dirancang untuk bekerja sepenuhnya tanpa koneksi internet (offline) saat di lapangan.

### 1. Local Storage (SQLite)
Menggunakan `expo-sqlite` untuk menyimpan data secara lokal di perangkat.
- **Master Data**: `divisi`, `gang`, `blok`, `pemanen`, `tph` di-cache secara lokal.
- **Transaction Data**: Data panen disimpan dalam antrian (`harvest_records_queue`) sebelum disinkronkan.

### 2. Synchronization Flow
- **Master Data Sync**: Mengunduh data terbaru dari server Neon ke SQLite lokal saat aplikasi mendeteksi koneksi internet.
- **Data Submission**: Saat user submit data panen, data masuk ke SQLite lokal dengan status `pending`.
- **Background Sync**: Saat koneksi internet tersedia, aplikasi akan:
    1. Mengunggah foto ke database (dalam format base64/blob).
    2. Mengirim data transaksi ke tabel `harvest_records` di Neon.
    3. Mengubah status lokal menjadi `synced`.

### 3. Image Handling
Foto hasil panen disimpan sebagai path lokal saat offline, dan dikonversi ke base64 untuk disimpan di tabel `harvest_photos` saat sinkronisasi.

## Integration dengan Report Service
```typescript
import {
  fetchReportData,
  transformToExportFormat,
  type ReportFilter,
} from '@/lib/reportService';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';

const handleExport = async () => {
  const filter: ReportFilter = {
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    divisiId: scope === 'divisi' ? selectedDivisi : undefined,
  };

  const records = await fetchReportData(filter);
  const exportData = transformToExportFormat(records);

  if (format === 'excel') {
    exportToExcel(exportData, filename);
  } else {
    exportToPDF(exportData, filename, title);
  }
};
```

**Usage dalam Report Detail:**
```typescript
import ExportModal from '@/components/ExportModal';

const [showExportModal, setShowExportModal] = useState(false);

// Di header, tambahkan export button
<TouchableOpacity onPress={() => setShowExportModal(true)}>
  <Download size={20} color="#fff" />
</TouchableOpacity>

// Di render
<ExportModal
  visible={showExportModal}
  onClose={() => setShowExportModal(false)}
  reportType="weekly"
/>
```

**Validations:**
- Date range harus diisi
- Jika scope = divisi, divisi harus dipilih
- Check data availability sebelum export
- Error handling untuk database errors

**Styling:**
- Modal overlay: Semi-transparent black (rgba(0, 0, 0, 0.5))
- Modal container: White, rounded 16px, 90% width, max 500px
- Section spacing: 24px margin bottom
- Option cards: Light gray default, light green active
- Active border: 2px solid green (#2d5016)
- Footer buttons: Gray cancel, green export
- Loading state: ActivityIndicator in export button

**Dependencies:**
- `@/lib/reportService` - Data fetching
- `@/lib/exportUtils` - Export functions
- `@/lib/db` - Database connection
- `@/contexts/AuthContext` - User profile
- `lucide-react-native` - Icons

## Icons

**Library:** lucide-react-native

**Usage:**
```typescript
import { Home, FileText, User } from 'lucide-react-native'

<Home size={24} color="#2d5016" />
```

**Icon Set:**
- Home, Building2, MapPin - Navigation
- FileText, BarChart3 - Reports
- CheckSquare, AlertTriangle - Status
- User, Users - People
- Camera, Package - Operations

## Responsive Design

### Current Status
Optimized untuk Web platform (default Expo web).

### Breakpoints (Future)
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Form Handling

### Pattern
```typescript
const [value, setValue] = useState('')
const [loading, setLoading] = useState(false)

const handleSubmit = async () => {
  setLoading(true)
  try {
    // Submit logic
  } catch (error) {
    Alert.alert('Error', error.message)
  } finally {
    setLoading(false)
  }
}
```

### Validation
- Required field validation
- Email format validation
- Error display via Alert (native)
- Loading states during submission

## Error Handling

### Display Methods
1. **Alert** - Untuk errors yang perlu user action
2. **Inline Text** - Untuk form validation errors
3. **Empty States** - Untuk no data scenarios
4. **Error Cards** - Untuk feature-level errors

### Error Messages
- Bahasa Indonesia
- Clear dan actionable
- User-friendly (non-technical)

## Performance Optimization

### Current Optimizations
- Lazy loading screens (automatic via Expo Router)
- Minimal re-renders dengan proper state management
- Efficient list rendering (ScrollView for now)

### Future Optimizations
- FlatList untuk long lists
- Image optimization
- Code splitting
- Bundle size reduction
- Caching strategies

## Accessibility

### Current Implementation
- Readable text sizes
- High contrast colors
- Touchable areas (min 44x44)
- Clear navigation

### Future Improvements
- Screen reader support
- Keyboard navigation
- ARIA labels
- Focus management

## Testing Strategy

### Current Status
Manual testing via Expo

### Future Testing
- Jest untuk unit tests
- React Native Testing Library
- E2E tests dengan Detox
- Visual regression testing

## Build & Deployment

### Development
```bash
npm run dev  # Start Expo development server
```

### Web Build
```bash
npm run build:web  # Export web build to dist/
```

### Type Checking
```bash
npm run typecheck  # Run TypeScript compiler
```

## Browser Support

### Web Platform
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

### Planned Features
1. Offline support dengan local storage
2. PWA capabilities
3. Push notifications
4. Camera integration untuk foto TPH
5. GPS tracking untuk geofencing
6. Dark mode support
7. Internationalization (i18n)
8. Advanced animations dengan Reanimated

### Performance Targets
- Initial load: < 3s
- Time to interactive: < 5s
- Smooth 60fps animations
- < 2MB initial bundle size
