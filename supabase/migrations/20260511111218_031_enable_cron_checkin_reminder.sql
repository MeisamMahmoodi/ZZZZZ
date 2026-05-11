/*
  # Enable pg_cron and pg_net, schedule check-in reminder

  1. Changes
    - Enable pg_cron extension for scheduled jobs
    - Enable pg_net extension for async HTTP calls from PostgreSQL
    - Schedule a cron job that runs every 5 minutes to call the
      check-in-reminder edge function

  2. Notes
    - The cron job calls the edge function via HTTP using pg_net
    - The edge function finds assignments where time_from has passed
      by at least 5 minutes but the employee hasn't checked in yet,
      then sends a push notification reminder
    - The job is idempotent: the edge function tracks already-sent
      reminders to avoid duplicate notifications
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add a table to track sent reminders (prevents duplicate notifications)
CREATE TABLE IF NOT EXISTS checkin_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  sent_at timestamptz DEFAULT now(),
  UNIQUE(assignment_id)
);

ALTER TABLE checkin_reminders ENABLE ROW LEVEL SECURITY;

-- Only the service role (edge function) can access this table
CREATE POLICY "Service role manages checkin reminders"
  ON checkin_reminders
  FOR SELECT
  TO authenticated
  USING (false);

-- Schedule the cron job to run every 5 minutes
SELECT cron.schedule(
  'checkin-reminder',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT value FROM pg_catalog.pg_settings WHERE name = 'app.supabase_url') || '/functions/v1/check-in-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || (SELECT value FROM pg_catalog.pg_settings WHERE name = 'app.anon_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
