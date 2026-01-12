/*
  # Initial Schema - Sawit Manunggal Application

  ## 1. Enums
    - `user_role`: Enum untuk role pengguna
      - krani_panen
      - krani_buah
      - mandor
      - asisten
      - estate_manager
      - regional_gm

  ## 2. New Tables
    - `divisi`
      - `id` (uuid, primary key)
      - `name` (text, nama divisi/afdeling)
      - `estate_name` (text, nama kebun)
      - `region_name` (text, nama regional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `gang`
      - `id` (uuid, primary key)
      - `divisi_id` (uuid, foreign key ke divisi)
      - `name` (text, nama gang/kemandoran)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `profiles`
      - `id` (uuid, primary key, foreign key ke auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (user_role enum)
      - `divisi_id` (uuid, nullable, foreign key ke divisi)
      - `gang_id` (uuid, nullable, foreign key ke gang)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## 3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on their roles
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM (
  'krani_panen',
  'krani_buah',
  'mandor',
  'asisten',
  'estate_manager',
  'regional_gm'
);

-- Create divisi table
CREATE TABLE IF NOT EXISTS divisi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  estate_name text NOT NULL,
  region_name text NOT NULL DEFAULT 'Region 1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE divisi ENABLE ROW LEVEL SECURITY;

-- Create gang table
CREATE TABLE IF NOT EXISTS gang (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  divisi_id uuid NOT NULL REFERENCES divisi(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gang ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL,
  divisi_id uuid REFERENCES divisi(id) ON DELETE SET NULL,
  gang_id uuid REFERENCES gang(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for divisi table
CREATE POLICY "Users can view divisi based on their role"
  ON divisi FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'regional_gm' THEN true
      WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'estate_manager' THEN true
      WHEN (SELECT role FROM profiles WHERE id = auth.uid()) IN ('asisten', 'mandor', 'krani_panen', 'krani_buah') 
        THEN id = (SELECT divisi_id FROM profiles WHERE id = auth.uid())
      ELSE false
    END
  );

-- RLS Policies for gang table
CREATE POLICY "Users can view gang based on their role"
  ON gang FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN (SELECT role FROM profiles WHERE id = auth.uid()) IN ('regional_gm', 'estate_manager') THEN true
      WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'asisten' 
        THEN divisi_id = (SELECT divisi_id FROM profiles WHERE id = auth.uid())
      WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'mandor' 
        THEN id = (SELECT gang_id FROM profiles WHERE id = auth.uid())
      WHEN (SELECT role FROM profiles WHERE id = auth.uid()) IN ('krani_panen', 'krani_buah')
        THEN divisi_id = (SELECT divisi_id FROM profiles WHERE id = auth.uid())
      ELSE false
    END
  );

-- RLS Policies for profiles table
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'krani_panen'::user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert sample data for testing
INSERT INTO divisi (name, estate_name, region_name) VALUES
  ('Divisi A', 'Estate Manunggal 1', 'Region Sumatra'),
  ('Divisi B', 'Estate Manunggal 1', 'Region Sumatra'),
  ('Divisi C', 'Estate Manunggal 2', 'Region Kalimantan')
ON CONFLICT DO NOTHING;

-- Insert sample gang data
INSERT INTO gang (divisi_id, name) 
SELECT id, 'Gang 1' FROM divisi WHERE name = 'Divisi A'
UNION ALL
SELECT id, 'Gang 2' FROM divisi WHERE name = 'Divisi A'
UNION ALL
SELECT id, 'Gang 1' FROM divisi WHERE name = 'Divisi B'
ON CONFLICT DO NOTHING;