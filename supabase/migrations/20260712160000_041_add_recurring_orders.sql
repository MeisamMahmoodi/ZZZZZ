/*
  # Wiederkehrende Aufträge

  1. New Tables
    - `recurring_orders`
      - Speichert die Serien-Definition selbst (Objekt, Mitarbeiter,
        Wochentage, Zeitfenster, Zeitraum) — nicht nur die daraus
        erzeugten Einsätze. So lässt sich eine ganze Serie auf einen
        Blick verwalten und mit einem Klick löschen, statt einzelne
        Einsätze mühsam zu suchen.

  2. Changes
    - `assignments.recurring_order_id`: verknüpft einen generierten
      Einsatz optional mit der Serie, aus der er stammt. NULL bei
      einzeln angelegten Einsätzen (unverändertes Verhalten).

  3. Notes
    - Objekte selbst erzeugen ab sofort keine Einsätze mehr automatisch
      (das passierte bisher nur zufällig für den Anlegetag). Alle
      Einsätze — einzeln oder als Serie — entstehen jetzt ausschließlich
      im Einsätze-Bereich.
    - Serien haben eine feste Laufzeit (Owner wählt Start-/Enddatum beim
      Erstellen), kein Cron-Job nötig.

  4. Security
    - RLS aktiviert, gleiches company-scoped Muster wie bei properties.
*/

CREATE TABLE IF NOT EXISTS recurring_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  employee_ids uuid[] NOT NULL DEFAULT '{}',
  weekdays text[] NOT NULL DEFAULT '{}',
  time_from time,
  time_to time,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can read recurring orders"
  ON recurring_orders FOR SELECT
  TO authenticated
  USING (company_id = auth_user_company_id());

CREATE POLICY "Company owners can insert recurring orders"
  ON recurring_orders FOR INSERT
  TO authenticated
  WITH CHECK (company_id = auth_user_company_id());

CREATE POLICY "Company owners can delete recurring orders"
  ON recurring_orders FOR DELETE
  TO authenticated
  USING (company_id = auth_user_company_id());

CREATE INDEX IF NOT EXISTS idx_recurring_orders_company ON recurring_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_recurring_orders_property ON recurring_orders(property_id);

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS recurring_order_id uuid REFERENCES recurring_orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_recurring_order ON assignments(recurring_order_id) WHERE recurring_order_id IS NOT NULL;
