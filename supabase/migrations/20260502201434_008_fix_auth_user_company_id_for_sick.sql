/*
  # Fix auth_user_company_id to include sick employees

  1. Changes
    - Remove `AND status = 'active'` filter from auth_user_company_id()
    - Sick employees still belong to their company and need data access
    - This fixes the infinite loading screen after sick leave submission

  2. Notes
    - The status filter was preventing sick employees from reading any data
    - Employees who are sick still need to access their assignments, notifications, etc.
*/

CREATE OR REPLACE FUNCTION auth_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM employees WHERE user_id = auth.uid()
  UNION
  SELECT id FROM companies WHERE owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  LIMIT 1
$$;
