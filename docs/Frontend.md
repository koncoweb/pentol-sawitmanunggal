# Dokumentasi Frontend - PENTOL

## Overview

Frontend aplikasi **PENTOL (Pencatatan Online)** - Harvest Management System dibangun menggunakan:
- **Framework**: React Native dengan Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **UI**: React Native core components dengan custom styling
- **State Management**: React Context API
- **Styling**: StyleSheet (React Native)
- **Platform**: Web (primary), iOS & Android (future)

## Tech Stack

### Core Dependencies
```json
{
  "expo": "^54.0.10",
  "expo-router": "~6.0.8",
  "react": "19.1.0",
  "react-native": "0.81.4",
  "@supabase/supabase-js": "^2.58.0"
}
```

### UI & Navigation
```json
{
  "lucide-react-native": "^0.544.0",
  "@react-navigation/native": "^7.0.14",
  "@react-navigation/bottom-tabs": "^7.2.0",
  "react-native-safe-area-context": "~5.6.0"
}
```

### Export & Reporting
```json
{
  "xlsx": "Latest version",
  "jspdf": "Latest version",
  "jspdf-autotable": "Latest version"
}
```

## Project Structure

```
project/
├── app/                          # Routes (Expo Router)
│   ├── _layout.tsx              # Root layout dengan AuthProvider
│   ├── login.tsx                # Login screen
│   ├── input-panen.tsx          # Form input data panen
│   ├── report-detail.tsx        # Detail laporan dengan spreadsheet
│   ├── +not-found.tsx           # 404 screen
│   └── (tabs)/                  # Tab-based navigation
│       ├── _layout.tsx          # Tab layout dengan role-based routing
│       ├── index.tsx            # Dashboard Krani Panen
│       ├── krani-buah.tsx       # Dashboard Krani Buah
│       ├── mandor.tsx           # Dashboard Mandor
│       ├── asisten.tsx          # Dashboard Asisten
│       ├── estate.tsx           # Dashboard Estate Manager
│       ├── regional.tsx         # Dashboard Regional GM
│       ├── approval.tsx         # Approval screen (Mandor)
│       ├── monitoring.tsx       # Monitoring screen
│       ├── reports.tsx          # Reports screen
│       ├── analytics.tsx        # Analytics screen
│       └── profile.tsx          # Profile screen
├── contexts/                    # React Context
│   └── AuthContext.tsx          # Authentication state
├── lib/                         # Libraries & utilities
│   └── supabase.ts             # Supabase client
├── components/                  # Reusable components
│   ├── Dropdown.tsx            # Dropdown selector component
│   ├── MultiSelectDropdown.tsx # Multi-select dropdown component
│   ├── EditableDropdown.tsx    # Editable dropdown (combobox) component
│   └── ReportCard.tsx          # Card component untuk preview laporan
└── hooks/                       # Custom hooks
    └── useFrameworkReady.ts    # Framework initialization

```

## Navigation Architecture

### Root Layout
**File:** `app/_layout.tsx`

- Wraps app dengan `AuthProvider`
- Handles authentication state
- Auto-redirect berdasarkan session:
  - No session dan di tabs → redirect ke `/login`
  - Has session dan di login/setup → redirect ke `/(tabs)` sesuai role
  - Routes lain (seperti `/input-panen`) → tidak ada redirect otomatis
- Stack navigator untuk semua routes (tabs, login, input-panen, dll)

### Tab Navigation
**File:** `app/(tabs)/_layout.tsx`

Role-based tab visibility:

| Role | Tabs Visible |
|------|-------------|
| Krani Panen | Dashboard, Profile |
| Krani Buah | Dashboard, Profile |
| Mandor | Dashboard, Approval, Profile |
| Asisten | Dashboard, Monitoring, Profile |
| Estate Manager | Dashboard, Reports, Monitoring, Profile |
| Regional GM | Dashboard, Reports, Analytics, Profile |

## State Management

### Auth Context
**File:** `contexts/AuthContext.tsx`

```typescript
type AuthContextType = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email, password) => Promise<void>
  signOut: () => Promise<void>
}
```

**Usage:**
```typescript
const { profile, loading, signIn, signOut } = useAuth()
```

### State Flow
1. App starts → Loading state
2. Check session → Get user profile from Supabase
3. Profile loaded → Render appropriate dashboard
4. Auth state change → Auto-update UI

