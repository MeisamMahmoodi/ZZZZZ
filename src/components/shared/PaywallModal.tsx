import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Props {
  companyId: string;
}

const PLANS = [
  { name: 'Starter', price: '99€/Monat' },
  { name: 'Business', price: '199€/Monat' },
  { name: 'Premium', price: '299€/Monat' },
] as const;

export function PaywallModal({ companyId }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-100 px-8 py-10 max-w-md w-full mx-4 text-center space-y-6">
        <div>
          <img src="/meizoLogoL.jpeg" alt="meizo" className="h-10 w-auto mx-auto mb-5" />
          <h2 className="text-xl font-bold text-slate-900">Deine Testphase ist abgelaufen.</h2>
          <p className="text-slate-500 text-sm mt-2">Wähle dein Paket um weiterzumachen.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {PLANS.map(({ name, price }) => (
            <button
              key={name}
              onClick={() => handlePlan(name)}
              disabled={!!loading}
              className="flex flex-col items-center gap-2 py-5 px-2 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === name ? (
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="font-bold text-slate-900 text-sm">{name}</span>
              )}
              <span className="text-xs text-slate-500 font-medium">{price}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
