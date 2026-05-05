import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import {
  Building2, Users, ShieldCheck, LogOut, ChevronDown, ChevronUp,
  Plus, X, Eye, EyeOff, AlertTriangle, Calendar, CreditCard,
  CheckCircle, Clock, Trash2, RefreshCw,
} from 'lucide-react';

interface CompanyRow {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  contract: string;
  contract_start: string | null;
  contract_end: string | null;
  paid_until: string | null;
  last_payment_at: string | null;
  deleted_at: string | null;
  created_at: string;
  employee_count: number;
  employees: { first_name: string; last_name: string; status: string; email: string | null }[];
}

const CONTRACT_COLORS: Record<string, string> = {
  Basic: 'bg-slate-100 text-slate-600',
  Pro: 'bg-blue-100 text-blue-700',
  Enterprise: 'bg-amber-100 text-amber-700',
};

function paymentStatus(company: CompanyRow): { label: string; color: string; icon: typeof CheckCircle } {
  if (!company.paid_until) return { label: 'Nicht hinterlegt', color: 'text-slate-400', icon: Clock };
  const until = new Date(company.paid_until);
  const daysLeft = Math.ceil((until.getTime() - Date.now()) / 86400000);
  if (daysLeft < 0) return { label: `Überfällig (${Math.abs(daysLeft)}d)`, color: 'text-red-600', icon: AlertTriangle };
  if (daysLeft <= 7) return { label: `Fällig in ${daysLeft}d`, color: 'text-amber-600', icon: AlertTriangle };
  return { label: `Bezahlt bis ${until.toLocaleDateString('de-DE')}`, color: 'text-emerald-600', icon: CheckCircle };
}

function daysUntilPurge(deletedAt: string): number {
  const d = new Date(deletedAt);
  d.setDate(d.getDate() + 30);
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
}

// ── Create Owner Modal ───────────────────────────────────────────────────────
interface CreateOwnerModalProps {
  onClose: () => void;
  onCreated: () => void;
  accessToken: string | undefined;
}

