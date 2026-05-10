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
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink-300 text-sm font-medium">Laden...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-ink-500 text-sm mb-5">{error || 'Kein Unternehmen gefunden'}</p>
          <button onClick={() => { setLoading(true); setError(''); onRefresh(); }} className="btn-primary">
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar active={activePage} onNavigate={onNavigate} ownerName={company.owner_name} contract={company.contract} />
      <main className="lg:ml-60 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
        {children({ company, refreshKey, onRefresh, onNavigate })}
      </main>
    </div>
  );
}
