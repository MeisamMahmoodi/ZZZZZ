/*
  # Add owner notification insert policy

  1. Security
    - Allow owners to insert notifications for employees in their company
*/

CREATE POLICY "Owners can insert notifications for their employees"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN companies c ON c.id = e.company_id
      WHERE e.id = notifications.employee_id
      AND (c.owner_id = auth.uid() OR c.owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );
