# PENTOL - Pencatatan Online
## Harvest Management System

Aplikasi digital terintegrasi untuk mendigitalkan seluruh rantai pasok panen kelapa sawit, dari perencanaan hingga pengiriman ke PKS (Pabrik Kelapa Sawit).

## 🌴 Deskripsi

**PENTOL (Pencatatan Online)** adalah solusi modern Harvest Management System untuk menggantikan sistem pelaporan manual berbasis Excel dengan sistem real-time yang menjamin:
- ✅ Akurasi data produksi
- ✅ Transparansi upah
- ✅ Minimalisasi kehilangan buah (losses)
- ✅ Traceability lengkap dari kebun ke PKS

## 🚀 Tech Stack

- **Frontend**: React Native dengan Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Styling**: React Native StyleSheet
- **Icons**: lucide-react-native
- **Platform**: Web (primary), iOS & Android ready

## 📦 Prerequisites

- Node.js 18+
- npm atau yarn
- Expo CLI (akan terinstall otomatis)
- Account Supabase (sudah dikonfigurasi)

## 🔧 Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd project
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**

File `.env` sudah dikonfigurasi dengan:
```env
EXPO_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

4. **Start development server**
```bash
npm run dev
```

## 🏗️ Project Structure

```
project/
├── app/                    # Routes (Expo Router)
│   ├── _layout.tsx        # Root layout
│   ├── login.tsx          # Login screen
│   └── (tabs)/            # Tab navigation
│       ├── index.tsx      # Dashboard screens
│       └── ...
├── contexts/              # React Context (Auth)
├── lib/                   # Utilities & config
├── docs/                  # Documentation
│   ├── Database.md       # Database documentation
│   ├── Backend.md        # Backend documentation
│   ├── Frontend.md       # Frontend documentation
│   └── Features.md       # Features documentation
└── README.md             # This file
```

## 👥 User Roles

Aplikasi mendukung 6 role pengguna dengan dashboard khusus:

1. **Krani Panen** - Input data panen lapangan
2. **Krani Buah** - Kelola transport dan SPB
3. **Mandor** - Validasi dan approval data
4. **Asisten** - Monitoring divisi
5. **Estate Manager** - Management estate
6. **Regional GM** - Overview regional

## 🔐 Authentication

Sistem menggunakan email/password authentication via Supabase.

### Akun Dummy untuk Testing

**⚠️ SETUP REQUIRED:** Akun dummy perlu dibuat terlebih dahulu.

**Cara Tercepat:**
1. Start aplikasi: `npm run dev`
2. Navigate ke `/setup-users`
3. Klik "Buat Users" dan "Update Profiles"
4. Jalankan SQL untuk assign divisi/gang (lihat `CREDENTIALS.md`)

Lihat file `CREDENTIALS.md` untuk detail lengkap dan metode alternatif.

**Quick Reference:**
| Role | Email | Password |
|------|-------|----------|
| Krani Panen | krani.panen@sawitmanunggal.com | panen123 |
| Krani Buah | krani.buah@sawitmanunggal.com | buah123 |
| Mandor | mandor@sawitmanunggal.com | mandor123 |
| Asisten | asisten@sawitmanunggal.com | asisten123 |
| Estate Manager | estate@sawitmanunggal.com | estate123 |
| Regional GM | regional@sawitmanunggal.com | regional123 |

⚠️ **PENTING:** Password ini hanya untuk testing. Ganti sebelum production!

**Default Role Assignment:**
- User baru otomatis mendapat role `krani_panen`
- Role dapat diubah via Supabase Dashboard di tabel `profiles`

## 📱 Features (Phase 1)

### ✅ Implemented
- [x] Authentication system dengan role-based access
- [x] Dashboard untuk semua 6 role user
- [x] Navigation dengan tab-based routing
- [x] Profile management
- [x] Role-based UI dengan conditional rendering
- [x] Database schema dengan RLS policies
- [x] Approval workflow UI
- [x] Monitoring & Reports UI
- [x] Analytics dashboard UI

### 🚧 Pending (Phase 2)
- [ ] Input data panen (backend integration)
- [ ] Grading system (backend integration)
- [ ] Camera integration untuk foto TPH
- [ ] SPB generation (backend integration)
- [ ] Approval workflow (backend integration)
- [ ] Real-time monitoring data
- [ ] Report generation & export
- [ ] Analytics charts & graphs
- [ ] Offline mode support
- [ ] Push notifications

## 🗄️ Database

Database menggunakan PostgreSQL via Supabase dengan Row Level Security (RLS).

**Tables:**
- `profiles` - User profiles dengan role
- `divisi` - Data divisi/afdeling
- `gang` - Data gang/kemandoran

**Sample Data:**
- 3 Divisi (Divisi A, B, C)
- 3 Gang (Gang 1 & 2 di Divisi A, Gang 1 di Divisi B)

Lihat `docs/Database.md` untuk detail lengkap.

## 🎨 UI/UX

**Color Scheme:**
- Primary: Green theme (`#2d5016`)
- Accent colors untuk different features
- Clean, modern card-based design
- Consistent spacing (8px grid system)

