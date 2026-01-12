/**
 * Script untuk membuat dummy users
 * Run dengan: npx tsx scripts/create-dummy-users.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Need service role key

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env');
  console.log('\n📝 Cara mendapatkan Service Role Key:');
  console.log('1. Buka Supabase Dashboard');
  console.log('2. Project Settings → API');
  console.log('3. Copy "service_role" key');
  console.log('4. Tambahkan ke .env: SUPABASE_SERVICE_ROLE_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const dummyUsers = [
  {
    email: 'krani.panen@sawitmanunggal.com',
    password: 'panen123',
    full_name: 'Budi Santoso',
    role: 'krani_panen',
    divisi: 'Divisi A',
    gang: 'Gang 1'
  },
  {
    email: 'krani.buah@sawitmanunggal.com',
    password: 'buah123',
    full_name: 'Andi Wijaya',
    role: 'krani_buah',
    divisi: 'Divisi A',
    gang: null
  },
  {
    email: 'mandor@sawitmanunggal.com',
    password: 'mandor123',
    full_name: 'Hendra Kusuma',
    role: 'mandor',
    divisi: 'Divisi A',
    gang: 'Gang 1'
  },
  {
    email: 'asisten@sawitmanunggal.com',
    password: 'asisten123',
    full_name: 'Rudi Hartono',
    role: 'asisten',
    divisi: 'Divisi A',
    gang: null
  },
  {
    email: 'estate@sawitmanunggal.com',
    password: 'estate123',
    full_name: 'Bambang Suryanto',
    role: 'estate_manager',
    divisi: null,
    gang: null
  },
  {
    email: 'regional@sawitmanunggal.com',
    password: 'regional123',
    full_name: 'Ir. Ahmad Yani',
    role: 'regional_gm',
    divisi: null,
    gang: null
  }
];

async function createDummyUsers() {
  console.log('🚀 Membuat dummy users...\n');

  for (const user of dummyUsers) {
    try {
      console.log(`📝 Creating ${user.email}...`);

      // Create user dengan Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role
        }
      });

      if (authError) {
        console.error(`❌ Error creating ${user.email}:`, authError.message);
        continue;
      }

      console.log(`✅ User created: ${user.email}`);

      // Update profile dengan divisi dan gang
      if (user.divisi || user.gang) {
        const { data: divisiData } = await supabase
          .from('divisi')
          .select('id')
          .eq('name', user.divisi)
          .maybeSingle();

        const { data: gangData } = user.gang
          ? await supabase
              .from('gang')
              .select('id')
              .eq('name', user.gang)
              .eq('divisi_id', divisiData?.id)
              .maybeSingle()
          : { data: null };

        await supabase
          .from('profiles')
          .update({
            divisi_id: divisiData?.id || null,
            gang_id: gangData?.id || null
          })
          .eq('id', authData.user.id);

        console.log(`   └─ Assigned: ${user.divisi || 'No divisi'}${user.gang ? ` / ${user.gang}` : ''}`);
      }

    } catch (error: any) {
      console.error(`❌ Unexpected error for ${user.email}:`, error.message);
    }

    console.log('');
  }

  console.log('✨ Selesai!\n');
  console.log('📋 Test login dengan:');
  console.log('   Email: krani.panen@sawitmanunggal.com');
  console.log('   Password: panen123');
}

createDummyUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
