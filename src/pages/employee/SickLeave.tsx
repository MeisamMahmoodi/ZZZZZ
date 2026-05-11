import { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useLang } from '../../hooks/useLang';
import { langLocale } from '../../lib/i18n';

interface SickLeaveProps {
  onBack: () => void;
  onComplete: () => void;
}

export function SickLeave({ onBack, onComplete }: SickLeaveProps) {
  const { user } = useAuth();
  const { lang, t, rtl } = useLang();
  const locale = langLocale[lang];
  const [day, setDay] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');
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
  const minEndDate = (() => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    if (hasEndDate && endDate && endDate < minEndDate) {
      setEndDate(minEndDate);
    }
  }, [dateStr]);

  useEffect(() => {
    if (!user) return;
    setHasAssignment(false);
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

    try {
      const { data: emp } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!emp) { setLoading(false); return; }

      await supabase.from('sick_reports').delete().eq('employee_id', emp.id).eq('date', dateStr);

      const { error: sickErr } = await supabase.from('sick_reports').insert({
        employee_id: emp.id,
        date: dateStr,
        date_to: hasEndDate && endDate ? endDate : null,
        reason,
      });

      if (sickErr) { setLoading(false); return; }

      await supabase
        .from('employees')
        .update({ status: 'sick' })
        .eq('id', emp.id);

      setLoading(false);
      setSubmitted(true);
    } catch {
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateIso: string) => {
    const d = new Date(dateIso + 'T00:00:00');
    return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' });
  };

  if (submitted) {
    return (
      <div className={`min-h-screen bg-surface-50 flex items-center justify-center px-6 ${rtl ? 'text-right' : 'text-left'}`} dir={rtl ? 'rtl' : 'ltr'}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl text-brand-500">&#10003;</span>
          </div>
          <h2 className="text-xl font-bold text-ink-900 mb-2">{t('reported')}</h2>
          <p className="text-ink-500 text-sm mb-8 whitespace-pre-line leading-relaxed">
            {t('bossInformedGetWell')}
          </p>
          <button onClick={onComplete} className="btn-primary px-6">
            {t('backToOverview')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-surface-50 px-6 py-8 max-w-md mx-auto ${rtl ? 'text-right' : 'text-left'}`} dir={rtl ? 'rtl' : 'ltr'}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 transition-colors mb-8 font-medium"
      >
        <ArrowLeft size={16} /> {t('back')}
      </button>

      <h1 className="text-2xl font-bold text-ink-900 mb-8 tracking-tight">{t('sickReport')}</h1>

      <div className="space-y-3 mb-6">
        <label className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${day === 'today' ? 'border-brand-500 bg-brand-50/50' : 'border-surface-200 hover:bg-surface-50'}`}>
          <input
            type="radio"
            name="day"
            checked={day === 'today'}
            onChange={() => setDay('today')}
            className="accent-brand-500"
          />
          <div>
            <p className="text-sm font-semibold text-ink-900">{t('today')}</p>
            <p className="text-xs text-ink-300 mt-0.5">
              {today.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </label>

        <label className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${day === 'tomorrow' ? 'border-brand-500 bg-brand-50/50' : 'border-surface-200 hover:bg-surface-50'}`}>
          <input
            type="radio"
            name="day"
            checked={day === 'tomorrow'}
            onChange={() => setDay('tomorrow')}
            className="accent-brand-500"
          />
          <div>
            <p className="text-sm font-semibold text-ink-900">{t('tomorrow')}</p>
            <p className="text-xs text-ink-300 mt-0.5">
              {tomorrow.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </label>

        <label className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${day === 'custom' ? 'border-brand-500 bg-brand-50/50' : 'border-surface-200 hover:bg-surface-50'}`}>
          <input
            type="radio"
            name="day"
            checked={day === 'custom'}
            onChange={() => setDay('custom')}
            className="accent-brand-500"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-900">{t('otherDate')}</p>
          </div>
        </label>

        {day === 'custom' && (
          <div className="pl-8 animate-fade-in">
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              min={today.toISOString().split('T')[0]}
              className="input-field"
            />
          </div>
        )}
      </div>

      {/* Multi-day end date */}
      <div className="mb-8">
        {!hasEndDate ? (
          <button
            type="button"
            onClick={() => { setHasEndDate(true); setEndDate(minEndDate); }}
            className="flex items-center gap-2 text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors py-2"
          >
            <Plus size={16} /> {t('addEndDate')}
          </button>
        ) : (
          <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink-900">{t('endDate')}</p>
              <button
                type="button"
                onClick={() => { setHasEndDate(false); setEndDate(''); }}
                className="p-1 rounded-lg hover:bg-surface-200 transition-colors text-ink-300 hover:text-ink-700"
              >
                <X size={14} />
              </button>
            </div>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={minEndDate}
              className="input-field"
            />
            {endDate && (
              <p className="text-xs text-ink-400 mt-2">
                {t('sickReportedFrom')} {formatDateDisplay(dateStr)} {t('sickUntil')} {formatDateDisplay(endDate)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-ink-900 mb-1.5">{t('reasonOptional')}</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          className="input-field resize-none"
        />
      </div>

      {showConfirm && hasAssignment && (
        <div className="bg-danger-50 border border-danger-200/60 rounded-2xl p-5 mb-5 animate-scale-in">
          <div className="flex items-start gap-3.5">
            <AlertTriangle size={22} className="text-danger-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-base font-bold text-ink-900">{t('sickConfirmTitle')}</p>
              <p className="text-sm text-ink-500 mt-1 leading-relaxed">{t('sickConfirmMessage')}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-surface-100 text-ink-500 hover:bg-surface-200 transition-colors"
            >
              {t('sickConfirmNo')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-danger-500 text-white hover:bg-danger-600 transition-colors disabled:opacity-50"
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
          className="w-full py-3.5 rounded-2xl text-base font-semibold bg-danger-500 text-white hover:bg-danger-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('sending') : t('sendSickReport')}
        </button>
      )}
    </div>
  );
}
