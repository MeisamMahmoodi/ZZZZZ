// Zentrale Preislogik.
//
// Vorher gab es drei feste Pläne (Starter/Business/Premium) mit
// Mitarbeiter-Obergrenzen (10/30/99) und unterschiedlichem Funktionsumfang.
// Das hatte zwei Probleme: eine Preis-Kante (11. Mitarbeiter verdoppelte
// die Rechnung von 99€ auf 199€) und einen Preis weit über dem Marktniveau.
//
// Grundgebühr am 14.07. von 29€ auf 19€ gesenkt, nachdem echte (nicht
// blog-geschätzte) Preise von Blink und Crewmeister direkt von deren
// eigenen Preisseiten geprüft wurden:
// - Blink: kein reiner Pro-Kopf-Preis, sondern 149€ (Standard) bzw. 399€
//   (Professional) Paketpreis + 4,90€/User. Bei 10 MA: 198€, bei 20 MA: 247€.
// - Crewmeister: beworbene "ab 1,50-3€/Nutzer" gelten laut eigenem FAQ nur
//   bei 50 Mitarbeitern: DATEV-Export (+0,60€/Nutzer) und Schichtplanung
//   (+2€/Nutzer) sind separate Zusatzmodule, nicht im Grundpreis enthalten.
//   Ein fair vergleichbares Paket (Zeiterfassung+DATEV+Planung) liegt eher
//   bei ~5,60€+/Nutzer, bei kleineren Teams vermutlich höher.
// meizo bündelt GPS-Check-in, automatische Ersatzsuche, Checklisten, DATEV-
// Export und Planung im Grundpreis — bei jeder Teamgröße günstiger als
// Blink und mit mehr Funktionen als das vergleichbare Crewmeister-Paket.
//
// Eine Grundgebühr plus linearer Preis pro Mitarbeiter, alle Funktionen für
// jede Firma freigeschaltet. Muss mit den Stripe Price-IDs in
// create-checkout-session/index.ts übereinstimmen.

export const BASE_FEE_EUR = 19;
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
