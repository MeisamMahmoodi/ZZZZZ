import { Check, Star } from 'lucide-react';

interface PricingProps {
  onContinue: () => void;
}

const plans = [
  {
    name: 'Starter',
    price: '249',
    capacity: 'bis 25 Mitarbeiter',
    payLink: 'https://checkout.revolut.com/pay/ca664746-9487-43fd-92d9-fd40e5b85441',
    recommended: false,
    features: [
      'Kern-Planung: Zugriff auf das Dashboard',
      'Einsatzplan: Ansicht heutiger Einsätze und Mitarbeiterzuweisung',
      'Objektverwaltung: Anlegen von Einsatzorten (Praxen, Kindergärten etc.)',
      'Live-Status: GPS-Check-in und Zeitstempel-Überwachung (ohne Export)',
    ],
  },
  {
    name: 'Business',
    price: '399',
    capacity: '26 – 49 Mitarbeiter',
    payLink: 'https://checkout.revolut.com/pay/9c765fba-ac0a-49f5-9657-1f8a35556bec',
    recommended: true,
    features: [
      'Alles aus Starter',
      'Krankheits-Management: „Ersatz finden"-Funktion bei Krankmeldungen',
      'Abrechnungs-Modul: Vollständige Verdienst- und Stundenübersicht je Mitarbeiter',
      'Kostenkontrolle: Überwachung der Gesamtkosten des laufenden Monats',
    ],
  },
  {
    name: 'Premium',
    price: '499',
    capacity: '50 – 99 Mitarbeiter',
    payLink: 'https://checkout.revolut.com/pay/48dfba15-279a-4535-95c4-b68808e34dbb',
    recommended: false,
    features: [
      'Alles aus Business',
      'Lohn-Konfiguration: Individuelle Stundensätze pro Mitarbeiter',
      'Erweiterte Mitarbeiterprofile: Kontaktdaten und Login-Status verwalten',
      'Full Support: Priorisierter Support bei 50+ Mitarbeitern',
    ],
  },
];

export function Pricing({ onContinue }: PricingProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="pt-10 pb-6 px-6 text-center">
        <img src="/meizoLogo.png" alt="meizo" className="h-12 w-auto mx-auto mb-6 bg-white rounded-xl px-3 py-1.5 shadow-sm" />
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
          Wählen Sie Ihr Paket
        </h1>
      </header>

      {/* Cards */}
      <main className="flex-1 px-4 sm:px-6 pb-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl flex flex-col transition-all duration-200 ${
                plan.recommended
                  ? 'bg-[#0F172A] text-white shadow-[0_20px_60px_-10px_rgba(15,23,42,0.35)] scale-[1.03] md:scale-105 z-10'
                  : 'bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md'
              }`}
            >
              {/* Recommended badge */}
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 bg-[#F59E0B] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                    <Star size={11} fill="white" />
                    Meistgewählt
                  </div>
                </div>
              )}

              <div className="p-7 pt-8 flex flex-col flex-1">
                {/* Plan name & capacity */}
                <div className="mb-6">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${plan.recommended ? 'text-[#94A3B8]' : 'text-[#94A3B8]'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-4xl font-bold tracking-tight ${plan.recommended ? 'text-white' : 'text-[#0F172A]'}`}>
                      {plan.price} €
                    </span>
                  </div>
                  <p className={`text-sm mt-1.5 font-medium ${plan.recommended ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                    {plan.capacity}
                  </p>
                </div>

                {/* Divider */}
                <div className={`h-px mb-6 ${plan.recommended ? 'bg-white/[0.08]' : 'bg-[#F1F5F9]'}`} />

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature) => {
                    const [bold, ...rest] = feature.split(':');
                    const hasColon = feature.includes(':');
                    return (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan.recommended ? 'bg-white/[0.12]' : 'bg-[#F0FDF4]'
                        }`}>
                          <Check size={11} className={plan.recommended ? 'text-[#86EFAC]' : 'text-[#16A34A]'} strokeWidth={2.5} />
                        </div>
                        <span className={`text-sm leading-snug ${plan.recommended ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                          {hasColon ? (
                            <>
                              <span className={`font-semibold ${plan.recommended ? 'text-white' : 'text-[#0F172A]'}`}>{bold}:</span>
                              {rest.join(':')}
                            </>
                          ) : feature}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* CTA */}
                <a
                  href={plan.payLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all duration-200 block ${
                    plan.recommended
                      ? 'bg-white text-[#0F172A] hover:bg-[#F1F5F9] shadow-sm'
                      : 'bg-[#0F172A] text-white hover:bg-[#1E293B]'
                  }`}
                >
                  Jetzt starten
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Already paid */}
        <div className="max-w-5xl mx-auto mt-10 text-center">
          <p className="text-sm text-[#94A3B8]">
            Sie haben bereits bezahlt?{' '}
            <button
              onClick={onContinue}
              className="text-[#0F172A] font-semibold underline underline-offset-2 hover:no-underline transition-all"
            >
              Zum Login
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
