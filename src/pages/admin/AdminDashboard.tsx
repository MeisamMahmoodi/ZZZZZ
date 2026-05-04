import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Building2, Users, ShieldCheck, LogOut, ChevronDown, ChevronUp } from 'lucide-react';

interface CompanyRow {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  contract: string;
  created_at: string;
  employee_count: number;
  employees: { first_name: string; last_name: string; status: string; email: string | null }[];
}

const CONTRACT_COLORS: Record<string, string> = {
  Basic: 'bg-slate-100 text-slate-600',
  Pro: 'bg-blue-100 text-blue-700',
  Enterprise: 'bg-amber-100 text-amber-700',
};

export function AdminDashboard() {
  const { signOut } = useAuth();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name, owner_name, owner_email, contract, created_at')
        .order('created_at', { ascending: false });

      if (!companiesData) { setLoading(false); return; }

      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, company_id, first_name, last_name, status, email');

      const rows: CompanyRow[] = companiesData.map((c) => {
        const emps = (employeesData ?? []).filter((e) => e.company_id === c.id);
        return { ...c, employee_count: emps.length, employees: emps };
      });

      setCompanies(rows);
      setLoading(false);
    })();
  }, []);

  const totalEmployees = companies.reduce((s, c) => s + c.employee_count, 0);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/meizoLogo.png" alt="Meizo" className="h-8 w-auto" />
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Admin</span>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">Plattform-Übersicht</h1>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <LogOut size={15} />
          Abmelden
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Building2, label: 'Unternehmen', value: companies.length, color: 'text-blue-600 bg-blue-50' },
            { icon: Users, label: 'Mitarbeiter gesamt', value: totalEmployees, color: 'text-emerald-600 bg-emerald-50' },
            { icon: ShieldCheck, label: 'Aktive Verträge', value: companies.length, color: 'text-amber-600 bg-amber-50' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{loading ? '–' : value}</p>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Company list */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">Alle Unternehmen</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : companies.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-12">Keine Unternehmen gefunden</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {companies.map((company) => {
                const isOpen = expanded === company.id;
                return (
                  <li key={company.id}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : company.id)}
                      className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Building2 size={16} className="text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate">{company.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              Chef: {company.owner_name} &middot; {company.owner_email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${CONTRACT_COLORS[company.contract] ?? CONTRACT_COLORS.Basic}`}>
                            {company.contract}
                          </span>
                          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                            {company.employee_count} {company.employee_count === 1 ? 'Mitarbeiter' : 'Mitarbeiter'}
                          </span>
                          {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-4 bg-slate-50 border-t border-slate-100">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-4 mb-3">Mitarbeiter</p>
                        {company.employees.length === 0 ? (
                          <p className="text-sm text-slate-400">Keine Mitarbeiter eingetragen</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {company.employees.map((emp) => (
                              <div key={`${emp.first_name}-${emp.last_name}`} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-100">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                  {emp.first_name[0]}{emp.last_name[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-800 truncate">
                                    {emp.first_name} {emp.last_name}
                                  </p>
                                  <p className="text-xs text-slate-400 truncate">{emp.email ?? '—'}</p>
                                </div>
                                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${
                                  emp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                                }`}>
                                  {emp.status === 'active' ? 'Aktiv' : 'Krank'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-400 mt-3">
                          Erstellt: {new Date(company.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
