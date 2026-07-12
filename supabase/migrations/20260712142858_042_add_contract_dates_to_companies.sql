/*
  # Vertragsdaten für Unternehmen nachrüsten

  1. Changes
    - `companies.contract_start`: Vertragsbeginn (vom Admin-Formular
      "Beginn" bereits erwartet, aber nie migriert — verursachte einen
      500-Fehler beim Anlegen eines neuen Unternehmens im Admin-Bereich,
      weil die Edge Function `create-owner-user` diese Spalte beim
      Insert befüllt hat, obwohl sie nicht existierte).
    - `companies.contract_end`: Vertragsende, ebenfalls vom Admin-Bereich
      (Vertrag bearbeiten) erwartet, aber nie migriert.

  2. Notes
    - Angewendet direkt über die Supabase-MCP-Verbindung; diese Datei
      hält den lokalen Migrationsstand synchron.
*/

ALTER TABLE companies ADD COLUMN IF NOT EXISTS contract_start timestamptz;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contract_end timestamptz;
