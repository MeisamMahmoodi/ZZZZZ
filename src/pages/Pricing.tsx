import { Check, Star, Lock, Info } from 'lucide-react';

interface PricingProps {
  onContinue: () => void;
}

interface Feature {
  text: string;
  highlight?: string;
}

interface Plan {
  name: string;
  price: string;
  capacity: string;
  subline: string;
  payLink: string;
  recommended: boolean;
  ctaLabel: string;
  features: Feature[];
}

const plans: Plan[] = [
  {
    name: 'Starter',
    price: '249',
    capacity: 'bis 25 Mitarbeiter',
    subline: 'Ideal für den Einstieg',
    payLink: 'https://checkout.revolut.com/pay/ca664746-9487-43fd-92d9-fd40e5b85441',
    recommended: false,
    ctaLabel: 'Jetzt starten',
    features: [
      { text: 'Kern-Planung: Zugriff auf das Dashboard' },
      { text: 'Einsatzplan: Basis-Einsicht heutiger Einsätze und Mitarbeiterzuweisung' },
      { text: 'Objektverwaltung: Anlegen von Einsatzorten (Praxen, Kindergärten etc.)' },
      { text: 'Live-Status: GPS-Check-in und Zeitstempel-Überwachung' },
    ],
  },
  {
    name: 'Business',
    price: '399',
    capacity: '26 – 49 Mitarbeiter',
    subline: 'Am meisten gewählt von wachsenden Betrieben',
    payLink: 'https://checkout.revolut.com/pay/9c765fba-ac0a-49f5-9657-1f8a35556bec',
    recommended: true,
    ctaLabel: 'Gemeinsam einrichten & Zeit sparen',
    features: [
      { text: 'Alles aus Starter' },
      { text: 'Krankheits-Management: „Ersatz finden"-Funktion bei Krankmeldungen', highlight: 'Spart bis zu 5 Stunden Telefonzeit pro Woche' },
      { text: 'Abrechnungs-Modul: Vollständige Verdienst- und Stundenübersicht je Mitarbeiter' },
      { text: 'Inklusive DATEV/Lohn-Export: Spart Zeit beim Steuerberater' },
      { text: 'Kostenkontrolle: Überwachung der Gesamtkosten des laufenden Monats' },
    ],
  },
  {
    name: 'Premium',
    price: '499',
    capacity: '50 – 99 Mitarbeiter',
    subline: 'Für professionelle Reinigungsbetriebe',
    payLink: 'https://checkout.revolut.com/pay/48dfba15-279a-4535-95c4-b68808e34dbb',
    recommended: false,
    ctaLabel: 'Gemeinsam einrichten & Zeit sparen',
    features: [
      { text: 'Alles aus Business' },
      { text: 'Lohn-Konfiguration: Individuelle Stundensätze pro Mitarbeiter' },
      { text: 'Erweiterte Mitarbeiterprofile: Kontaktdaten und Login-Status verwalten' },
      { text: 'Full Support: Priorisierter Support bei 50+ Mitarbeitern' },
    ],
  },
];

