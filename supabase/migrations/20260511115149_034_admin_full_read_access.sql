/*
  # Admin full read access to all tables

  1. Purpose
    - Give admin role SELECT access to every public table so the admin cockpit
      can display the complete database (sandbox view).
    - Also adds admin DELETE policy on companies for hard-delete support.

  2. Changes
    - New "Admins can read" SELECT policies on:
      properties, assignments, sick_reports, replacement_requests,
      employee_properties, notifications, push_subscriptions, checkin_reminders
    - New admin DELETE policy on companies
    - New admin UPDATE policy on profiles

  3. Security Notes
    - Policies check role via public.is_admin() helper
    - Admin policies are additive
    - All tables remain with RLS enabled
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='properties' AND policyname='Admins can read all properties') THEN
    CREATE POLICY "Admins can read all properties" ON properties FOR SELECT TO authenticated USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='assignments' AND policyname='Admins can read all assignments') THEN
    CREATE POLICY "Admins can read all assignments" ON assignments FOR SELECT TO authenticated USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sick_reports' AND policyname='Admins can read all sick_reports') THEN
    CREATE POLICY "Admins can read all sick_reports" ON sick_reports FOR SELECT TO authenticated USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='replacement_requests' AND policyname='Admins can read all replacement_requests') THEN
    CREATE POLICY "Admins can read all replacement_requests" ON replacement_requests FOR SELECT TO authenticated USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_properties' AND policyname='Admins can read all employee_properties') THEN
    CREATE POLICY "Admins can read all employee_properties" ON employee_properties FOR SELECT TO authenticated USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='Admins can read all notifications') THEN
    CREATE POLICY "Admins can read all notifications" ON notifications FOR SELECT TO authenticated USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='push_subscriptions' AND policyname='Admins can read all push_subscriptions') THEN
    CREATE POLICY "Admins can read all push_subscriptions" ON push_subscriptions FOR SELECT TO authenticated USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='checkin_reminders' AND policyname='Admins can read all checkin_reminders') THEN
    CREATE POLICY "Admins can read all checkin_reminders" ON checkin_reminders FOR SELECT TO authenticated USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='Admins can delete companies') THEN
    CREATE POLICY "Admins can delete companies" ON companies FOR DELETE TO authenticated USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can update profiles') THEN
    CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;
