/*
  # Fix Profiles INSERT Policy v2

  ## Problem
  Policy pertama masih gagal karena trigger runs outside authenticated context.
  auth.uid() returns NULL dalam trigger context, sehingga policy check gagal.

  ## Solution
  1. Drop policy lama yang check auth.uid()
  2. Buat policy baru yang allow service_role (untuk trigger)
  3. Atau bypass RLS untuk function dengan proper grants

  ## Changes
  1. Drop existing INSERT policy
  2. Create new policy yang compatible dengan trigger context
*/

-- Drop policy lama
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;

-- Create policy yang allow insert tanpa auth check (karena trigger handles logic)
-- Tapi tetap restrictive dengan only allow via trigger
CREATE POLICY "Enable insert for service role and trigger"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Pastikan hanya trigger yang bisa insert dengan revoke public insert
REVOKE INSERT ON profiles FROM authenticated;
REVOKE INSERT ON profiles FROM anon;

-- Grant ke postgres role untuk trigger
GRANT INSERT ON profiles TO postgres;
GRANT INSERT ON profiles TO service_role;
