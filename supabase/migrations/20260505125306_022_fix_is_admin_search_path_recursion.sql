/*
  # Fix is_admin() causing 500 on login

  ## Problem
  is_admin() is SECURITY DEFINER but has no SET search_path = '', so it runs with
  the caller's search_path and hits RLS on the profiles table. The "Admins can read
  all profiles" policy calls is_admin(), which queries profiles, which triggers the
  same policy again → infinite recursion → 500 Internal Server Error on login.

  ## Fix
  Recreate is_admin() with SET search_path = '' so it bypasses RLS entirely
  (SECURITY DEFINER functions with a fixed search_path run as the function owner,
  which is postgres/superuser and exempt from RLS).
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;
