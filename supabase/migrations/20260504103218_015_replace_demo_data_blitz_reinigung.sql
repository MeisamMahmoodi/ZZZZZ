/*
  # Replace all demo data with Blitz Reinigung GmbH scenario

  1. Company
     - Blitz Reinigung GmbH, Inhaber Thomas Maier

  2. Employees (6)
     - Maria Kovac, Ahmed Yilmaz, Petra Huber, Stefan Bauer, Jana Novak, Klaus Wagner (krank)

  3. Properties (5)
     - Praxis Dr. Hoffmann, Bürogebäude Maximilianstraße, Rewe Innenstadt,
       Kindergarten Sonnenschein, Kanzlei Dr. Stein

  4. Today's assignments (5)
     - Rewe: Maria → completed (06:15 – 08:20)
     - Bürogebäude: Ahmed → completed (08:05 – 11:50)
     - Kindergarten: Petra → checked_in seit 09:03 (noch aktiv)
     - Kanzlei: Klaus → assigned aber KRANK → roter Alert, kein Ersatz
     - Praxis: Stefan → assigned, läuft heute Morgen noch

  5. Sick report
     - Klaus Wagner, heute, Grippe → keine replacement_request → offener Alert

  6. Payroll history (vorherige Monate für Abrechnung)
*/

-- ============================================================
-- 0. CLEAN UP OLD DATA
-- ============================================================
DELETE FROM replacement_requests;
DELETE FROM notifications;
DELETE FROM sick_reports;
DELETE FROM assignments;
DELETE FROM employee_properties;

