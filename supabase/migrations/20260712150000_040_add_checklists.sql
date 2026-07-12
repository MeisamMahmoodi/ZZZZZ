/*
  # Objekttyp-Checklisten

  1. New Tables
    - `checklist_items`
      - Pro Firma und Objekttyp (office/school/supermarket/doctor/other)
        definierbare Checklisten-Punkte. Gelten für alle Objekte dieses Typs
        in der Firma (kein Aufwand pro einzelnem Objekt).
    - `checklist_completions`
      - Unveränderliches Protokoll: welche Punkte wurden bei welchem Einsatz
        abgehakt. Speichert den Text als Snapshot (item_label), damit
        spätere Änderungen an der Vorlage die Historie nicht verfälschen.

  2. Security
    - RLS aktiviert auf beiden Tabellen.
    - checklist_items: company-scoped lesen/schreiben (gleiches Muster wie
      bei properties — RLS unterscheidet hier nicht zwischen Owner- und
      Mitarbeiter-Rolle, konsistent mit dem Rest der App).
    - checklist_completions: lesen für alle Firmenmitglieder (wie
      assignments), schreiben nur durch den Mitarbeiter, dem der Einsatz
      zugewiesen ist.
*/

CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  property_type text NOT NULL CHECK (property_type IN ('office', 'school', 'supermarket', 'doctor', 'other')),
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can read checklist items"
  ON checklist_items FOR SELECT
  TO authenticated
  USING (company_id = auth_user_company_id());

CREATE POLICY "Company owners can insert checklist items"
  ON checklist_items FOR INSERT
  TO authenticated
  WITH CHECK (company_id = auth_user_company_id());

CREATE POLICY "Company owners can update checklist items"
  ON checklist_items FOR UPDATE
  TO authenticated
  USING (company_id = auth_user_company_id())
  WITH CHECK (company_id = auth_user_company_id());

CREATE POLICY "Company owners can delete checklist items"
  ON checklist_items FOR DELETE
  TO authenticated
  USING (company_id = auth_user_company_id());

CREATE INDEX IF NOT EXISTS idx_checklist_items_company_type ON checklist_items(company_id, property_type);

CREATE TABLE IF NOT EXISTS checklist_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  item_label text NOT NULL,
  checked_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can read checklist completions"
  ON checklist_completions FOR SELECT
  TO authenticated
  USING (
    assignment_id IN (
      SELECT id FROM assignments WHERE property_id IN (
        SELECT id FROM properties WHERE company_id = auth_user_company_id()
      )
    )
  );

CREATE POLICY "Assigned employee can insert checklist completions"
  ON checklist_completions FOR INSERT
  TO authenticated
  WITH CHECK (
    assignment_id IN (
      SELECT id FROM assignments WHERE employee_id IN (
        SELECT id FROM employees WHERE user_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_checklist_completions_assignment ON checklist_completions(assignment_id);
