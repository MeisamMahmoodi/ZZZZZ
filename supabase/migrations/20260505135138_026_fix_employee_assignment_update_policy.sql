/*
  # Fix employee assignment update policy for check-in/checkout

  ## Problem
  The existing UPDATE policy on assignments uses auth_user_company_id() which
  works for owners but employees need to update their own assignments directly
  (for check-in photo, checkout photo, status, timestamps).

  ## Fix
  Add a dedicated policy allowing employees to update assignments where they
  are the assigned employee.
*/

CREATE POLICY "Employees can update own assignments"
  ON public.assignments
  FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );
