/*
  # Fix security issues

  1. Fix mutable search_path on auth_user_company_id function
     - Add SET search_path = '' to prevent search_path hijacking attacks

  2. Revoke public/authenticated EXECUTE on auth_user_company_id
     - This is a SECURITY DEFINER function that should not be callable via RPC by end users
     - Revoke from anon and authenticated roles; only postgres/service_role needs it internally

  3. Remove overly broad SELECT policy on storage.objects for assignment-photos bucket
     - Public buckets allow direct URL access without needing a SELECT policy on storage.objects
     - Listing all files is unnecessary and exposes data
*/

-- 1. Fix search_path and revoke RPC access on auth_user_company_id
CREATE OR REPLACE FUNCTION public.auth_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT company_id
  FROM public.employees
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- 2. Revoke EXECUTE from anon and authenticated roles
REVOKE EXECUTE ON FUNCTION public.auth_user_company_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.auth_user_company_id() FROM authenticated;

-- 3. Remove the broad listing policy on assignment-photos storage bucket
DROP POLICY IF EXISTS "Public can read assignment photos" ON storage.objects;
