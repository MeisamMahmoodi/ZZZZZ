/*
  # Fix profiles RLS infinite recursion - final fix

  ## Problem
  The "Admins can read all profiles" policy calls is_admin(), which queries
  public.profiles. Even with SET search_path = '', RLS is still evaluated on
  that internal query because SECURITY DEFINER only bypasses RLS when the
  function owner is a superuser OR when the table has RLS bypass for that role.
  This causes infinite recursion → 500 on every login.

  ## Fix
  1. Drop the recursive "Admins can read all profiles" and "Admins can insert profiles" policies
  2. Replace with JWT-based admin check using auth.jwt() which never touches profiles
  3. Also fix "Owners can read company profiles" which incorrectly exposes all owner rows
*/

-- Drop all problematic policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can read company profiles" ON public.profiles;

-- Recreate is_admin using JWT app_metadata to avoid any table lookup
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- Admin read policy using JWT (no table recursion)
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

-- Admin insert policy using JWT
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );
