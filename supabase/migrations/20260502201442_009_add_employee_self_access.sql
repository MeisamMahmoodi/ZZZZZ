/*
  # Add employee self-access RLS policies

  1. Security
    - Employees can read their own record (by user_id)
    - Employees can update their own record (for sick leave self-report)
    - These are in addition to existing company-based policies
*/

CREATE POLICY "Employees can read own record"
  ON employees FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Employees can update own record"
  ON employees FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
