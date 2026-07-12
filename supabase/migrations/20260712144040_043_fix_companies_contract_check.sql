/*
  # Contract-Check-Constraint korrigieren

  1. Problem
    - `companies_contract_check` erlaubte nur 'Basic' | 'Pro' | 'Enterprise'.
    - Das Admin-Formular (AdminDashboard.tsx) verwendet aber durchgängig
      'Starter' | 'Business' | 'Premium' (Auswahl-Optionen, Preistabelle,
      Umsatz-Auswertung). Jeder Versuch, ein neues Unternehmen anzulegen,
      verletzte den Constraint -> 500-Fehler in der Edge Function
      `create-owner-user` (Insert in `companies` schlug fehl, Rollback des
      bereits angelegten Auth-Users griff, daher kein sichtbarer Datenrest).

  2. Changes
    - Alte Constraint entfernt, bestehende Werte migriert
      (Basic->Starter, Pro->Business, Enterprise->Premium),
      neue Constraint auf die tatsächlich genutzten Plan-Namen gesetzt.
    - Spalten-Default auf 'Starter' angepasst (statt 'Basic').
*/

ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_contract_check;
ALTER TABLE companies ALTER COLUMN contract SET DEFAULT 'Starter';
UPDATE companies SET contract = 'Starter' WHERE contract = 'Basic';
UPDATE companies SET contract = 'Business' WHERE contract = 'Pro';
UPDATE companies SET contract = 'Premium' WHERE contract = 'Enterprise';
ALTER TABLE companies ADD CONSTRAINT companies_contract_check CHECK (contract = ANY (ARRAY['Starter'::text, 'Business'::text, 'Premium'::text]));
