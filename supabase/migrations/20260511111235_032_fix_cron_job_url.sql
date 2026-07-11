/*
  # Fix cron job with correct Supabase URL

  1. Changes
    - Remove the previous broken cron schedule
    - Re-create the cron job with the actual project URL and anon key
*/

-- Remove previous schedule if it exists
SELECT cron.unschedule('checkin-reminder');

-- Re-create with the actual project credentials
select
  cron.schedule(
    'checkin-reminder',
    '*/5 * * * *',
    $$
    select net.http_post(
      url := 'https://omnuxnaxqjxsygvrgzjn.supabase.co/functions/v1/check-in-reminder',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tbnV4bmF4cWp4c3lndnJnempuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODU2MzQsImV4cCI6MjA5OTM2MTYzNH0.gHKDGLpgaJykIABU8hWTgrLgk43WjLcP6SGwIFBdeLQ'),
      body := '{}'::jsonb
    );
    $$
  );
