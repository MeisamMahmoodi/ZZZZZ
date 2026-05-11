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
    url := 'https://byfaquytyqumgcuiubzh.supabase.co/functions/v1/check-in-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5ZmFxdXl0eXF1bWdjdWl1YnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMzU4OTksImV4cCI6MjA5MjkxMTg5OX0.CbXSJYTyUABtpalxubntzzHNmCu46NhOh_wP2ZYcWFY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
