/*
  # Fix infinite recursion in profiles RLS

  ## Problem
  The "Admins can read all profiles" policy uses a subquery on the profiles table itself,
  causing infinite recursion when any authenticated user queries profiles. This results in
  a 500 Internal Server Error.

  ## Fix
  1. Drop the recursive "Admins can read all profiles" policy
  2. Create a SECURITY DEFINER function that safely checks admin role without triggering RLS
  3. Recreate the admin policy using that function
  4. Also fix the same recursion issue in "Admins can read all companies" and
     "Admins can read all employees" policies
*/

-- Create a security definer function to check admin role without triggering RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Fix profiles: drop recursive policy and recreate using the safe function
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());

-- Fix companies: drop recursive policy and recreate
DROP POLICY IF EXISTS "Admins can read all companies" ON companies;

CREATE POLICY "Admins can read all companies"
  ON companies FOR SELECT
  TO authenticated
  USING (is_admin());

-- Fix employees: drop recursive policy and recreate
DROP POLICY IF EXISTS "Admins can read all employees" ON employees;

CREATE POLICY "Admins can read all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (is_admin());
