/*
  # Add time_from and time_to to assignments

  1. Changes
    - `assignments`: Add optional `time_from` (time) and `time_to` (time) columns
      - NULL = use the property's default schedule times
      - When set, these override the property schedule for this specific assignment

  2. Notes
    - Existing rows remain valid (NULL = fallback to property times)
    - No constraints needed; app logic falls back to property times when NULL
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'time_from'
  ) THEN
    ALTER TABLE assignments ADD COLUMN time_from time DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'time_to'
  ) THEN
    ALTER TABLE assignments ADD COLUMN time_to time DEFAULT NULL;
  END IF;
END $$;
