/*
  # Fix is_admin() to check profiles table as fallback

  The current is_admin() only checks auth.jwt() -> 'app_metadata' ->> 'role'.
  Admin users created via the admin cockpit have their role set in the profiles
  table but NOT in app_metadata, so is_admin() always returns false for them.

  Fix: Check app_metadata first (fast, no DB lookup), then fall back to a
  direct profiles check using a security-definer bypass to avoid RLS recursion.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    -- fast path: role stored in JWT app_metadata (set by some creation flows)
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR
    -- fallback: role stored only in profiles table (admin cockpit creation flow)
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    );
$$;
