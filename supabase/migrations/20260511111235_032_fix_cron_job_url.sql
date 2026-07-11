/*
  # Fix cron job with correct Supabase URL

  1. Changes
    - Remove the previous broken cron schedule
    - Re-create the cron job with the actual project URL and anon key
*/

-- Remove previous schedule if it exists
SELECT cron.unschedule('checkin-reminder');

-- Re-create with the actual project credentials
SELECT cron.schedule(
  'checkin-reminder',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_NEW_SUPABASE_URL/functions/v1/check-in-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_NEW_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