-- Remove old employees (keep Lisa's user_id row for login)
UPDATE employees SET
  first_name = 'Maria', last_name = 'Kovac',
  phone = '+49 151 11223344', status = 'active',
  hourly_wage = 13.00, email = NULL, user_id = NULL
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000011';

UPDATE employees SET
  first_name = 'Ahmed', last_name = 'Yilmaz',
  phone = '+49 152 22334455', status = 'active',
  hourly_wage = 14.00, email = NULL, user_id = NULL
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000012';

UPDATE employees SET
  first_name = 'Petra', last_name = 'Huber',
  phone = '+49 153 33445566', status = 'active',
  hourly_wage = 14.50, email = NULL, user_id = NULL
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000013';

-- Keep Lisa as employee login (id ..010), repurpose as Stefan Bauer
UPDATE employees SET
  first_name = 'Stefan', last_name = 'Bauer',
  phone = '+49 154 44556677', status = 'active',
  hourly_wage = 15.00, email = 'stefan@blitz-reinigung.de', user_id = user_id
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000010';

-- Jana Novak
UPDATE employees SET
  first_name = 'Jana', last_name = 'Novak',
  phone = '+49 155 55667788', status = 'active',
  hourly_wage = 16.00, email = NULL, user_id = NULL
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000014';

-- Klaus Wagner — KRANK
UPDATE employees SET
  first_name = 'Klaus', last_name = 'Wagner',
  phone = '+49 156 66778899', status = 'sick',
  hourly_wage = 13.50, email = NULL, user_id = NULL
WHERE id = 'e1b2c3d4-0000-0000-0000-000000000015';

-- Delete the extra 4 old employees
DELETE FROM employees WHERE id IN (
  'e1b2c3d4-0000-0000-0000-000000000016',
  'e1b2c3d4-0000-0000-0000-000000000017',
  'e1b2c3d4-0000-0000-0000-000000000018',
  'e1b2c3d4-0000-0000-0000-000000000019'
);

-- ============================================================
-- 1. COMPANY
-- ============================================================
UPDATE companies SET
  name = 'Blitz Reinigung GmbH',
  owner_name = 'Thomas Maier',
  owner_email = 'owner@putzo.de'
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000001';

-- ============================================================
-- 2. PROPERTIES — replace all 8 with exactly 5
-- ============================================================
-- Keep IDs we'll reuse, delete the rest
DELETE FROM properties WHERE id IN (
  'a1b2c3d4-0000-0000-0000-000000000021',
  'a1b2c3d4-0000-0000-0000-000000000025',
  'a1b2c3d4-0000-0000-0000-000000000027'
);

-- Praxis Dr. Hoffmann (was Praxis Dr. Weber → reuse id 023)
UPDATE properties SET
  name = 'Praxis Dr. Hoffmann',
  address = 'Annastraße 15, 80802 München',
  type = 'doctor',
  cleaning_days = ARRAY['Mon','Tue','Wed','Thu','Fri'],
  time_from = '07:00', time_to = '09:00',
  lat = NULL, lng = NULL
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000023';

-- Bürogebäude Maximilianstraße (reuse id 020)
UPDATE properties SET
  name = 'Bürogebäude Maximilianstraße',
  address = 'Maximilianstraße 12, 80539 München',
  type = 'office',
  cleaning_days = ARRAY['Mon','Tue','Wed','Thu','Fri'],
  time_from = '08:00', time_to = '12:00',
  lat = NULL, lng = NULL
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000020';

-- Rewe Innenstadt (reuse id 022)
UPDATE properties SET
  name = 'Rewe Innenstadt',
  address = 'Kaufingerstraße 8, 80331 München',
  type = 'supermarket',
  cleaning_days = ARRAY['Mon','Tue','Wed','Thu','Fri','Sat'],
  time_from = '06:00', time_to = '08:30',
  lat = NULL, lng = NULL
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000022';

-- Kindergarten Sonnenschein (reuse id 024)
UPDATE properties SET
  name = 'Kindergarten Sonnenschein',
  address = 'Schleißheimer Str. 45, 80797 München',
  type = 'school',
  cleaning_days = ARRAY['Mon','Tue','Wed','Thu','Fri'],
  time_from = '09:00', time_to = '11:30',
  lat = NULL, lng = NULL
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000024';

-- Kanzlei Dr. Stein (reuse id 026)
UPDATE properties SET
  name = 'Kanzlei Dr. Stein',
  address = 'Maximilianstraße 35, 80539 München',
  type = 'office',
  cleaning_days = ARRAY['Mon','Wed','Fri'],
  time_from = '18:00', time_to = '21:00',
  lat = NULL, lng = NULL
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000026';

-- ============================================================
-- 3. EMPLOYEE ↔ PROPERTY MAPPINGS
-- ============================================================
INSERT INTO employee_properties (employee_id, property_id) VALUES
  -- Maria Kovac → Rewe, Kindergarten
  ('a1b2c3d4-0000-0000-0000-000000000011', 'a1b2c3d4-0000-0000-0000-000000000022'),
  ('a1b2c3d4-0000-0000-0000-000000000011', 'a1b2c3d4-0000-0000-0000-000000000024'),
  -- Ahmed Yilmaz → Bürogebäude, Praxis
  ('a1b2c3d4-0000-0000-0000-000000000012', 'a1b2c3d4-0000-0000-0000-000000000020'),
  ('a1b2c3d4-0000-0000-0000-000000000012', 'a1b2c3d4-0000-0000-0000-000000000023'),
  -- Petra Huber → Kindergarten, Kanzlei
  ('a1b2c3d4-0000-0000-0000-000000000013', 'a1b2c3d4-0000-0000-0000-000000000024'),
  ('a1b2c3d4-0000-0000-0000-000000000013', 'a1b2c3d4-0000-0000-0000-000000000026'),
  -- Stefan Bauer → Praxis, Bürogebäude
  ('a1b2c3d4-0000-0000-0000-000000000010', 'a1b2c3d4-0000-0000-0000-000000000023'),
  ('a1b2c3d4-0000-0000-0000-000000000010', 'a1b2c3d4-0000-0000-0000-000000000020'),
  -- Jana Novak → Rewe, Bürogebäude
  ('a1b2c3d4-0000-0000-0000-000000000014', 'a1b2c3d4-0000-0000-0000-000000000022'),
  ('a1b2c3d4-0000-0000-0000-000000000014', 'a1b2c3d4-0000-0000-0000-000000000020'),
  -- Klaus Wagner → Kanzlei, Rewe
  ('e1b2c3d4-0000-0000-0000-000000000015', 'a1b2c3d4-0000-0000-0000-000000000026'),
  ('e1b2c3d4-0000-0000-0000-000000000015', 'a1b2c3d4-0000-0000-0000-000000000022');

-- ============================================================
-- 4. SICK REPORT — Klaus Wagner, heute
-- ============================================================
INSERT INTO sick_reports (id, employee_id, date, reason, created_at) VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'e1b2c3d4-0000-0000-0000-000000000015',
    current_date,
    'Grippe',
    now() - interval '2 hours'
  );

-- ============================================================
-- 5. TODAY'S ASSIGNMENTS (2026-05-04)
-- ============================================================