function PaymentBadges({ dark }: { dark?: boolean }) {
  const base = dark ? 'bg-white/[0.1] text-[#94A3B8]' : 'bg-[#F1F5F9] text-[#64748B]';
  const methods = ['Visa', 'Mastercard', 'PayPal', 'Lastschrift'];
  return (
    <div className="flex items-center justify-center gap-1.5 mt-4 flex-wrap">
      <Lock size={10} className={dark ? 'text-[#64748B]' : 'text-[#94A3B8]'} />
      {methods.map(m => (
        <span key={m} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${base}`}>
          {m}
        </span>
      ))}
    </div>
  );
}

export function Pricing({ onContinue }: PricingProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="pt-10 pb-8 px-6 text-center">
        <img src="/meizoLogo.png" alt="meizo" className="h-12 w-auto mx-auto mb-8 bg-white rounded-xl px-3 py-1.5 shadow-sm" />
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight leading-tight max-w-2xl mx-auto">
          Wählen Sie Ihren Weg zu einer<br className="hidden sm:block" /> stressfreien Verwaltung
        </h1>
        <p className="text-[#64748B] mt-4 text-base max-w-lg mx-auto leading-relaxed">
          In weniger als 10 Minuten einsatzbereit –<br className="hidden sm:block" />
          stoppen Sie das Chaos ab morgen früh.
        </p>
      </header>

      {/* Cards */}
      <main className="flex-1 px-4 sm:px-6 pb-14">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 items-start pt-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl flex flex-col transition-all duration-200 ${
                plan.recommended
                  ? 'bg-[#0F172A] text-white shadow-[0_24px_64px_-12px_rgba(15,23,42,0.4)] scale-[1.03] md:scale-105 z-10'
                  : 'bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md'
              }`}
            >
              {/* Meistgewählt badge */}
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 bg-[#F59E0B] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                    <Star size={11} fill="white" />
                    Meistgewählt
                  </div>
                </div>
              )}

              <div className="p-7 pt-9 flex flex-col flex-1">
                {/* Name */}
                <p className="text-xs font-bold uppercase tracking-widest mb-3 text-[#94A3B8]">
                  {plan.name}
                </p>

                {/* Price */}
                <div className="mb-1">
                  <span className={`text-4xl font-bold tracking-tight ${plan.recommended ? 'text-white' : 'text-[#0F172A]'}`}>
                    {plan.price} €
                  </span>
                </div>

                {/* Capacity */}
                <p className={`text-sm font-medium mb-2 ${plan.recommended ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  {plan.capacity}
                </p>

                {/* Subline */}
                <p className={`text-xs leading-snug mb-5 ${plan.recommended ? 'text-[#F59E0B] font-semibold' : 'text-[#94A3B8]'}`}>
                  {plan.subline}
                </p>

                {/* Divider */}
                <div className={`h-px mb-5 ${plan.recommended ? 'bg-white/[0.08]' : 'bg-[#F1F5F9]'}`} />

                {/* Features */}
                <ul className="space-y-3.5 flex-1 mb-7">
                  {plan.features.map((feature) => {
                    const colonIdx = feature.text.indexOf(':');
                    const hasColon = colonIdx !== -1;
                    const bold = hasColon ? feature.text.slice(0, colonIdx) : '';
                    const rest = hasColon ? feature.text.slice(colonIdx + 1) : feature.text;

                    return (
                      <li key={feature.text} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan.recommended ? 'bg-white/[0.12]' : 'bg-[#F0FDF4]'
                        }`}>
                          <Check size={11} className={plan.recommended ? 'text-[#86EFAC]' : 'text-[#16A34A]'} strokeWidth={2.5} />
                        </div>
                        <div>
                          <span className={`text-sm leading-snug ${plan.recommended ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                            {hasColon ? (
                              <>
                                <span className={`font-semibold ${plan.recommended ? 'text-white' : 'text-[#0F172A]'}`}>{bold}:</span>
                                {rest}
                              </>
                            ) : rest}
                          </span>
                          {feature.highlight && (
                            <div className={`flex items-center gap-1 mt-1 text-[11px] font-semibold ${plan.recommended ? 'text-[#86EFAC]' : 'text-[#16A34A]'}`}>
                              <Info size={10} />
                              {feature.highlight}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* CTA */}
                <a
                  href={plan.payLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all duration-200 block leading-tight ${
                    plan.recommended
                      ? 'bg-white text-[#0F172A] hover:bg-[#F1F5F9] shadow-sm'
                      : 'bg-[#0F172A] text-white hover:bg-[#1E293B]'
                  }`}
                >
                  {plan.ctaLabel}
                </a>

                <PaymentBadges dark={plan.recommended} />
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
