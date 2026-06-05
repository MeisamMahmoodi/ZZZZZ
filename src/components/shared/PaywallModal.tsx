import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  companyId: string;
}

const PLANS = [
  {
    name: 'Starter',
    price: '99€/Monat',
    features: [
      'Bis zu 10 Mitarbeiter',
      'Krankmeldungen',
      'Einsätze',
      'GPS Check-in',
      'Push-Benachrichtigungen',
    ],
  },
  {
    name: 'Business',
    price: '199€/Monat',
    features: [
      'Bis zu 30 Mitarbeiter',
      'Alles aus Starter',
      'Abrechnung',
      'Zeitstempel',
      'Ersatz finden',
    ],
  },
  {
    name: 'Premium',
    price: '299€/Monat',
    features: [
      'Bis zu 99 Mitarbeiter',
      'Alles aus Business',
      'Stundenlohn',
      'Erweiterte Mitarbeiterprofile',
    ],
  },
] as const;

export function PaywallModal({ companyId }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handlePlan = async (plan: string) => {
    setLoading(plan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ company_id: companyId, plan }),
        }
      );
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch {
      // silently reset on network error
    }
    setLoading(null);
  };

  const toggle = (name: string) => setExpanded(prev => prev === name ? null : name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-100 px-6 py-8 max-w-sm w-full mx-4">
        <div className="text-center mb-6">
          <img src="/meizoLogoL.jpeg" alt="meizo" className="h-10 w-auto mx-auto mb-5" />
          <h2 className="text-xl font-bold text-slate-900">Deine Testphase ist abgelaufen.</h2>
          <p className="text-slate-500 text-sm mt-2">Wähle dein Paket um weiterzumachen.</p>
        </div>

        <div className="space-y-2">
          {PLANS.map(({ name, price, features }) => {
            const isOpen = expanded === name;
            const isLoading = loading === name;
            return (
              <div
                key={name}
                className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                  isOpen ? 'border-slate-900' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => toggle(name)}
                  disabled={!!loading}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{name}</span>
                    <span className="ml-2 text-xs text-slate-400 font-medium">{price}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4">
                    <ul className="space-y-2 mb-4">
                      {features.map(f => (
                        <li key={f} className="flex items-center gap-2.5">
                          <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Check size={10} className="text-green-600" strokeWidth={3} />
                          </span>
                          <span className="text-sm text-slate-600">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handlePlan(name)}
                      disabled={!!loading}
                      className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Jetzt starten'
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