**Typography:**
- Bahasa Indonesia sebagai bahasa utama
- Clear hierarchy dengan font weights
- Readable text sizes (min 12px)

## 🔨 Build Commands

```bash
# Development
npm run dev                 # Start Expo dev server

# Build
npm run build:web          # Build untuk web (output: dist/)

# Type checking
npm run typecheck          # Run TypeScript compiler

# Linting
npm run lint              # Run ESLint
```

## 📚 Documentation

Dokumentasi lengkap tersedia di folder `docs/`:

- **Database.md** - Schema, RLS policies, migrations
- **Backend.md** - Supabase setup, auth, API
- **Frontend.md** - Components, styling, navigation
- **Features.md** - Detailed feature specifications

## 🔒 Security

- ✅ Row Level Security (RLS) pada semua tabel
- ✅ JWT authentication
- ✅ Secure session storage (expo-secure-store)
- ✅ Environment variables untuk credentials
- ✅ Role-based access control
- ✅ Input validation
- ✅ XSS prevention

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Type checking
npm run typecheck
```

## 📊 Success Metrics (KPI)

- **Achievement vs RKH**: Target ≥ 95%
- **Zero Restan**: 0 buah tertinggal
- **Data Accuracy**: Selisih < 0.2% vs PKS
- **Quality Control**: BMT < 2%

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 Development Notes

### Struktur File
- Semua screen ada di folder `app/`
- Gunakan Expo Router untuk navigation
- Context API untuk state management
- TypeScript untuk type safety

### Coding Standards
- Use TypeScript strict mode
- Follow React best practices
- Use functional components dengan hooks
- Implement proper error handling
- Add loading states untuk async operations

### Database Operations
- Selalu gunakan RLS policies
- Use `maybeSingle()` untuk single row queries
- Handle errors gracefully
- Log untuk debugging

## 🐛 Known Issues

- Image processing warning saat build (tidak mempengaruhi functionality)
- Camera integration belum diimplementasikan
- Offline mode belum tersedia

## 🚀 Roadmap

### Phase 1 (Current) ✅
- Basic authentication
- Role-based dashboards
- Database schema
- UI untuk semua screens

### Phase 2 (Next)
- Backend integration untuk semua features
- Camera & GPS integration
- Real-time data monitoring
- Report generation

### Phase 3 (Future)
- Offline mode
- Push notifications
- Advanced analytics
- Mobile app (iOS/Android)
- Integration dengan PKS system

## 📞 Support

Untuk pertanyaan atau issue, silakan buka GitHub issue atau hubungi tim development.

## 📄 License

[Specify your license here]

## 🙏 Acknowledgments

- Expo team untuk amazing framework
- Supabase untuk backend infrastructure
- Lucide untuk icon library
- React Native community

---

**Version**: 1.0.0
**Last Updated**: 2026-01-10
**Status**: Phase 1 Complete ✅
