import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Company } from '../../lib/types';

interface OwnerLayoutProps {
  children: (props: { company: Company; refreshKey: number; onRefresh: () => void; onNavigate: (page: string) => void }) => React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export function OwnerLayout({ children, activePage, onNavigate }: OwnerLayoutProps) {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('companies')
          .select('*')
          .or(`owner_id.eq.${user.id},owner_email.eq.${user.email}`)
          .maybeSingle();
        if (err) {
          setError('Fehler beim Laden der Unternehmensdaten');
        } else if (data) {
          setCompany(data);
        } else {
          setError('Kein Unternehmen gefunden');
        }
      } catch {
        setError('Netzwerkfehler');
      }
      setLoading(false);
    })();
  }, [user]);

  const onRefresh = () => setRefreshKey(k => k + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#64748B] text-sm">Laden...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-[#64748B] text-sm mb-4">{error || 'Kein Unternehmen gefunden'}</p>
          <button onClick={() => { setLoading(true); setError(''); onRefresh(); }} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#0F172A] text-white hover:bg-slate-800 transition-colors">
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar active={activePage} onNavigate={onNavigate} ownerName={company.owner_name} />
      <main className="lg:ml-60 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
        {children({ company, refreshKey, onRefresh, onNavigate })}
      </main>
    </div>
  );
}
