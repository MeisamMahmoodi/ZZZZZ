/*
  # Add notifications table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees)
      - `type` (text: new_assignment, replacement_request, etc.)
      - `title` (text)
      - `message` (text)
      - `read` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `notifications` table
    - Employees can read their own notifications
    - Employees can update their own notifications (mark as read)
    - Owner can insert notifications for their company's employees
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = notifications.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = notifications.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_notifications_employee_id ON notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
