/*
  # Stripe Customer-/Subscription-ID auf companies

  1. Problem
    - Der stripe-webhook kannte bisher nur company_id über die Metadata der
      Checkout Session (checkout.session.completed). Folge-Events wie
      invoice.payment_succeeded (Verlängerung) oder
      customer.subscription.deleted (Kündigung) tragen aber keine
      company_id in ihrer Metadata, sondern nur eine Stripe-Subscription-ID.
      Ohne eine gespeicherte Zuordnung konnte der Webhook diese Events also
      gar keiner Firma zuordnen — Verlängerungen verlängerten paid_until
      nicht, Kündigungen sperrten den Zugriff nicht.

  2. Changes
    - `companies.stripe_customer_id`: Stripe Customer-ID, gesetzt beim
      ersten erfolgreichen Checkout.
    - `companies.stripe_subscription_id`: Stripe Subscription-ID, gesetzt
      beim ersten erfolgreichen Checkout. Wird für Folge-Events als
      Nachschlage-Schlüssel genutzt.
*/

ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
CREATE INDEX IF NOT EXISTS idx_companies_stripe_subscription ON companies(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
