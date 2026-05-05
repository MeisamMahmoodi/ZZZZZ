/*
  # Fix auth_user_company_id() for owners

  ## Problem
  auth_user_company_id() only looks up company_id from the employees table.
  Owners are NOT in employees — they are only in companies.owner_id.
  So every RLS policy using this function returns NULL for owners,
  meaning owners can see nothing: no employees, no properties, no assignments.

  ## Fix
  Look up employees first (for employee users), then fall back to companies
  (for owner users). This covers both roles with one function.
*/

CREATE OR REPLACE FUNCTION public.auth_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    -- Employee path: user is listed in employees table
    (SELECT company_id FROM public.employees WHERE user_id = auth.uid() LIMIT 1),
    -- Owner path: user owns a company
    (SELECT id FROM public.companies WHERE owner_id = auth.uid() LIMIT 1)
  );
$$;
