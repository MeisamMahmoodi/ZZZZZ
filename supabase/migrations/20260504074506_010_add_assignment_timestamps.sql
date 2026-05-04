/*
  # Add check-in and completion timestamps to assignments

  1. Modified Tables
    - `assignments`
      - `checked_in_at` (timestamptz, nullable) — when the employee checked in
      - `completed_at` (timestamptz, nullable) — when the employee completed the assignment

  2. Important Notes
    - These columns are nullable since existing assignments won't have timestamps
    - The frontend already references `updated_at` but no dedicated column existed
    - Using separate columns for check-in and completion gives precise tracking
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'checked_in_at'
  ) THEN
    ALTER TABLE assignments ADD COLUMN checked_in_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE assignments ADD COLUMN completed_at timestamptz;
  END IF;
END $$;
