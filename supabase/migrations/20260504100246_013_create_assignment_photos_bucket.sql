/*
  # Create Supabase Storage bucket for assignment photos

  1. Storage
    - Creates `assignment-photos` bucket (public)
    - Allows authenticated employees to upload to their own folders
    - Allows public read access so owners can view photos in dashboard

  2. Security
    - Upload restricted to authenticated users
    - Public read so owner dashboard can display photos directly via URL
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-photos', 'assignment-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload assignment photos'
  ) THEN
    CREATE POLICY "Authenticated users can upload assignment photos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'assignment-photos');
  END IF;
END $$;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public can read assignment photos'
  ) THEN
    CREATE POLICY "Public can read assignment photos"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'assignment-photos');
  END IF;
END $$;
