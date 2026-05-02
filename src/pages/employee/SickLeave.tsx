import { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';

interface SickLeaveProps {
  onBack: () => void;
  onComplete: () => void;
}

export function SickLeave({ onBack, onComplete }: SickLeaveProps) {
  const { user } = useAuth();
  const { t, rtl } = useLang();
  const [day, setDay] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasAssignment, setHasAssignment] = useState(false);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const getSelectedDate = () => {
    if (day === 'today') return today;
    if (day === 'tomorrow') return tomorrow;
    if (customDate) return new Date(customDate + 'T00:00:00');
    return today;
  };

  const dateStr = getSelectedDate().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    // Check if employee has assignments on the selected date
    supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data: emp }) => {
        if (!emp) return;
        supabase
          .from('assignments')
          .select('id')
          .eq('employee_id', emp.id)
          .eq('date', dateStr)
          .eq('status', 'assigned')
          .limit(1)
          .then(({ data }) => {
            setHasAssignment((data?.length || 0) > 0);
          });
      });
  }, [user, dateStr]);

  const handleSubmit = async () => {
    if (hasAssignment && !showConfirm) {
      setShowConfirm(true);
      return;
    }
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
      <div className={`min-h-screen bg-white flex items-center justify-center px-6 ${rtl ? 'text-right' : 'text-left'}`} dir={rtl ? 'rtl' : 'ltr'}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-[#22C55E]">&#10003;</span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] mb-2">{t('reported')}</h2>
          <p className="text-[#64748B] text-sm mb-6 whitespace-pre-line">
            {t('bossInformedGetWell')}
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-2.5 rounded-lg text-sm font-medium bg-[#22C55E] text-white hover:bg-green-600 transition-colors"
          >
            {t('backToOverview')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white px-6 py-8 max-w-md mx-auto ${rtl ? 'text-right' : 'text-left'}`} dir={rtl ? 'rtl' : 'ltr'}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-6"
      >
        <ArrowLeft size={16} /> {t('back')}
      </button>

      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">{t('sickReport')}</h1>

      <div className="space-y-3 mb-6">
        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="day"
            checked={day === 'today'}
            onChange={() => setDay('today')}
            className="accent-[#22C55E]"
          />
          <div>
            <p className="text-sm font-medium text-[#0F172A]">{t('today')}</p>
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
            <p className="text-sm font-medium text-[#0F172A]">{t('tomorrow')}</p>
            <p className="text-xs text-[#64748B]">
              {tomorrow.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="day"
            checked={day === 'custom'}
            onChange={() => setDay('custom')}
            className="accent-[#22C55E]"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0F172A]">{t('otherDate')}</p>
          </div>
        </label>

        {day === 'custom' && (
          <div className="pl-8">
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              min={today.toISOString().split('T')[0]}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 focus:border-[#EF4444]"
            />
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-[#0F172A] mb-1">{t('reasonOptional')}</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 focus:border-[#EF4444] resize-none"
        />
      </div>

      {/* Confirmation dialog when employee has assignment */}
      {showConfirm && hasAssignment && (
        <div className="bg-[#FEF2F2] border-2 border-[#FECACA] rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-[#EF4444] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-base font-bold text-[#0F172A]">{t('sickConfirmTitle')}</p>
              <p className="text-sm text-[#64748B] mt-1">{t('sickConfirmMessage')}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-[#64748B] hover:bg-gray-200 transition-colors"
            >
              {t('sickConfirmNo')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-[#EF4444] text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {t('sickConfirmYes')}
            </button>
          </div>
        </div>
      )}

      {!showConfirm && (
        <button
          onClick={handleSubmit}
          disabled={loading || (day === 'custom' && !customDate)}
          className="w-full py-3 rounded-xl text-base font-semibold bg-[#EF4444] text-white hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {loading ? t('sending') : t('sendSickReport')}
        </button>
      )}
    </div>
  );
}
