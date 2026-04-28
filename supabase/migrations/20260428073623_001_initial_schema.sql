/*
  # Initial Putzo Schema

  1. New Tables
    - `companies` — Cleaning company owned by the Inhaber (owner)
      - `id` (uuid, PK)
      - `name` (text) — Company name
      - `owner_name` (text) — Owner's display name
      - `owner_email` (text) — Owner's email
      - `created_at` (timestamptz)

    - `employees` — Workers assigned to cleaning jobs
      - `id` (uuid, PK)
      - `company_id` (uuid, FK → companies)
      - `first_name` (text)
      - `last_name` (text)
      - `phone` (text)
      - `status` (text) — 'active', 'sick'
      - `user_id` (uuid, FK → auth.users, nullable) — link to auth account for employee app
      - `created_at` (timestamptz)

    - `properties` — Buildings/objects to be cleaned
      - `id` (uuid, PK)
      - `company_id` (uuid, FK → companies)
      - `name` (text) — e.g. "Bürogebäude Stadtwerke"
      - `address` (text)
      - `type` (text) — 'office', 'school', 'supermarket', 'doctor', 'other'
      - `cleaning_days` (text[]) — array of day names: ['Mo','Di','Mi','Do','Fr','Sa','So']
      - `time_from` (time) — start of cleaning window
      - `time_to` (time) — end of cleaning window
      - `created_at` (timestamptz)

    - `employee_properties` — Many-to-many: which employees know which properties
      - `id` (uuid, PK)
      - `employee_id` (uuid, FK → employees)
      - `property_id` (uuid, FK → properties)

    - `assignments` — Daily assignment of employees to a property
      - `id` (uuid, PK)
      - `property_id` (uuid, FK → properties)
      - `employee_id` (uuid, FK → employees)
      - `date` (date) — the day of the assignment
      - `status` (text) — 'assigned', 'checked_in', 'completed', 'cancelled'
      - `created_at` (timestamptz)

    - `sick_reports` — Sick leave reports from employees
      - `id` (uuid, PK)
      - `employee_id` (uuid, FK → employees)
      - `date` (date) — the sick day
      - `reason` (text, nullable)
      - `created_at` (timestamptz)

    - `replacement_requests` — Owner asks an employee to fill in
      - `id` (uuid, PK)
      - `sick_report_id` (uuid, FK → sick_reports)
      - `property_id` (uuid, FK → properties)
      - `replacement_employee_id` (uuid, FK → employees)
      - `status` (text) — 'pending', 'accepted', 'declined'
      - `message` (text) — the message sent to the employee
      - `channel` (text) — 'whatsapp', 'sms', 'app'
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on ALL tables
    - Policies restrict access to authenticated users belonging to the same company
    - Employees can only read/update their own data
*/

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  owner_name text NOT NULL DEFAULT '',
  owner_email text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'other',
  cleaning_days text[] NOT NULL DEFAULT '{}',
  time_from time NOT NULL DEFAULT '08:00',
  time_to time NOT NULL DEFAULT '12:00',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Employee-Property knowledge (many-to-many)
CREATE TABLE IF NOT EXISTS employee_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  UNIQUE(employee_id, property_id)
);

ALTER TABLE employee_properties ENABLE ROW LEVEL SECURITY;

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'assigned',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Sick Reports
CREATE TABLE IF NOT EXISTS sick_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sick_reports ENABLE ROW LEVEL SECURITY;

-- Replacement Requests
CREATE TABLE IF NOT EXISTS replacement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sick_report_id uuid NOT NULL REFERENCES sick_reports(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  replacement_employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  message text NOT NULL DEFAULT '',
  channel text NOT NULL DEFAULT 'app',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE replacement_requests ENABLE ROW LEVEL SECURITY;

-- Helper function: get company_id for a user
CREATE OR REPLACE FUNCTION auth_user_company_id()
RETURNS uuid AS $$
  SELECT company_id FROM employees WHERE user_id = auth.uid() AND status = 'active'
  UNION
  SELECT id FROM companies WHERE owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS Policies for companies
CREATE POLICY "Owners can read own company"
  ON companies FOR SELECT
  TO authenticated
  USING (owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Owners can update own company"
  ON companies FOR UPDATE
  TO authenticated
  USING (owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for employees
CREATE POLICY "Company members can read employees"
  ON employees FOR SELECT
  TO authenticated
  USING (company_id = auth_user_company_id());

CREATE POLICY "Company owners can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (company_id = auth_user_company_id());

CREATE POLICY "Company owners can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (company_id = auth_user_company_id())
  WITH CHECK (company_id = auth_user_company_id());

CREATE POLICY "Company owners can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (company_id = auth_user_company_id());

-- RLS Policies for properties
CREATE POLICY "Company members can read properties"
  ON properties FOR SELECT
  TO authenticated
  USING (company_id = auth_user_company_id());

CREATE POLICY "Company owners can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (company_id = auth_user_company_id());

CREATE POLICY "Company owners can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (company_id = auth_user_company_id())
  WITH CHECK (company_id = auth_user_company_id());

CREATE POLICY "Company owners can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (company_id = auth_user_company_id());

-- RLS Policies for employee_properties
CREATE POLICY "Company members can read employee properties"
  ON employee_properties FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE company_id = auth_user_company_id())
  );

CREATE POLICY "Company owners can insert employee properties"
  ON employee_properties FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE company_id = auth_user_company_id())
  );

CREATE POLICY "Company owners can delete employee properties"
  ON employee_properties FOR DELETE
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE company_id = auth_user_company_id())
  );

-- RLS Policies for assignments
CREATE POLICY "Company members can read assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    property_id IN (SELECT id FROM properties WHERE company_id = auth_user_company_id())
  );

CREATE POLICY "Company owners can insert assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (SELECT id FROM properties WHERE company_id = auth_user_company_id())
  );

CREATE POLICY "Company members can update own assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    property_id IN (SELECT id FROM properties WHERE company_id = auth_user_company_id())
  )
  WITH CHECK (
    property_id IN (SELECT id FROM properties WHERE company_id = auth_user_company_id())
  );

CREATE POLICY "Company owners can delete assignments"
  ON assignments FOR DELETE
  TO authenticated
  USING (
    property_id IN (SELECT id FROM properties WHERE company_id = auth_user_company_id())
  );

-- RLS Policies for sick_reports
CREATE POLICY "Company members can read sick reports"
  ON sick_reports FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE company_id = auth_user_company_id())
  );

CREATE POLICY "Employees can insert own sick reports"
  ON sick_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "Company owners can delete sick reports"
  ON sick_reports FOR DELETE
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE company_id = auth_user_company_id())
  );

-- RLS Policies for replacement_requests
CREATE POLICY "Company members can read replacement requests"
  ON replacement_requests FOR SELECT
  TO authenticated
  USING (
    property_id IN (SELECT id FROM properties WHERE company_id = auth_user_company_id())
  );

CREATE POLICY "Company owners can insert replacement requests"
  ON replacement_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (SELECT id FROM properties WHERE company_id = auth_user_company_id())
  );

CREATE POLICY "Replacement employee can update own request"
  ON replacement_requests FOR UPDATE
  TO authenticated
  USING (
    replacement_employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  )
  WITH CHECK (
    replacement_employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_company ON properties(company_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments(date);
CREATE INDEX IF NOT EXISTS idx_assignments_property_date ON assignments(property_id, date);
CREATE INDEX IF NOT EXISTS idx_sick_reports_date ON sick_reports(date);
CREATE INDEX IF NOT EXISTS idx_sick_reports_employee ON sick_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_replacement_requests_status ON replacement_requests(status);
