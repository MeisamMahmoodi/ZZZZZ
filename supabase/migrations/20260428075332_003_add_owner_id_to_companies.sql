/*
  # Add owner_id to companies table

  1. Changes
    - Add `owner_id` column (uuid, FK → auth.users) to companies
    - This links the company directly to the auth user who owns it
    - Allows looking up company by owner_id instead of email

  2. Notes
    - owner_id is nullable for backward compatibility
    - New companies should set owner_id when creating
    - Existing companies can be updated to set owner_id
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update RLS: owners can read/update company by owner_id
CREATE POLICY "Owners can read own company by owner_id"
  ON companies FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Drop old policy and replace with combined one
DROP POLICY IF EXISTS "Owners can read own company" ON companies;
DROP POLICY IF EXISTS "Owners can update own company" ON companies;

CREATE POLICY "Owners can update own company by owner_id"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
