/*
  # Fix companies RLS policies

  ## Problem
  The existing SELECT and UPDATE policies on `companies` use a subquery into
  `auth.users` to compare owner_email. This subquery can hang under certain
  Supabase Auth configurations.

  ## Fix
  Replace the subquery with the built-in `auth.email()` helper function, which
  returns the authenticated user's email without an extra round-trip to auth.users.
  This is the recommended pattern and is safe and fast.

  ## Changes
  - Drop and recreate SELECT policy on companies
  - Drop and recreate UPDATE policy on companies
*/

DROP POLICY IF EXISTS "Owners can read own company by owner_id" ON companies;
DROP POLICY IF EXISTS "Owners can update own company by owner_id" ON companies;

CREATE POLICY "Owners can read own company"
  ON companies FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR owner_email = auth.email()
  );

CREATE POLICY "Owners can update own company"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR owner_email = auth.email()
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR owner_email = auth.email()
  );
