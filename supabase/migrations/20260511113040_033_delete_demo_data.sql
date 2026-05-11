/*
  # Delete all demo data

  1. Changes
    - Remove all demo company data (Blitz Reinigung GmbH)
    - Delete associated employees, properties, assignments, sick reports
    - Clean up all demo notifications
    - Keep all database structure and RLS policies intact

  2. Important Notes
    - This migration removes ONLY data, no schema changes
    - All tables remain with RLS enabled
    - Foreign key cascades handle child record deletion
*/

-- Get the company ID for demo company
WITH demo_company AS (
  SELECT id FROM companies
  WHERE name = 'Blitz Reinigung GmbH'
    OR owner_name = 'Thomas Maier'
  LIMIT 1
)
-- Delete associated data
DELETE FROM companies
WHERE id IN (SELECT id FROM demo_company);

-- Clean up any orphaned notifications from deleted employees
DELETE FROM notifications WHERE employee_id NOT IN (SELECT id FROM employees);

-- Clean up any orphaned sick reports from deleted employees
DELETE FROM sick_reports WHERE employee_id NOT IN (SELECT id FROM employees);

-- Clean up any orphaned assignments from deleted employees
DELETE FROM assignments WHERE employee_id NOT IN (SELECT id FROM employees);

-- Clean up any orphaned assignments from deleted properties
DELETE FROM assignments WHERE property_id NOT IN (SELECT id FROM properties);

-- Clean up any orphaned employee-property mappings
DELETE FROM employee_properties WHERE employee_id NOT IN (SELECT id FROM employees);
DELETE FROM employee_properties WHERE property_id NOT IN (SELECT id FROM properties);
