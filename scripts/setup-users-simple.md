# Setup Dummy Users - Panduan Sederhana

Karena Supabase memerlukan Service Role Key untuk membuat users via API, berikut adalah cara termudah untuk setup dummy users:

## Opsi 1: Via Supabase Dashboard (RECOMMENDED)

### Langkah-langkah:

1. **Buka Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Pilih project Anda

2. **Buka Authentication → Users**
   - Klik "Add User" → "Create New User"

3. **Buat 6 Users berikut:**

#### User 1: Krani Panen
```
Email: krani.panen@sawitmanunggal.com
Password: panen123
✅ Auto Confirm User
```

#### User 2: Krani Buah
```
Email: krani.buah@sawitmanunggal.com
Password: buah123
✅ Auto Confirm User
```

#### User 3: Mandor
```
Email: mandor@sawitmanunggal.com
Password: mandor123
✅ Auto Confirm User
```

#### User 4: Asisten
```
Email: asisten@sawitmanunggal.com
Password: asisten123
✅ Auto Confirm User
```

#### User 5: Estate Manager
```
Email: estate@sawitmanunggal.com
Password: estate123
✅ Auto Confirm User
```

#### User 6: Regional GM
```
Email: regional@sawitmanunggal.com
Password: regional123
✅ Auto Confirm User
```

4. **Update Profiles via SQL Editor**

Setelah users dibuat, jalankan SQL berikut di SQL Editor:

```sql
-- Update Krani Panen
UPDATE profiles SET
  full_name = 'Budi Santoso',
  role = 'krani_panen',
  divisi_id = (SELECT id FROM divisi WHERE name = 'Divisi A' LIMIT 1),
  gang_id = (SELECT g.id FROM gang g JOIN divisi d ON g.divisi_id = d.id WHERE d.name = 'Divisi A' AND g.name = 'Gang 1' LIMIT 1)
WHERE email = 'krani.panen@sawitmanunggal.com';

-- Update Krani Buah
UPDATE profiles SET
  full_name = 'Andi Wijaya',
  role = 'krani_buah',
  divisi_id = (SELECT id FROM divisi WHERE name = 'Divisi A' LIMIT 1)
WHERE email = 'krani.buah@sawitmanunggal.com';

-- Update Mandor
UPDATE profiles SET
  full_name = 'Hendra Kusuma',
  role = 'mandor',
  divisi_id = (SELECT id FROM divisi WHERE name = 'Divisi A' LIMIT 1),
  gang_id = (SELECT g.id FROM gang g JOIN divisi d ON g.divisi_id = d.id WHERE d.name = 'Divisi A' AND g.name = 'Gang 1' LIMIT 1)
WHERE email = 'mandor@sawitmanunggal.com';

-- Update Asisten
UPDATE profiles SET
  full_name = 'Rudi Hartono',
  role = 'asisten',
  divisi_id = (SELECT id FROM divisi WHERE name = 'Divisi A' LIMIT 1)
WHERE email = 'asisten@sawitmanunggal.com';

-- Update Estate Manager
UPDATE profiles SET
  full_name = 'Bambang Suryanto',
  role = 'estate_manager'
WHERE email = 'estate@sawitmanunggal.com';

-- Update Regional GM
UPDATE profiles SET
  full_name = 'Ir. Ahmad Yani',
  role = 'regional_gm'
WHERE email = 'regional@sawitmanunggal.com';
```

## Opsi 2: Via TypeScript Script (Requires Service Role Key)

Jika Anda memiliki Service Role Key:

1. **Tambahkan Service Role Key ke `.env`:**
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. **Install tsx:**
```bash
npm install -D tsx
```

3. **Run script:**
```bash
npx tsx scripts/create-dummy-users.ts
```

## Verifikasi

Setelah setup, verifikasi dengan query ini:

```sql
SELECT
  p.email,
  p.full_name,
  p.role,
  d.name as divisi_name,
  g.name as gang_name
FROM profiles p
LEFT JOIN divisi d ON p.divisi_id = d.id
LEFT JOIN gang g ON p.gang_id = g.id
WHERE p.email LIKE '%@sawitmanunggal.com'
ORDER BY p.email;
```

Expected result: 6 users dengan role dan assignment yang benar.

## Test Login

1. Start aplikasi: `npm run dev`
2. Login dengan: `krani.panen@sawitmanunggal.com` / `panen123`
3. Should redirect ke Dashboard Krani Panen

## Troubleshooting

### Login gagal dengan "Invalid credentials"
- Pastikan email sudah confirmed di Supabase Dashboard
- Check password case-sensitive
- Clear browser cache & localStorage

### Profile tidak muncul
- Check profiles table sudah ter-create (via trigger)
- Run SQL update manual jika perlu

### Dashboard salah
- Verify role di profiles table
- Check navigation logic di `app/_layout.tsx`
