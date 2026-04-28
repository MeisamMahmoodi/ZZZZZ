/*
  # Add missing RLS policies

  1. New Policies
    - `employee_properties` UPDATE: Company owners can update employee-property links
    - `sick_reports` INSERT: Company owners can insert sick reports (for marking employees sick from the owner UI)
    - `sick_reports` UPDATE: Company owners can update sick reports

  2. Notes
    - The owner UI allows marking employees as sick, which inserts into sick_reports
    - Previously only employees could insert their own sick reports
    - employee_properties had no UPDATE policy, preventing reassignment edits
*/

-- Employee properties: owners can update
CREATE POLICY "Company owners can update employee properties"
  ON employee_properties FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE company_id = auth_user_company_id())
  )
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE company_id = auth_user_company_id())
  );

-- Sick reports: owners can insert (for marking employees sick from owner UI)
CREATE POLICY "Company owners can insert sick reports"
  ON sick_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE company_id = auth_user_company_id())
  );

-- Sick reports: owners can update
CREATE POLICY "Company owners can update sick reports"
  ON sick_reports FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employees WHERE company_id = auth_user_company_id())
  )
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE company_id = auth_user_company_id())
  );
