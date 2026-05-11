import { useState } from 'react';
import { Lock, Eye, EyeOff, Package, Check, Zap, Star, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/shared/Toast';
import type { Company } from '../../lib/types';

interface SettingsProps {
  company: Company;
  onRefresh: () => void;
}

export function Settings({ company, onRefresh }: SettingsProps) {
  const [name, setName] = useState(company.name);
  const [ownerName, setOwnerName] = useState(company.owner_name);
  const [email, setEmail] = useState(company.owner_email);
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const { addToast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('companies')
      .update({ name, owner_name: ownerName, owner_email: email })
      .eq('id', company.id);

    setSaving(false);
    if (error) {
      addToast('Fehler beim Speichern', 'error');
    } else {
      addToast('Einstellungen gespeichert');
      onRefresh();
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      addToast('Passwort muss mindestens 6 Zeichen haben', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Passwörter stimmen nicht überein', 'error');
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      addToast('Fehler beim Ändern des Passworts', 'error');
    } else {
      setNewPassword('');
      setConfirmPassword('');
      addToast('Passwort geändert');
    }
  };

  const plan = (company.contract || 'Starter') as 'Starter' | 'Business' | 'Premium';

  const planConfig = {
    Starter: {
      icon: Zap,
      color: 'text-[#3B82F6]',
      bg: 'bg-[#EFF6FF]',
      border: 'border-[#BFDBFE]',
      badge: 'bg-[#DBEAFE] text-[#1D4ED8]',
      features: ['Bis zu 25 Mitarbeiter', 'Objekte & Einsätze', 'Krankmeldungen', 'Push-Benachrichtigungen'],
    },
    Business: {
      icon: Star,
      color: 'text-[#F97316]',
      bg: 'bg-[#FFF7ED]',
      border: 'border-[#FED7AA]',
      badge: 'bg-[#FFEDD5] text-[#C2410C]',
      features: ['Bis zu 49 Mitarbeiter', 'Alles aus Starter', 'Abrechnung', 'Zeitstempel', 'Ersatz finden'],
    },
    Premium: {
      icon: Crown,
      color: 'text-[#16A34A]',
      bg: 'bg-[#F0FDF4]',
      border: 'border-[#BBF7D0]',
      badge: 'bg-[#DCFCE7] text-[#15803D]',
      features: ['Bis zu 99 Mitarbeiter', 'Alles aus Business', 'Mitarbeiter-Logins', 'Stundenlohn', 'Einchecken mit Foto & GPS'],
    },
  };

  const cfg = planConfig[plan];
  const PlanIcon = cfg.icon;

  return (
    <div>
      <h1 className="text-2xl sm:text-[28px] font-bold text-ink-900 tracking-tight mb-8">Einstellungen</h1>

      <div className="space-y-6 max-w-lg">
        {/* Current Plan */}
        <div className={`rounded-2xl border p-6 sm:p-7 ${cfg.bg} ${cfg.border}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm`}>
                <PlanIcon size={22} className={cfg.color} />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-0.5 flex items-center gap-1.5">
                  <Package size={11} /> Aktuelles Paket
                </p>
                <p className="text-xl font-bold text-ink-900">{plan}</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>Aktiv</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2">
            {cfg.features.map(f => (
              <div key={f} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full bg-white/80 flex items-center justify-center shrink-0`}>
                  <Check size={10} className={cfg.color} strokeWidth={3} />
                </div>
                <p className="text-sm text-ink-700">{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Company Settings */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-base font-semibold text-ink-900 mb-5">Firmendaten</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">Firmenname</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">Inhaber Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary mt-6"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>

        {/* Password Change */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-base font-semibold text-ink-900 mb-5 flex items-center gap-2.5">
            <Lock size={18} className="text-ink-500" /> Passwort ändern
          </h2>
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                placeholder="Neues Passwort"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input-field !pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-700 transition-colors"
              >
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div>
              <input
                type={showPasswords ? 'text' : 'password'}
                placeholder="Passwort bestätigen"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !newPassword || !confirmPassword}
            className="btn-secondary mt-6"
          >
            {savingPassword ? 'Wird geändert...' : 'Passwort ändern'}
          </button>
        </div>
      </div>
    </div>
  );
}
