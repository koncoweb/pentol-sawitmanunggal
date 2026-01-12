/*
  # Fix Profiles INSERT Policy

  ## Problem
  Trigger `handle_new_user()` gagal insert ke table profiles karena missing INSERT policy.
  User signup error: "Database error saving new user"

  ## Solution
  Tambahkan INSERT policy untuk profiles table yang membolehkan:
  1. User bisa insert profile sendiri (via trigger saat signup)
  2. Service role bisa insert via trigger function

  ## Changes
  1. Add INSERT policy untuk profiles table
  2. Policy check: user hanya bisa insert profile dengan id = auth.uid()
*/

-- Add INSERT policy for profiles table
CREATE POLICY "Allow users to insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