## Screens

### Authentication

#### Login Screen
**File:** `app/login.tsx`

Features:
- Email/password input
- Loading state during login
- Error handling dengan Alert
- Auto-redirect to dashboard on success
- Keyboard-aware scrolling

Design:
- Brand colors (green theme)
- Clean, modern UI
- Accessible form inputs
- Professional layout

### Dashboards (Role-based)

#### 1. Krani Panen Dashboard
**File:** `app/(tabs)/index.tsx`

Components:
- Welcome header dengan nama user
- Quick stats (Data Hari Ini, Pending Approval)
- Menu cards:
  - Input Data Panen
  - Foto TPH
  - Grading Buah
  - Losses Monitoring
- Info card dengan instructions

#### 2. Krani Buah Dashboard
**File:** `app/(tabs)/krani-buah.tsx`

Components:
- Welcome header
- Stats (SPB Hari Ini, Truk Terkirim, Restan)
- Menu cards:
  - Buat SPB
  - Data Truk
  - Validasi Muatan
  - Cek Restan
- Alert card untuk reminders

#### 3. Mandor Dashboard
**File:** `app/(tabs)/mandor.tsx`

Components:
- Welcome header
- Grid stats (Pending Approval, Target, Realisasi, Anggota Gang)
- Task cards dengan urgency badges
- Info card untuk guidelines

#### 4. Asisten Dashboard
**File:** `app/(tabs)/asisten.tsx`

Components:
- Welcome header
- KPI cards dengan progress bars:
  - Achievement vs RKH
  - Quality Score
  - Losses Rate
- Gang performance cards
- Action buttons

#### 5. Estate Manager Dashboard
**File:** `app/(tabs)/estate.tsx`

Components:
- Welcome header
- Summary cards (Produksi, Achievement, Divisi, Pekerja)
- Divisi performance list
- Quick action buttons (Laporan, Analytics)

#### 6. Regional GM Dashboard
**File:** `app/(tabs)/regional.tsx`

Components:
- Welcome header
- Regional statistics grid
- Estate comparison cards
- Analytics & Reports section

### Supporting Screens

#### Approval Screen
**File:** `app/(tabs)/approval.tsx`

Features:
- List pending approvals
- Approval/reject buttons
- Detailed harvest information
- Status badges
- Empty state

#### Monitoring Screen
**File:** `app/(tabs)/monitoring.tsx`

Features:
- KPI cards dengan progress bars
- Real-time indicators
- Achievement metrics
- Quality metrics

#### Reports Screen
**File:** `app/(tabs)/reports.tsx`

Features:
- Report type selection (Harian, Mingguan, Bulanan)
- Navigation ke detail laporan
- Report cards dengan icon
- Export functionality (future)
- Report history
- Empty state

**File:** `app/report-detail.tsx`

Halaman detail laporan dengan format spreadsheet lengkap:

**Features:**
- **Tabel Spreadsheet Horizontal:**
  - 24 kolom data panen
  - Horizontal scroll untuk melihat semua kolom
  - Vertical scroll untuk melihat semua data
  - Fixed header saat scroll
  - Alternating row colors (zebra striping)
  - Cell borders untuk clarity

- **Header Dinamis:**
  - Judul sesuai tipe laporan (Harian/Mingguan/Bulanan)
  - Counter total data
  - Back button untuk kembali
  - Filter toggle button

- **Filter Panel:**
  - Filter berdasarkan Divisi (live search)
  - Filter berdasarkan Tanggal (partial match)
  - Slide in/out animation
  - TextInput dengan placeholder

- **Foto Hasil Panen:**
  - Thumbnail 60x60px dalam tabel
  - Tap untuk full screen view
  - Modal overlay dengan fade animation
  - Close button di top-right
  - Placeholder icon untuk data tanpa foto

- **Data Loading:**
  - Loading indicator saat fetch data
  - Date range filter otomatis sesuai tipe laporan
  - Limit 100 records untuk performa
  - Error handling

- **Performance:**
  - Optimized query dengan index
  - Lazy image loading
  - Cached images
  - Smooth scrolling

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

**Export Flow:**
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

**Integration dengan Report Service:**
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
- `@/lib/supabase` - Database connection
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
