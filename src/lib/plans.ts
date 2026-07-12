// Zentrale Quelle für Plan-Namen, Preise und Mitarbeiter-Limits.
//
// Vorher waren die Preise an 3 Stellen dupliziert (AdminDashboard.tsx,
// UpgradeModal.tsx, PaywallModal.tsx) und liefen auseinander: das
// Admin-Dashboard rechnete mit 249/399/499€, während Kunden tatsächlich
// 99/199/299€ zahlen (siehe Stripe Price-IDs in
// supabase/functions/create-checkout-session/index.ts). Die
// Umsatzschätzung im Admin-Bereich zeigte dadurch fast das Vierfache
// des echten Umsatzes. Ab jetzt importieren alle Stellen von hier.

export type Plan = 'Starter' | 'Business' | 'Premium';

export const PLAN_ORDER: Plan[] = ['Starter', 'Business', 'Premium'];

// Monatspreis in EUR — muss mit den Stripe Price-IDs in
// create-checkout-session übereinstimmen.
export const PLAN_PRICES: Record<Plan, number> = {
  Starter: 99,
  Business: 199,
  Premium: 299,
};

export const PLAN_EMPLOYEE_LIMITS: Record<Plan, number> = {
  Starter: 10,
  Business: 30,
  Premium: 99,
};

export function planAtLeast(plan: Plan, required: Plan): boolean {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(required);
}
