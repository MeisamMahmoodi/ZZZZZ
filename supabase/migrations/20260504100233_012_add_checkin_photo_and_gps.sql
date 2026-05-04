/*
  # Add photo URLs and GPS coordinates to assignments

  1. Modified Tables
    - `assignments`
      - `checkin_photo_url` (text, nullable) — URL of photo taken at check-in
      - `checkout_photo_url` (text, nullable) — URL of photo taken at checkout
      - `checkin_lat` (double precision, nullable) — GPS latitude at check-in
      - `checkin_lng` (double precision, nullable) — GPS longitude at check-in
      - `checkout_lat` (double precision, nullable) — GPS latitude at checkout
      - `checkout_lng` (double precision, nullable) — GPS longitude at checkout

  2. Security
    - Employees can update their own assignment rows (already covered by existing RLS policies)
    - Photo storage is handled via Supabase Storage with its own policies

  3. Important Notes
    - All new columns are nullable — existing assignments are unaffected
    - URLs point to Supabase Storage public bucket
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'checkin_photo_url') THEN
    ALTER TABLE assignments ADD COLUMN checkin_photo_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'checkout_photo_url') THEN
    ALTER TABLE assignments ADD COLUMN checkout_photo_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'checkin_lat') THEN
    ALTER TABLE assignments ADD COLUMN checkin_lat double precision;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'checkin_lng') THEN
    ALTER TABLE assignments ADD COLUMN checkin_lng double precision;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'checkout_lat') THEN
    ALTER TABLE assignments ADD COLUMN checkout_lat double precision;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'checkout_lng') THEN
    ALTER TABLE assignments ADD COLUMN checkout_lng double precision;
  END IF;
END $$;