-- Rewe: Maria Kovac → COMPLETED (Frühdienst 06:15–08:20)
INSERT INTO assignments (id, property_id, employee_id, date, status, checked_in_at, completed_at, created_at) VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000022',
    'a1b2c3d4-0000-0000-0000-000000000011',
    current_date,
    'completed',
    (current_date + time '06:15')::timestamptz,
    (current_date + time '08:20')::timestamptz,
    now() - interval '5 hours'
  );

-- Bürogebäude: Ahmed Yilmaz → COMPLETED (08:05–11:50)
INSERT INTO assignments (id, property_id, employee_id, date, status, checked_in_at, completed_at, created_at) VALUES
  (
    'c1000000-0000-0000-0000-000000000002',
    'a1b2c3d4-0000-0000-0000-000000000020',
    'a1b2c3d4-0000-0000-0000-000000000012',
    current_date,
    'completed',
    (current_date + time '08:05')::timestamptz,
    (current_date + time '11:50')::timestamptz,
    now() - interval '5 hours'
  );

-- Kindergarten: Petra Huber → CHECKED_IN (seit 09:03, noch aktiv)
INSERT INTO assignments (id, property_id, employee_id, date, status, checked_in_at, completed_at, created_at) VALUES
  (
    'c1000000-0000-0000-0000-000000000003',
    'a1b2c3d4-0000-0000-0000-000000000024',
    'a1b2c3d4-0000-0000-0000-000000000013',
    current_date,
    'checked_in',
    (current_date + time '09:03')::timestamptz,
    NULL,
    now() - interval '5 hours'
  );

-- Praxis Dr. Hoffmann: Stefan Bauer → ASSIGNED (heute früh, noch offen)
INSERT INTO assignments (id, property_id, employee_id, date, status, checked_in_at, completed_at, created_at) VALUES
  (
    'c1000000-0000-0000-0000-000000000004',
    'a1b2c3d4-0000-0000-0000-000000000023',
    'a1b2c3d4-0000-0000-0000-000000000010',
    current_date,
    'assigned',
    NULL,
    NULL,
    now() - interval '5 hours'
  );

-- Kanzlei Dr. Stein: Klaus Wagner → ASSIGNED aber KRANK → roter Alert!
INSERT INTO assignments (id, property_id, employee_id, date, status, checked_in_at, completed_at, created_at) VALUES
  (
    'c1000000-0000-0000-0000-000000000005',
    'a1b2c3d4-0000-0000-0000-000000000026',
    'e1b2c3d4-0000-0000-0000-000000000015',
    current_date,
    'assigned',
    NULL,
    NULL,
    now() - interval '6 hours'
  );

-- ============================================================
-- 6. UPCOMING ASSIGNMENTS (nächste Tage)
-- ============================================================
INSERT INTO assignments (property_id, employee_id, date, status, created_at) VALUES
  -- Morgen
  ('a1b2c3d4-0000-0000-0000-000000000022', 'a1b2c3d4-0000-0000-0000-000000000011', current_date + 1, 'assigned', now()),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000012', current_date + 1, 'assigned', now()),
  ('a1b2c3d4-0000-0000-0000-000000000024', 'a1b2c3d4-0000-0000-0000-000000000013', current_date + 1, 'assigned', now()),
  ('a1b2c3d4-0000-0000-0000-000000000023', 'a1b2c3d4-0000-0000-0000-000000000010', current_date + 1, 'assigned', now()),
  -- Übermorgen
  ('a1b2c3d4-0000-0000-0000-000000000026', 'a1b2c3d4-0000-0000-0000-000000000013', current_date + 2, 'assigned', now()),
  ('a1b2c3d4-0000-0000-0000-000000000022', 'a1b2c3d4-0000-0000-0000-000000000014', current_date + 2, 'assigned', now()),
  ('a1b2c3d4-0000-0000-0000-000000000020', 'a1b2c3d4-0000-0000-0000-000000000010', current_date + 2, 'assigned', now());

-- ============================================================
-- 7. NOTIFICATION for owner — roter Alert Kanzlei
-- ============================================================
INSERT INTO notifications (employee_id, type, title, message, read, created_at)
SELECT
  'a1b2c3d4-0000-0000-0000-000000000011',  -- dummy employee_id (required column)
  'sick_alert',
  'Krank: Klaus Wagner',
  'Klaus Wagner ist krank gemeldet. Kanzlei Dr. Stein heute Abend (18:00–21:00) ohne Ersatz!',
  false,
  now() - interval '1 hour'
WHERE EXISTS (SELECT 1 FROM employees WHERE id = 'a1b2c3d4-0000-0000-0000-000000000011');
