/*
  # Stripe Subscription-Item-ID auf companies

  1. Problem
    - Umstellung von drei festen Plänen (Starter/Business/Premium) auf
      Grundgebühr + Preis pro Mitarbeiter. Die Mitarbeiter-Position der
      Subscription muss bei jeder Änderung der Mitarbeiterzahl aktualisiert
      werden (mehr/weniger Mitarbeiter = andere Menge auf dieser Position).
    - Stripe erlaubt das Aktualisieren der Menge nur über die
      Subscription-ITEM-ID der betroffenen Position, nicht über die
      Subscription-ID allein — die fehlte bisher komplett.

  2. Changes
    - `companies.stripe_subscription_item_id`: ID der Pro-Mitarbeiter-Position
      innerhalb der Subscription, gesetzt beim ersten erfolgreichen Checkout.
      Wird von der Mitarbeiterzahl-Sync-Funktion genutzt.
*/

ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_subscription_item_id text;
