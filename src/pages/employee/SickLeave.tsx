import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface SickLeaveProps {
  onBack: () => void;
  onComplete: () => void;
}

export function SickLeave({ onBack, onComplete }: SickLeaveProps) {
  const { user } = useAuth();
  const [day, setDay] = useState<'today' | 'tomorrow'>('today');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const selectedDate = day === 'today' ? today : tomorrow;
  const dateStr = selectedDate.toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    const { data: emp } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!emp) { setLoading(false); return; }

    await supabase.from('sick_reports').insert({
      employee_id: emp.id,
      date: dateStr,
      reason,
    });

    await supabase
      .from('employees')
      .update({ status: 'sick' })
      .eq('id', emp.id);

    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-[#22C55E]">✓</span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] mb-2">Gemeldet</h2>
          <p className="text-[#64748B] text-sm mb-6">
            Dein Chef wurde informiert.<br />Gute Besserung!
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-2.5 rounded-lg text-sm font-medium bg-[#22C55E] text-white hover:bg-green-600 transition-colors"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8 max-w-md mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Zurück
      </button>

      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Krankmeldung</h1>

      <div className="space-y-4 mb-6">
        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="day"
            checked={day === 'today'}
            onChange={() => setDay('today')}
            className="accent-[#22C55E]"
          />
          <div>
            <p className="text-sm font-medium text-[#0F172A]">Heute</p>
            <p className="text-xs text-[#64748B]">
              {today.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="day"
            checked={day === 'tomorrow'}
            onChange={() => setDay('tomorrow')}
            className="accent-[#22C55E]"
          />
          <div>
            <p className="text-sm font-medium text-[#0F172A]">Morgen</p>
            <p className="text-xs text-[#64748B]">
              {tomorrow.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </label>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-[#0F172A] mb-1">Grund (optional)</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 focus:border-[#EF4444] resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-xl text-base font-semibold bg-[#EF4444] text-white hover:bg-red-600 transition-colors disabled:opacity-50"
      >
        {loading ? 'Wird gesendet...' : 'Krankmeldung absenden'}
      </button>
    </div>
  );
}