function CreateOwnerModal({ onClose, onCreated, accessToken }: CreateOwnerModalProps) {
  const [form, setForm] = useState({
    owner_name: '',
    company_name: '',
    email: '',
    password: '',
    contract: 'Basic',
    contract_start: new Date().toISOString().split('T')[0],
    paid_until: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.owner_name || !form.company_name || !form.email || !form.password) {
      setError('Alle Pflichtfelder ausfüllen.');
      return;
    }
    if (form.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-owner-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            owner_name: form.owner_name,
            company_name: form.company_name,
            email: form.email,
            password: form.password,
            contract: form.contract,
            contract_start: form.contract_start ? new Date(form.contract_start).toISOString() : undefined,
            paid_until: form.paid_until ? new Date(form.paid_until).toISOString() : undefined,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Fehler beim Erstellen'); setLoading(false); return; }
      onCreated();
      onClose();
    } catch {
      setError('Netzwerkfehler');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Neues Unternehmen anlegen</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Name des Chefs *</label>
              <input value={form.owner_name} onChange={set('owner_name')} className="input-field text-sm" placeholder="Max Mustermann" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Firmenname *</label>
              <input value={form.company_name} onChange={set('company_name')} className="input-field text-sm" placeholder="Reinigungs GmbH" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">E-Mail (Login) *</label>
            <input type="email" value={form.email} onChange={set('email')} className="input-field text-sm" placeholder="chef@firma.de" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Passwort (temporär) *</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                className="input-field text-sm !pr-10"
                placeholder="Mindestens 8 Zeichen"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Der Chef wird beim ersten Login aufgefordert, ein eigenes Passwort zu setzen.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Vertrag</label>
              <select value={form.contract} onChange={set('contract')} className="input-field text-sm">
                <option>Basic</option>
                <option>Pro</option>
                <option>Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Vertragsbeginn</label>
              <input type="date" value={form.contract_start} onChange={set('contract_start')} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Bezahlt bis</label>
              <input type="date" value={form.paid_until} onChange={set('paid_until')} className="input-field text-sm" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50">
              {loading ? 'Wird erstellt…' : 'Konto erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ─────────────────────────────────────────────────────
interface DeleteModalProps {
  company: CompanyRow;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteModal({ company, onClose, onDeleted }: DeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const isDeleted = !!company.deleted_at;

  const handleDelete = async () => {
    setLoading(true);
    await supabase.from('companies').update({ deleted_at: new Date().toISOString() }).eq('id', company.id);
    setLoading(false);
    onDeleted();
    onClose();
  };

  const handleRestore = async () => {
    setLoading(true);
    await supabase.from('companies').update({ deleted_at: null }).eq('id', company.id);
    setLoading(false);
    onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 space-y-4">
          {isDeleted ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
                <RefreshCw size={22} className="text-amber-600" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-900">Löschung rückgängig?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  <strong>{company.name}</strong> wird in {daysUntilPurge(company.deleted_at!)} Tagen endgültig gelöscht. Jetzt wiederherstellen?
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Abbrechen</button>
                <button onClick={handleRestore} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {loading ? '…' : 'Wiederherstellen'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-900">Unternehmen löschen?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  <strong>{company.name}</strong> und alle Daten werden nach <strong>30 Tagen</strong> endgültig gelöscht. Bis dahin bleibt alles erhalten und kann wiederhergestellt werden.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Abbrechen</button>
                <button onClick={handleDelete} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
                  {loading ? '…' : 'Löschen starten'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Billing Modal ────────────────────────────────────────────────────────────
interface BillingModalProps {
  company: CompanyRow;
  onClose: () => void;
  onSaved: () => void;
}

function BillingModal({ company, onClose, onSaved }: BillingModalProps) {
  const [form, setForm] = useState({
    contract: company.contract,
    contract_start: company.contract_start ? company.contract_start.split('T')[0] : '',
    contract_end: company.contract_end ? company.contract_end.split('T')[0] : '',
    paid_until: company.paid_until ? company.paid_until.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    const { error: err } = await supabase.from('companies').update({
      contract: form.contract,
      contract_start: form.contract_start ? new Date(form.contract_start).toISOString() : null,
      contract_end: form.contract_end ? new Date(form.contract_end).toISOString() : null,
      paid_until: form.paid_until ? new Date(form.paid_until).toISOString() : null,
      last_payment_at: form.paid_until ? new Date().toISOString() : company.last_payment_at,
    }).eq('id', company.id);
    setLoading(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Vertrag & Zahlung</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm font-semibold text-slate-700">{company.name}</p>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Vertragsplan</label>
            <select value={form.contract} onChange={set('contract')} className="input-field text-sm">
              <option>Basic</option>
              <option>Pro</option>
              <option>Enterprise</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Vertragsbeginn</label>
              <input type="date" value={form.contract_start} onChange={set('contract_start')} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Vertragsende</label>
              <input type="date" value={form.contract_end} onChange={set('contract_end')} className="input-field text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Bezahlt bis</label>
            <input type="date" value={form.paid_until} onChange={set('paid_until')} className="input-field text-sm" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Abbrechen</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50">
              {loading ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { signOut, session } = useAuth();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyRow | null>(null);
  const [billingTarget, setBillingTarget] = useState<CompanyRow | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'deleted' | 'overdue'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const { data: companiesData } = await supabase
      .from('companies')
      .select('id, name, owner_name, owner_email, contract, contract_start, contract_end, paid_until, last_payment_at, deleted_at, created_at')
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
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = companies.filter(c => {
    if (filter === 'active') return !c.deleted_at;
    if (filter === 'deleted') return !!c.deleted_at;
    if (filter === 'overdue') return !c.deleted_at && !!c.paid_until && new Date(c.paid_until) < new Date();
    return true;
  });

  const activeCount = companies.filter(c => !c.deleted_at).length;
  const totalEmployees = companies.filter(c => !c.deleted_at).reduce((s, c) => s + c.employee_count, 0);
  const overdueCount = companies.filter(c => !c.deleted_at && !!c.paid_until && new Date(c.paid_until) < new Date()).length;

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/meizoLogo.png" alt="Meizo" className="h-8 w-auto" />
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Admin</span>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">Plattform-Übersicht</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <Plus size={15} />
            Neues Unternehmen
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <LogOut size={15} />
            Abmelden
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Building2, label: 'Aktive Firmen', value: activeCount, color: 'text-blue-600 bg-blue-50' },
            { icon: Users, label: 'Mitarbeiter', value: totalEmployees, color: 'text-emerald-600 bg-emerald-50' },
            { icon: ShieldCheck, label: 'Aktive Verträge', value: activeCount, color: 'text-slate-600 bg-slate-100' },
            { icon: AlertTriangle, label: 'Überfällig', value: overdueCount, color: overdueCount > 0 ? 'text-red-600 bg-red-50' : 'text-slate-400 bg-slate-50' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{loading ? '–' : value}</p>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'deleted', 'overdue'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {{ all: 'Alle', active: 'Aktiv', deleted: 'Gelöscht', overdue: 'Überfällig' }[f]}
            </button>
          ))}
        </div>

        {/* Company list */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">{filtered.length} Unternehmen</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-12">Keine Einträge</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((company) => {
                const isOpen = expanded === company.id;
                const payment = paymentStatus(company);
                const PayIcon = payment.icon;
                const isDeleted = !!company.deleted_at;

                return (
                  <li key={company.id} className={isDeleted ? 'opacity-60' : ''}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : company.id)}
                      className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDeleted ? 'bg-red-50' : 'bg-slate-100'}`}>
                            <Building2 size={16} className={isDeleted ? 'text-red-400' : 'text-slate-500'} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-slate-900 text-sm truncate">{company.name}</p>
                              {isDeleted && (
                                <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-md flex-shrink-0">
                                  Löschen in {daysUntilPurge(company.deleted_at!)}d
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {company.owner_name} &middot; {company.owner_email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${CONTRACT_COLORS[company.contract] ?? CONTRACT_COLORS.Basic}`}>
                            {company.contract}
                          </span>
                          <span className={`hidden sm:flex items-center gap-1 text-xs font-medium ${payment.color}`}>
                            <PayIcon size={13} />
                            {payment.label}
                          </span>
                          {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-5 bg-slate-50 border-t border-slate-100 space-y-4">
                        {/* Contract details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                          <div className="bg-white rounded-xl p-3 border border-slate-100">
                            <p className="text-xs text-slate-400 font-medium mb-0.5 flex items-center gap-1"><Calendar size={11} /> Vertragsbeginn</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {company.contract_start ? new Date(company.contract_start).toLocaleDateString('de-DE') : '—'}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-slate-100">
                            <p className="text-xs text-slate-400 font-medium mb-0.5 flex items-center gap-1"><Calendar size={11} /> Vertragsende</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {company.contract_end ? new Date(company.contract_end).toLocaleDateString('de-DE') : 'Laufend'}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-slate-100">
                            <p className="text-xs text-slate-400 font-medium mb-0.5 flex items-center gap-1"><CreditCard size={11} /> Bezahlt bis</p>
                            <p className={`text-sm font-semibold ${payment.color}`}>
                              {company.paid_until ? new Date(company.paid_until).toLocaleDateString('de-DE') : '—'}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-slate-100">
                            <p className="text-xs text-slate-400 font-medium mb-0.5 flex items-center gap-1"><Clock size={11} /> Letzte Zahlung</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {company.last_payment_at ? new Date(company.last_payment_at).toLocaleDateString('de-DE') : '—'}
                            </p>
                          </div>
                        </div>

                        {/* Employees */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                            Mitarbeiter ({company.employee_count})
                          </p>
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
                                    <p className="text-sm font-medium text-slate-800 truncate">{emp.first_name} {emp.last_name}</p>
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
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setBillingTarget(company)}
                            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            <CreditCard size={13} />
                            Vertrag &amp; Zahlung
                          </button>
                          <button
                            onClick={() => setDeleteTarget(company)}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${
                              isDeleted
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {isDeleted
                              ? <><RefreshCw size={13} /> Wiederherstellen</>
                              : <><Trash2 size={13} /> Löschen</>
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateOwnerModal
          accessToken={session?.access_token}
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          company={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={load}
        />
      )}
      {billingTarget && (
        <BillingModal
          company={billingTarget}
          onClose={() => setBillingTarget(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
