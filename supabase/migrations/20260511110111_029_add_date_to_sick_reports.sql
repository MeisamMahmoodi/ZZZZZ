/*
  # Add date_to column to sick_reports

  1. Changes
    - `sick_reports`: Add optional `date_to` column (date) for multi-day sick leave
      - NULL means single-day (same as `date`)
      - When set, represents the last day of the sick leave period

  2. Notes
    - Existing rows remain valid (date_to = NULL = single day)
    - No constraint needed; app logic enforces date_to >= date
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sick_reports' AND column_name = 'date_to'
  ) THEN
    ALTER TABLE sick_reports ADD COLUMN date_to date DEFAULT NULL;
  END IF;
END $$;
