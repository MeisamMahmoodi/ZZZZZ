/*
  # Add geocoordinates cache to properties

  1. Modified Tables
    - `properties`
      - `lat` (double precision, nullable) — cached geocoded latitude of the property address
      - `lng` (double precision, nullable) — cached geocoded longitude of the property address

  2. Important Notes
    - Nullable: populated lazily on first employee check-in via Nominatim geocoding
    - Caching avoids repeated geocoding API calls for the same property
    - Also adds `gps_radius_m` column so owners can configure allowed check-in radius (default 300m)
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'lat') THEN
    ALTER TABLE properties ADD COLUMN lat double precision;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'lng') THEN
    ALTER TABLE properties ADD COLUMN lng double precision;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'gps_radius_m') THEN
    ALTER TABLE properties ADD COLUMN gps_radius_m integer DEFAULT 300;
  END IF;
END $$;
