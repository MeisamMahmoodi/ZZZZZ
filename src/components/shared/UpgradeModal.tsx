import { useState } from 'react';
import { X, Check, Lock, Zap, Star, Crown, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Plan = 'Starter' | 'Business' | 'Premium';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: Plan;
  requiredPlan: Plan;
  featureName: string;
  companyId?: string;
}

const planOrder: Plan[] = ['Starter', 'Business', 'Premium'];

const planDetails: Record<Plan, {
  icon: typeof Zap;
  price: string;
  color: string;
  bg: string;
  border: string;
  features: string[];
}> = {
  Starter: {
    icon: Zap,
    price: '99',
    color: 'text-[#3B82F6]',
    bg: 'bg-[#EFF6FF]',
    border: 'border-[#BFDBFE]',
    features: ['Dashboard & Übersicht', 'Mitarbeiterverwaltung', 'Objekte verwalten', 'Einsätze planen', 'Push-Benachrichtigungen'],
  },
  Business: {
    icon: Star,
    price: '199',
    color: 'text-[#F97316]',
    bg: 'bg-[#FFF7ED]',
    border: 'border-[#FED7AA]',
    features: ['Alles aus Starter', 'Abrechnung & Lohnübersicht', 'Zeitstempel & Check-in', 'Ersatz finden bei Krankheit', 'Kostenkontrolle'],
  },
  Premium: {
    icon: Crown,
    price: '299',
    color: 'text-[#16A34A]',
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#BBF7D0]',
    features: ['Alles aus Business', 'Individuelle Stundensätze', 'Erweiterte Mitarbeiterprofile', 'Prioritäts-Support', 'Bis zu 99 Mitarbeiter'],
  },
};

async function resolveCompanyId(propCompanyId?: string): Promise<string | null> {
  if (propCompanyId) return propCompanyId;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle();
  return data?.id ?? null;
}

export function UpgradeModal({ open, onClose, currentPlan, requiredPlan, featureName, companyId }: UpgradeModalProps) {
  const [loading, setLoading] = useState<Plan | null>(null);

  if (!open) return null;

  const required = planDetails[requiredPlan];
  const RequiredIcon = required.icon;
  const upgradePlans = planOrder.slice(planOrder.indexOf(currentPlan) + 1);

  const handleUpgrade = async (planName: Plan) => {
    setLoading(planName);
    try {
      const [{ data: { session } }, resolvedId] = await Promise.all([
        supabase.auth.getSession(),
        resolveCompanyId(companyId),
      ]);
      if (!resolvedId) return;
      const token = session?.access_token ?? '';
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ company_id: resolvedId, plan: planName }),
        }
      );
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch {
      // silently reset on network error
    }
    setLoading(null);
  };

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
              const isLoading = loading === planName;
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
                    <button
                      onClick={() => handleUpgrade(planName)}
                      disabled={!!loading}
                      className="flex items-center gap-1.5 bg-ink-900 text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-ink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>Upgrade <ArrowRight size={13} /></>
                      )}
                    </button>
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
