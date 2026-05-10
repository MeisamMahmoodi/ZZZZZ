import { Check, Star, Lock, X } from 'lucide-react';
import type { Plan } from '../../lib/plans';
import { PLAN_LINKS, PLAN_PRICES, PLAN_CAPACITY, PLAN_UPGRADE } from '../../lib/plans';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: Plan;
  reason?: string;
}

const PLAN_FEATURES: Record<Plan, string[]> = {
  Starter: [
    'Dashboard & Kern-Planung',
    'Einsatzplan: Mitarbeiterzuweisung',
    'Objektverwaltung',
    'GPS-Check-in & Basis-Zeitstempel',
  ],
  Business: [
    'Alles aus Starter',
    'Krankheits-Management & Ersatz finden',
    'Vollständiges Abrechnungs-Modul',
    'Zeitstempel mit Fotos & GPS-Nachweis',
    'DATEV/Lohn-Export',
    'Kostenkontrolle',
  ],
  Premium: [
    'Alles aus Business',
    'Individuelle Stundensätze je Mitarbeiter',
    'Erweiterte Mitarbeiterprofile',
    'App-Zugänge für Mitarbeiter',
    'Full Support bei 50+ Mitarbeitern',
  ],
};

const plans: Plan[] = ['Starter', 'Business', 'Premium'];

export function UpgradeModal({ open, onClose, currentPlan, reason }: UpgradeModalProps) {
  if (!open) return null;

  const nextPlan = PLAN_UPGRADE[currentPlan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Lock size={15} className="text-amber-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Upgrade erforderlich</span>
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] leading-tight">
                {reason || 'Diese Funktion ist in Ihrem Paket nicht enthalten'}
              </h2>
              <p className="text-sm text-[#64748B] mt-1">
                Aktuelles Paket: <span className="font-semibold text-[#0F172A]">{currentPlan}</span>
                {nextPlan && <> · Empfehlung: <span className="font-semibold text-[#0F172A]">{nextPlan}</span></>}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F1F5F9] transition-colors shrink-0 ml-4">
              <X size={18} className="text-[#94A3B8]" />
            </button>
          </div>

          <div className="h-px bg-[#F1F5F9] my-6" />

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = plan === currentPlan;
              const isNext = plan === nextPlan;
              const isLocked = plans.indexOf(plan) < plans.indexOf(currentPlan);

              return (
                <div
                  key={plan}
                  className={`relative rounded-2xl border-2 p-5 flex flex-col transition-all ${
                    isNext
                      ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-lg'
                      : isCurrent
                      ? 'border-[#22C55E] bg-[#F0FDF4]'
                      : isLocked
                      ? 'border-[#E2E8F0] bg-[#F8FAFC] opacity-50'
                      : 'border-[#E2E8F0] bg-white'
                  }`}
                >
                  {isNext && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1 bg-[#F59E0B] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        <Star size={9} fill="white" />
                        Empfohlen
                      </div>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="bg-[#22C55E] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        Ihr Paket
                      </div>
                    </div>
                  )}

                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isNext ? 'text-[#94A3B8]' : 'text-[#94A3B8]'}`}>
                    {plan}
                  </p>
                  <p className={`text-2xl font-bold mb-0.5 ${isNext ? 'text-white' : 'text-[#0F172A]'}`}>
                    {PLAN_PRICES[plan]} €
                  </p>
                  <p className={`text-xs mb-4 ${isNext ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                    {PLAN_CAPACITY[plan]}
                  </p>

                  <ul className="space-y-2 flex-1 mb-5">
                    {PLAN_FEATURES[plan].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check size={11} className={`mt-0.5 shrink-0 ${isNext ? 'text-[#86EFAC]' : 'text-[#22C55E]'}`} strokeWidth={2.5} />
                        <span className={`text-xs leading-snug ${isNext ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {!isCurrent && !isLocked && (
                    <a
                      href={PLAN_LINKS[plan]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-2.5 rounded-xl text-xs font-bold text-center transition-all block ${
                        isNext
                          ? 'bg-white text-[#0F172A] hover:bg-[#F1F5F9]'
                          : 'bg-[#0F172A] text-white hover:bg-[#1E293B]'
                      }`}
                    >
                      Auf {plan} wechseln
                    </a>
                  )}
                  {isCurrent && (
                    <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-[#22C55E] text-white opacity-70">
                      Aktuell aktiv
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-[#94A3B8] text-center mt-5">
            Nach der Zahlung bitte uns kurz kontaktieren — wir schalten Ihr Paket sofort frei.
          </p>
        </div>
      </div>
    </div>
  );
}
