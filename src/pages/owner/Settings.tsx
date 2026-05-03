import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
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

  return (
    <div>
      <h1 className="text-2xl sm:text-[28px] font-bold text-ink-900 tracking-tight mb-8">Einstellungen</h1>

      <div className="space-y-6 max-w-lg">
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
                className="input-field pr-10"
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
