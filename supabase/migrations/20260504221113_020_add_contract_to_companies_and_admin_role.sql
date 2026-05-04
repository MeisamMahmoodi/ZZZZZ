/*
  # Add contract plan to companies + admin role support

  ## Changes
  1. `companies` table
     - New column `contract` (text): 'Basic' | 'Pro' | 'Enterprise', default 'Basic'
  2. `profiles` table
     - Extend role CHECK to also allow 'admin'
  3. RLS on companies
     - New SELECT policy so admin users can read ALL companies
  4. RLS on profiles
     - New SELECT policy so admin users can read ALL profiles
  5. RLS on employees
     - New SELECT policy so admin users can read ALL employees

  ## Notes
  - Admin is a platform-level superuser, not a company owner
  - Existing data is untouched; companies get contract = 'Basic' by default
*/

-- 1. Add contract column to companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS contract text NOT NULL DEFAULT 'Basic'
    CHECK (contract IN ('Basic', 'Pro', 'Enterprise'));

-- 2. Drop old role constraint and recreate including 'admin'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'employee', 'admin'));

-- 3. Admin can read all companies
CREATE POLICY "Admins can read all companies"
  ON companies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 4. Admin can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles self
      WHERE self.id = auth.uid()
        AND self.role = 'admin'
    )
  );

-- 5. Admin can read all employees
CREATE POLICY "Admins can read all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
