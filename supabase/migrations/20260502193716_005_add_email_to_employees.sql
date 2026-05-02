/*
  # Add email column to employees table

  1. Changes
    - Add `email` column (text, nullable) to employees
    - This stores the login email for employees who have auth accounts
    - Allows the owner UI to display and manage employee login credentials

  2. Notes
    - Nullable for backward compatibility with existing employees without auth accounts
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'email'
  ) THEN
    ALTER TABLE employees ADD COLUMN email text;
  END IF;
END $$;
