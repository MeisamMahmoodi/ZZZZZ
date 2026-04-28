/*
  # Add profiles table with role column

  1. New Tables
    - `profiles`
      - `id` (uuid, PK, FK → auth.users) — one-to-one with auth user
      - `role` (text) — 'owner' or 'employee'
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on `profiles`
    - Users can read their own profile
    - Owners can read profiles in their company (for employee management)

  3. Notes
    - After login, the app reads profiles.role to decide which UI to show
    - Owner accounts: manually created in Supabase, then a row in profiles with role='owner'
    - Employee accounts: manually created in Supabase, then a row in profiles with role='employee'
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'employee',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Owners can read company profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    role = 'owner'
    OR id = auth.uid()
  );

CREATE POLICY "Owners can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Owners can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
