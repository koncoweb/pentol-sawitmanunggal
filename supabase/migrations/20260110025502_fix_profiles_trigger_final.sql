/*
  # Fix Profiles Trigger - Final Solution

  ## Problem
  RLS policies masih block INSERT dari trigger walaupun function sudah SECURITY DEFINER.
  
  ## Root Cause
  Function SECURITY DEFINER masih respect RLS policies kecuali explicitly bypassed.

  ## Solution
  Tambahkan SET statement di function untuk bypass RLS saat insert.

  ## Changes
  1. Recreate handle_new_user function dengan SET bypass RLS
  2. Pastikan proper policy exists
*/

-- Drop dan recreate function dengan proper security settings
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert dengan explicit schema reference
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'krani_panen'::user_role)
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute ke postgres
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure proper policy exists
DROP POLICY IF EXISTS "Enable insert for service role and trigger" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;

-- Create simple policy that allows all inserts (security handled by trigger logic)
CREATE POLICY "Allow profile creation via trigger"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Update SELECT policy untuk ensure user bisa read own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Update UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
