/*
  # Fix employee check-in/check-out RLS policies

  Problems fixed:
  1. Storage: employees could INSERT photos but not UPDATE (upsert needs both)
  2. Storage: employees had no SELECT/DELETE policy (needed for public URL + upsert)
  3. Assignments SELECT: only used auth_user_company_id() which may fail for employees
     who are not yet linked — add explicit employee-own-assignment SELECT policy
*/

-- ============================================================
-- Storage: assignment-photos
-- ============================================================

-- Allow authenticated users to read photos (needed for public URL generation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can read assignment photos'
  ) THEN
    CREATE POLICY "Authenticated users can read assignment photos"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'assignment-photos');
  END IF;
END $$;

-- Allow authenticated users to update (needed for upsert: true)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated users can update assignment photos'
  ) THEN
    CREATE POLICY "Authenticated users can update assignment photos"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'assignment-photos')
      WITH CHECK (bucket_id = 'assignment-photos');
  END IF;
END $$;

-- ============================================================
-- Assignments: employees can SELECT their own assignments
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'assignments'
      AND policyname = 'Employees can read own assignments'
  ) THEN
    CREATE POLICY "Employees can read own assignments"
      ON public.assignments FOR SELECT
      TO authenticated
      USING (
        employee_id IN (
          SELECT id FROM public.employees WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
