import { useState } from 'react';
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Einstellungen</h1>

      <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] max-w-lg">
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
    </div>
  );
}
