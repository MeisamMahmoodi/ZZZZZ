import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Company } from '../../lib/types';

interface OwnerLayoutProps {
  children: (props: { company: Company; refreshKey: number; onRefresh: () => void }) => React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export function OwnerLayout({ children, activePage, onNavigate }: OwnerLayoutProps) {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('companies')
      .select('*')
      .or(`owner_id.eq.${user.id},owner_email.eq.${user.email}`)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCompany(data);
      });
  }, [user]);

  const onRefresh = () => setRefreshKey(k => k + 1);

  if (!company) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#64748B] text-sm">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar active={activePage} onNavigate={onNavigate} ownerName={company.owner_name} />
      <main className="lg:ml-60 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
        {children({ company, refreshKey, onRefresh })}
      </main>
    </div>
  );
}
