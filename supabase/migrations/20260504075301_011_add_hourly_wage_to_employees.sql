/*
  # Add hourly wage to employees

  1. Modified Tables
    - `employees`
      - `hourly_wage` (numeric, nullable) — individual hourly wage in EUR, nullable so employees without a set wage use the company default

  2. Important Notes
    - Nullable: employees without a specific wage can fall back to a company-wide default
    - Stored as numeric for precise monetary calculations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'hourly_wage'
  ) THEN
    ALTER TABLE employees ADD COLUMN hourly_wage numeric(8,2);
  END IF;
END $$;
