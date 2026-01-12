/**
 * Script untuk test signup dengan anon key
 * Run dengan: npx tsx scripts/test-signup.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env file
const envPath = join(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    process.env[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testUser = {
  email: `test.user.${Date.now()}@sawitmanunggal.com`,
  password: 'test123456',
  full_name: 'Test User',
  role: 'krani_panen'
};

async function testSignup() {
  console.log('🧪 Testing signup...\n');
  console.log(`📧 Email: ${testUser.email}`);
  console.log(`👤 Name: ${testUser.full_name}`);
  console.log(`🎭 Role: ${testUser.role}\n`);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.full_name,
          role: testUser.role
        }
      }
    });

    if (error) {
      console.error('❌ Signup error:', error.message);
      process.exit(1);
    }

    console.log('✅ Signup berhasil!');
    console.log(`   User ID: ${data.user?.id}`);
    console.log(`   Email: ${data.user?.email}\n`);

    // Check apakah profile sudah dibuat
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error checking profile:', profileError.message);
    } else if (profile) {
      console.log('✅ Profile berhasil dibuat:');
      console.log(`   ID: ${profile.id}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Full Name: ${profile.full_name}`);
      console.log(`   Role: ${profile.role}`);
    } else {
      console.error('❌ Profile tidak ditemukan di database');
    }

    console.log('\n✨ Test selesai!');
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testSignup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
