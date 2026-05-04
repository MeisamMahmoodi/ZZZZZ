/*
  # Add push_subscriptions table for Web Push notifications

  1. New Tables
    - `push_subscriptions`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees) — one subscription per employee
      - `endpoint` (text) — push service endpoint URL
      - `p256dh` (text) — public key for encryption
      - `auth` (text) — auth secret
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - RLS enabled
    - Employees can insert/update/delete their own subscription
    - Employees can read their own subscription
    - Owner (service role) can read all subscriptions in their company (needed for sending pushes via edge function)
*/

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can read own push subscription"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = push_subscriptions.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can insert own push subscription"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = push_subscriptions.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update own push subscription"
  ON push_subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = push_subscriptions.employee_id
      AND employees.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = push_subscriptions.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can delete own push subscription"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = push_subscriptions.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_employee_id ON push_subscriptions(employee_id);
