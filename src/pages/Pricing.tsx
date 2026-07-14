import { useState } from 'react';
import { Check } from 'lucide-react';
import { BASE_FEE_EUR, PER_EMPLOYEE_EUR, calculateMonthlyPrice, isEnterpriseRange, ENTERPRISE_THRESHOLD } from '../lib/plans';

interface PricingProps {
  onContinue: () => void;
}

const FEATURES = [
  'Kern-Planung: Dashboard, Einsatzplan, Objektverwaltung',
  'Live-Status: GPS-Check-in und Zeitstempel-Überwachung mit Foto-Nachweis',
  'Krankheits-Management inkl. Smart-Ersatz-Dispatch',
  'Abrechnungs-Modul: automatische Verdienst- und Stundenübersicht',
  'DATEV-Export: fertiger CSV-Export für den Steuerberater',
  'Individuelle Stundensätze pro Mitarbeiter',
  'Mehrsprachige Mitarbeiter-App (8 Sprachen)',
];

export function Pricing({ onContinue }: PricingProps) {
  const [employeeCount, setEmployeeCount] = useState(15);
  const enterprise = isEnterpriseRange(employeeCount);
  const price = calculateMonthlyPrice(employeeCount);

  const mailSubject = encodeURIComponent('Meizo Anfrage');
  const mailBody = encodeURIComponent(
    `Hallo,\n\nich interessiere mich für Meizo (ca. ${employeeCount} Mitarbeiter).\n\nViele Grüße`
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="pt-10 pb-6 px-6 text-center">
        <img src="/meizoLogoL.jpeg" alt="meizo" className="h-12 w-auto mx-auto mb-6 bg-white rounded-xl px-3 py-1.5 shadow-sm" />
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
          Ein Preis. Alle Funktionen.
        </h1>
        <p className="text-[#64748B] mt-3 max-w-md mx-auto">
          Keine Pakete, keine versteckten Grenzen. {BASE_FEE_EUR}€ Grundgebühr + {PER_EMPLOYEE_EUR}€ pro Mitarbeiter im Monat.
        </p>
      </header>

      {/* Calculator */}
      <main className="flex-1 px-4 sm:px-6 pb-16">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-7 sm:p-9">
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-2">Ihr monatlicher Preis</p>
              {enterprise ? (
                <p className="text-3xl font-bold text-[#0F172A]">Auf Anfrage</p>
              ) : (
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-5xl font-bold tracking-tight text-[#0F172A]">{price} €</span>
                  <span className="text-[#94A3B8] font-medium">/ Monat</span>
                </div>
              )}
            </div>

            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="employees" className="text-sm font-semibold text-[#0F172A]">Mitarbeiteranzahl</label>
              <span className="text-sm font-bold text-[#0F172A]">{employeeCount}</span>
            </div>
            <input
              id="employees"
              type="range"
              min={1}
              max={80}
              value={employeeCount}
              onChange={e => setEmployeeCount(Number(e.target.value))}
              className="w-full accent-[#0F172A]"
            />
            <div className="flex justify-between text-xs text-[#94A3B8] mt-1 mb-8">
              <span>1</span>
              <span>{ENTERPRISE_THRESHOLD}+ (individuelles Angebot)</span>
            </div>

            <div className="h-px bg-[#F1F5F9] mb-6" />

            <ul className="space-y-3 mb-8">
              {FEATURES.map((feature) => {
                const [bold, ...rest] = feature.split(':');
                const hasColon = feature.includes(':');
                return (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#F0FDF4]">
                      <Check size={11} className="text-[#16A34A]" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm leading-snug text-[#475569]">
                      {hasColon ? (
                        <>
                          <span className="font-semibold text-[#0F172A]">{bold}:</span>
                          {rest.join(':')}
                        </>
                      ) : feature}
                    </span>
                  </li>
                );
              })}
            </ul>

            <a
              href={`mailto:meisam@meizo.de?subject=${mailSubject}&body=${mailBody}`}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all duration-200 block bg-[#0F172A] text-white hover:bg-[#1E293B]"
            >
              {enterprise ? 'Angebot anfragen' : 'Jetzt anfragen'}
            </a>
          </div>

          {/* Already paid */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#94A3B8]">
              Sie haben bereits ein Konto?{' '}
              <button
                onClick={onContinue}
                className="text-[#0F172A] font-semibold underline underline-offset-2 hover:no-underline transition-all"
              >
                Zum Login
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
