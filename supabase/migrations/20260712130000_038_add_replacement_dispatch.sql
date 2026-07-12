/*
  # Smart Ersatz-Dispatch: automatic cascading replacement requests

  1. Changes
    - Add `expires_at` to `replacement_requests`: when set, this row is part
      of the automatic dispatch cascade and marks the deadline by which the
      candidate must respond before the system moves on to the next one.
      NULL means the request was created manually (existing ReplacementModal
      flow) and has no timeout.
    - Schedule a cron job (every 2 minutes) that calls the new
      `replacement-dispatch` edge function, following the same pattern as
      the existing `checkin-reminder` cron job.

  2. Notes
    - No RLS changes needed: the edge function uses the service role key,
      which bypasses RLS. Existing read/update policies for owners and
      employees already cover the new column.
    - This does not change legal employment law itself — the edge function
      applies a best-effort heuristic (weekly hours + rest period) to filter
      candidates, not a certified compliance check.
*/

ALTER TABLE replacement_requests ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_replacement_requests_sick_report ON replacement_requests(sick_report_id);
CREATE INDEX IF NOT EXISTS idx_replacement_requests_expires ON replacement_requests(expires_at) WHERE expires_at IS NOT NULL;

-- Owners previously had no way to update a replacement request (only the
-- requested employee could, to accept/decline). Needed so the owner can
-- manually skip/override a candidate in the live dispatch view.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'replacement_requests'
      AND policyname = 'Company owners can update replacement requests'
  ) THEN
    CREATE POLICY "Company owners can update replacement requests"
      ON replacement_requests FOR UPDATE
      TO authenticated
      USING (property_id IN (SELECT id FROM properties WHERE company_id = auth_user_company_id()))
      WITH CHECK (property_id IN (SELECT id FROM properties WHERE company_id = auth_user_company_id()));
  END IF;
END $$;

-- Schedule the cron job to run every 2 minutes
SELECT cron.schedule(
  'replacement-dispatch',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT value FROM pg_catalog.pg_settings WHERE name = 'app.supabase_url') || '/functions/v1/replacement-dispatch',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || (SELECT value FROM pg_catalog.pg_settings WHERE name = 'app.anon_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
