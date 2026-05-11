import { X, Check, Lock, Zap, Star, Crown, ArrowRight } from 'lucide-react';

type Plan = 'Starter' | 'Business' | 'Premium';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: Plan;
  requiredPlan: Plan;
  featureName: string;
}

const planOrder: Plan[] = ['Starter', 'Business', 'Premium'];

const planDetails: Record<Plan, {
  icon: typeof Zap;
  price: string;
  color: string;
  bg: string;
  border: string;
  features: string[];
  payLink: string;
}> = {
  Starter: {
    icon: Zap,
    price: '249',
    color: 'text-[#3B82F6]',
    bg: 'bg-[#EFF6FF]',
    border: 'border-[#BFDBFE]',
    features: ['Dashboard & Übersicht', 'Mitarbeiterverwaltung', 'Objekte verwalten', 'Einsätze planen', 'Push-Benachrichtigungen'],
    payLink: 'https://checkout.revolut.com/pay/ca664746-9487-43fd-92d9-fd40e5b85441',
  },
  Business: {
    icon: Star,
    price: '399',
    color: 'text-[#F97316]',
    bg: 'bg-[#FFF7ED]',
    border: 'border-[#FED7AA]',
    features: ['Alles aus Starter', 'Abrechnung & Lohnübersicht', 'Zeitstempel & Check-in', 'Ersatz finden bei Krankheit', 'Kostenkontrolle'],
    payLink: 'https://checkout.revolut.com/pay/9c765fba-ac0a-49f5-9657-1f8a35556bec',
  },
  Premium: {
    icon: Crown,
    price: '499',
    color: 'text-[#16A34A]',
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#BBF7D0]',
    features: ['Alles aus Business', 'Individuelle Stundensätze', 'Erweiterte Mitarbeiterprofile', 'Prioritäts-Support', 'Bis zu 99 Mitarbeiter'],
    payLink: 'https://checkout.revolut.com/pay/48dfba15-279a-4535-95c4-b68808e34dbb',
  },
};

export function UpgradeModal({ open, onClose, currentPlan, requiredPlan, featureName }: UpgradeModalProps) {
  if (!open) return null;

  const required = planDetails[requiredPlan];
  const RequiredIcon = required.icon;
  const upgradePlans = planOrder.slice(planOrder.indexOf(currentPlan) + 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header */}
        <div className={`p-6 sm:p-7 ${required.bg} ${required.border} border-b`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-white/60 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center">
              <Lock size={22} className="text-ink-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-0.5">Funktion gesperrt</p>
              <p className="text-xl font-bold text-ink-900">{featureName}</p>
            </div>
          </div>

          <p className="text-sm text-ink-500 leading-relaxed">
            Diese Funktion ist ab dem <span className="font-semibold text-ink-700">{requiredPlan}</span>-Paket verfügbar.
            Du nutzt aktuell <span className="font-semibold text-ink-700">{currentPlan}</span>.
          </p>
        </div>

        {/* Upgrade options */}
        <div className="p-6 sm:p-7">
          <p className="text-sm font-semibold text-ink-700 mb-4">Upgrade auf:</p>

          <div className="space-y-3">
            {upgradePlans.map(planName => {
              const p = planDetails[planName];
              const PIcon = p.icon;
              return (
                <div key={planName} className={`rounded-2xl border p-4 ${p.bg} ${p.border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                        <PIcon size={18} className={p.color} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink-900">{planName}</p>
                        <p className="text-xs text-ink-400">€{p.price}/Monat</p>
                      </div>
                    </div>
                    <a
                      href={p.payLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-ink-900 text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-ink-700 transition-colors"
                    >
                      Upgrade <ArrowRight size={13} />
                    </a>
                  </div>
                  <div className="space-y-1.5">
                    {p.features.map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-white/80 flex items-center justify-center shrink-0">
                          <Check size={10} className={p.color} strokeWidth={3} />
                        </div>
                        <p className="text-xs text-ink-600">{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium text-ink-400 hover:text-ink-700 transition-colors">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

export type { Plan };
