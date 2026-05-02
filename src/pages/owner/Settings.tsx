import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
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

  const [currentPassword, setCurrentPassword] = useState('');
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
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Passwort geändert');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Einstellungen</h1>

      <div className="space-y-6 max-w-lg">
        {/* Company Settings */}
        <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">Firmendaten</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Firmenname</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Inhaber Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 px-4 py-2 rounded-lg text-sm font-medium bg-[#22C55E] text-white hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
            <Lock size={18} /> Passwort ändern
          </h2>
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                placeholder="Neues Passwort"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
              />
            </div>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                placeholder="Passwort bestätigen"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={() => setShowPasswords(!showPasswords)}
                className="accent-[#22C55E]"
              />
              <span className="text-sm text-[#64748B]">Passwörter anzeigen</span>
            </label>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !newPassword || !confirmPassword}
            className="mt-6 px-4 py-2 rounded-lg text-sm font-medium bg-[#0F172A] text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {savingPassword ? 'Wird geändert...' : 'Passwort ändern'}
          </button>
        </div>
      </div>
    </div>
  );
}
