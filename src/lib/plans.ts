// Zentrale Preislogik.
//
// Vorher gab es drei feste Pläne (Starter/Business/Premium) mit
// Mitarbeiter-Obergrenzen (10/30/99) und unterschiedlichem Funktionsumfang.
// Das hatte zwei Probleme: eine Preis-Kante (11. Mitarbeiter verdoppelte
// die Rechnung von 99€ auf 199€) und einen Preis weit über dem Marktniveau
// vergleichbarer Anbieter (Pland ~29€, Blink ~3€/Mitarbeiter, Crewmeister
// ~5€/Mitarbeiter bei 20 Mitarbeitern — meizo lag bei 199€ für dieselbe
// Teamgröße).
//
// Jetzt: eine Grundgebühr plus linearer Preis pro Mitarbeiter, alle
// Funktionen für jede Firma freigeschaltet. Muss mit den Stripe Price-IDs
// in create-checkout-session/index.ts übereinstimmen.

export const BASE_FEE_EUR = 29;
export const PER_EMPLOYEE_EUR = 4;

// Oberhalb dieser Mitarbeiterzahl gibt's keinen automatischen Preis mehr,
// sondern ein individuelles Angebot statt Self-Checkout.
export const ENTERPRISE_THRESHOLD = 60;

export function calculateMonthlyPrice(employeeCount: number): number {
  const count = Math.max(1, employeeCount);
  return BASE_FEE_EUR + count * PER_EMPLOYEE_EUR;
}

export function isEnterpriseRange(employeeCount: number): boolean {
  return employeeCount > ENTERPRISE_THRESHOLD;
}

export function formatMonthlyPrice(employeeCount: number): string {
  return `${calculateMonthlyPrice(employeeCount)}€/Monat`;
}
