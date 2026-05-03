import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, MoreVertical, Phone, Pencil, Trash2, Mail, Shield, ShieldOff, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/shared/Avatar';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import type { Employee, Property, EmployeeProperty, Company } from '../../lib/types';

interface EmployeesProps {
  company: Company;
  refreshKey: number;
  onRefresh: () => void;
}

export function Employees({ company, refreshKey, onRefresh }: EmployeesProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [employeeProperties, setEmployeeProperties] = useState<EmployeeProperty[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'sick'>('all');
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<Employee | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [loginEnabled, setLoginEnabled] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPropertyIds, setNewPropertyIds] = useState<string[]>([]);

  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPropertyIds, setEditPropertyIds] = useState<string[]>([]);

  useEffect(() => { loadData(); }, [company.id, refreshKey]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  async function loadData() {
    try {
      const [empRes, propRes, epRes] = await Promise.all([
        supabase.from('employees').select('*').eq('company_id', company.id).order('last_name'),
        supabase.from('properties').select('*').eq('company_id', company.id),
        supabase.from('employee_properties').select('*'),
      ]);
      setEmployees(empRes.data || []);
      setProperties(propRes.data || []);
      setEmployeeProperties(epRes.data || []);
    } catch {
      // Component renders with existing state
    }
  }

  const getKnownProperties = (empId: string) =>
    employeeProperties.filter(ep => ep.employee_id === empId).map(ep => properties.find(p => p.id === ep.property_id)).filter(Boolean) as Property[];

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEmployees = useMemo(() => {
    let list = employees;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e => `${e.first_name} ${e.last_name}`.toLowerCase().includes(s) || e.phone.toLowerCase().includes(s) || (e.email || '').toLowerCase().includes(s));
    }
    if (filter === 'active') list = list.filter(e => e.status === 'active');
    if (filter === 'sick') list = list.filter(e => e.status === 'sick');
    return list;
  }, [employees, search, filter]);

  const handleAddEmployee = async () => {
    if (!newFirst || !newLast) return;
    setCreatingAccount(true);

    const { data, error } = await supabase.from('employees').insert({
      company_id: company.id, first_name: newFirst, last_name: newLast, phone: newPhone, email: loginEnabled ? (newEmail || null) : null, status: 'active',
    }).select().maybeSingle();

    if (error) { addToast('Fehler beim Speichern', 'error'); setCreatingAccount(false); return; }

    if (data && newPropertyIds.length > 0) {
      await supabase.from('employee_properties').insert(newPropertyIds.map(pid => ({ employee_id: data.id, property_id: pid })));
    }

    if (data && loginEnabled && newEmail && newPassword) {
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-employee-user`;
        const session = (await supabase.auth.getSession()).data.session;
        const res = await fetch(apiUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${session?.access_token || ''}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: newEmail, password: newPassword, employeeId: data.id }) });
        const result = await res.json();
        if (result.error) { addToast(`Account-Fehler: ${result.error}`, 'error'); } else { addToast('Mitarbeiter mit Login erstellt'); }
      } catch { addToast('Account konnte nicht erstellt werden', 'error'); }
    } else {
      addToast('Mitarbeiter hinzugefügt');
    }

    setAddModal(false);
    setNewFirst(''); setNewLast(''); setNewPhone(''); setNewEmail(''); setNewPassword('');
    setNewPropertyIds([]); setLoginEnabled(false);
    setCreatingAccount(false);
    onRefresh();
  };

  const openEditModal = (emp: Employee) => {
    setEditFirst(emp.first_name); setEditLast(emp.last_name); setEditPhone(emp.phone);
    setEditPropertyIds(employeeProperties.filter(ep => ep.employee_id === emp.id).map(ep => ep.property_id));
    setEditModal(emp); setMenuOpen(null);
  };

  const handleEditEmployee = async () => {
    if (!editModal || !editFirst || !editLast) return;
    const { error } = await supabase.from('employees').update({ first_name: editFirst, last_name: editLast, phone: editPhone }).eq('id', editModal.id);
    if (error) { addToast('Fehler beim Speichern', 'error'); return; }

    const currentPropIds = employeeProperties.filter(ep => ep.employee_id === editModal.id).map(ep => ep.property_id);
    const toAdd = editPropertyIds.filter(id => !currentPropIds.includes(id));
    const toRemove = currentPropIds.filter(id => !editPropertyIds.includes(id));
    if (toRemove.length > 0) await supabase.from('employee_properties').delete().eq('employee_id', editModal.id).in('property_id', toRemove);
    if (toAdd.length > 0) await supabase.from('employee_properties').insert(toAdd.map(pid => ({ employee_id: editModal.id, property_id: pid })));

    setEditModal(null); onRefresh(); addToast('Mitarbeiter aktualisiert');
  };

  const handleMarkSick = async (emp: Employee) => {
    const { error: e1 } = await supabase.from('employees').update({ status: 'sick' }).eq('id', emp.id);
    if (e1) { addToast('Fehler', 'error'); return; }
    await supabase.from('sick_reports').insert({ employee_id: emp.id, date: todayStr, reason: '' });
    setMenuOpen(null); onRefresh(); addToast(`${emp.first_name} ${emp.last_name} als krank markiert`);
  };

  const handleMarkActive = async (emp: Employee) => {
    const { error } = await supabase.from('employees').update({ status: 'active' }).eq('id', emp.id);
    if (error) { addToast('Fehler', 'error'); return; }
    setMenuOpen(null); onRefresh(); addToast(`${emp.first_name} ${emp.last_name} als gesund markiert`);
  };

  const handleDelete = async (emp: Employee) => {
    const { error: _e1 } = await supabase.from('employee_properties').delete().eq('employee_id', emp.id);
    const { error: e2 } = await supabase.from('employees').delete().eq('id', emp.id);
    if (e2) { addToast('Fehler beim Löschen', 'error'); return; }
    setDeleteConfirm(null); setMenuOpen(null); onRefresh(); addToast('Mitarbeiter gelöscht');
  };

  const toggleProperty = (pid: string, setter: typeof setNewPropertyIds) => {
    setter(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]);
  };

  const counts = useMemo(() => ({
    all: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    sick: employees.filter(e => e.status === 'sick').length,
  }), [employees]);

  const renderPropertyChips = (selectedIds: string[], setter: typeof setNewPropertyIds) => (
    <div className="flex flex-wrap gap-2">
      {properties.map(p => (
        <button key={p.id} onClick={() => toggleProperty(p.id, setter)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedIds.includes(p.id) ? 'bg-[#22C55E] text-white shadow-sm' : 'bg-gray-100 text-[#64748B] hover:bg-gray-200'}`}>
          {p.name}
        </button>
      ))}
      {properties.length === 0 && <span className="text-sm text-[#64748B]">Keine Objekte vorhanden</span>}
    </div>
  );

  const renderPropertyChipsOverflow = (props: Property[]) => {
    const max = 3;
    const visible = props.slice(0, max);
    const extra = props.length - max;
    return (
      <div className="flex gap-1 flex-wrap">
        {visible.map(p => <span key={p.id} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-[#64748B]">{p.name}</span>)}
        {extra > 0 && <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-[#64748B]">+{extra} weitere</span>}
        {props.length === 0 && <span className="text-xs text-[#64748B]">—</span>}
      </div>
    );
  };

  const renderEmployeeCard = (emp: Employee) => {
    const knownProps = getKnownProperties(emp.id);
    return (
      <div key={emp.id} className={`bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] relative ${menuOpen === emp.id ? 'ring-2 ring-[#22C55E]/30' : ''}`}>
        <div className="flex items-start gap-3">
          <Avatar firstName={emp.first_name} lastName={emp.last_name} id={emp.id} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0F172A]">{emp.first_name} {emp.last_name}</p>
            <p className="text-[13px] text-[#64748B] flex items-center gap-1 mt-0.5"><Phone size={12} /> {emp.phone}</p>
            {emp.email && <p className="text-[13px] text-[#64748B] flex items-center gap-1 mt-0.5"><Mail size={12} /> {emp.email}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${emp.status === 'sick' ? 'bg-red-50 text-[#EF4444]' : 'bg-green-50 text-[#22C55E]'}`}>
              {emp.status === 'sick' ? 'Krank' : 'Aktiv'}
            </span>
            {emp.user_id ? <Shield size={14} className="text-blue-500" /> : <ShieldOff size={14} className="text-gray-300" />}
          </div>
        </div>
        {knownProps.length > 0 && <div className="mt-2">{renderPropertyChipsOverflow(knownProps)}</div>}
        {!emp.user_id && knownProps.length > 0 && (
          <p className="text-[11px] text-[#F97316] mt-1.5 flex items-center gap-1"><AlertCircle size={10} /> Kein App-Zugang — kann Einsätze nicht bestätigen</p>
        )}
        <div className="absolute top-3 right-3" ref={menuOpen === emp.id ? menuRef : null}>
          <button onClick={() => setMenuOpen(menuOpen === emp.id ? null : emp.id)} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <MoreVertical size={16} className="text-[#64748B]" />
          </button>
          {menuOpen === emp.id && (
            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 min-w-[180px]">
              <button onClick={() => openEditModal(emp)} className="w-full text-left px-4 py-2 text-sm text-[#0F172A] hover:bg-gray-50 transition-colors flex items-center gap-2"><Pencil size={14} /> Bearbeiten</button>
              {emp.status === 'active' ? (
                <button onClick={() => handleMarkSick(emp)} className="w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-red-50 transition-colors">Als krank melden</button>
              ) : (
                <button onClick={() => handleMarkActive(emp)} className="w-full text-left px-4 py-2 text-sm text-[#22C55E] hover:bg-green-50 transition-colors">Krankmeldung beenden</button>
              )}
              <button onClick={() => { setDeleteConfirm(emp); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-red-50 transition-colors flex items-center gap-2"><Trash2 size={14} /> Löschen</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmployeeRow = (emp: Employee) => {
    const knownProps = getKnownProperties(emp.id);
    return (
      <tr key={emp.id} className={`border-b border-gray-50 ${menuOpen === emp.id ? 'bg-green-50/30' : 'hover:bg-gray-50/50'}`}>
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <Avatar firstName={emp.first_name} lastName={emp.last_name} id={emp.id} size="sm" />
            <span className="text-sm font-medium text-[#0F172A]">{emp.first_name} {emp.last_name}</span>
          </div>
        </td>
        <td className="px-5 py-3">
          <div className="space-y-0.5">
            <span className="text-sm text-[#64748B] flex items-center gap-1.5"><Phone size={13} /> {emp.phone}</span>
            <span className="text-sm text-[#64748B] flex items-center gap-1.5"><Mail size={13} /> {emp.email || '—'}</span>
          </div>
        </td>
        <td className="px-5 py-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${emp.status === 'sick' ? 'bg-red-50 text-[#EF4444]' : 'bg-green-50 text-[#22C55E]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'sick' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`} />
            {emp.status === 'sick' ? 'Krank' : 'Aktiv'}
          </span>
        </td>
        <td className="px-5 py-3">
          {emp.user_id ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600"><Shield size={12} /> Aktiv</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-[#64748B]"><ShieldOff size={12} /> Kein Zugang</span>
          )}
        </td>
        <td className="px-5 py-3">{renderPropertyChipsOverflow(knownProps)}</td>
        <td className="px-5 py-3">
          <div className="relative" ref={menuOpen === emp.id ? menuRef : null}>
            <button onClick={() => setMenuOpen(menuOpen === emp.id ? null : emp.id)} className="p-1 rounded hover:bg-gray-100 transition-colors">
              <MoreVertical size={16} className="text-[#64748B]" />
            </button>
            {menuOpen === emp.id && (
              <div className="absolute right-5 top-10 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 min-w-[180px]">
                <button onClick={() => openEditModal(emp)} className="w-full text-left px-4 py-2 text-sm text-[#0F172A] hover:bg-gray-50 transition-colors flex items-center gap-2"><Pencil size={14} /> Bearbeiten</button>
                {emp.status === 'active' ? (
                  <button onClick={() => handleMarkSick(emp)} className="w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-red-50 transition-colors">Als krank melden</button>
                ) : (
                  <button onClick={() => handleMarkActive(emp)} className="w-full text-left px-4 py-2 text-sm text-[#22C55E] hover:bg-green-50 transition-colors">Krankmeldung beenden</button>
                )}
                <button onClick={() => { setDeleteConfirm(emp); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-red-50 transition-colors flex items-center gap-2"><Trash2 size={14} /> Löschen</button>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Mitarbeiter</h1>
        <button onClick={() => setAddModal(true)} className="flex items-center justify-center gap-2 bg-[#22C55E] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
          <Plus size={16} /> Mitarbeiter hinzufügen
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input type="text" placeholder="Name, Telefon oder E-Mail..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'all', label: `Alle ${counts.all}` },
          { key: 'active', label: `Aktiv ${counts.active}` },
          { key: 'sick', label: `Krank ${counts.sick}` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as typeof filter)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === f.key ? 'bg-[#0F172A] text-white' : 'bg-gray-100 text-[#64748B] hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="lg:hidden space-y-3">
        {filteredEmployees.map(renderEmployeeCard)}
        {filteredEmployees.length === 0 && <div className="bg-white rounded-xl p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]"><p className="text-[#64748B]">Keine Mitarbeiter gefunden</p></div>}
      </div>

      <div className="hidden lg:block bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-wider font-medium">Mitarbeiter</th>
              <th className="text-left px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-wider font-medium">Kontakt</th>
              <th className="text-left px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-wider font-medium">Status</th>
              <th className="text-left px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-wider font-medium">Login</th>
              <th className="text-left px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-wider font-medium">Objekte</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(renderEmployeeRow)}
            {filteredEmployees.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-[#64748B]">Keine Mitarbeiter gefunden</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setLoginEnabled(false); }} width="max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Mitarbeiter hinzufügen</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Vorname <span className="text-[#EF4444]">*</span></label>
                <input type="text" value={newFirst} onChange={e => setNewFirst(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Nachname <span className="text-[#EF4444]">*</span></label>
                <input type="text" value={newLast} onChange={e => setNewLast(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Telefon <span className="text-[#EF4444]">*</span></label>
              <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+49 171..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Bekannte Objekte</label>
              {renderPropertyChips(newPropertyIds, setNewPropertyIds)}
            </div>
            <hr className="border-gray-100 my-2" />
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={loginEnabled} onChange={e => setLoginEnabled(e.target.checked)} className="w-4 h-4 rounded accent-[#22C55E]" />
                <span className="text-sm font-medium text-[#0F172A]">Login-Daten (optional)</span>
              </label>
              <p className="text-xs text-[#64748B] mt-1 ml-6">Mitarbeiter kann sich in der App anmelden und muss beim ersten Login ein Passwort setzen.</p>
              {loginEnabled && (
                <div className="space-y-3 mt-3 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">E-Mail</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="max@beispiel.de"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1">Initiales Passwort</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mind. 6 Zeichen"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => { setAddModal(false); setLoginEnabled(false); }} className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-gray-100 transition-colors">Abbrechen</button>
            <button onClick={handleAddEmployee} disabled={!newFirst || !newLast || !newPhone || creatingAccount}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#22C55E] text-white hover:bg-green-600 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
              {creatingAccount ? 'Wird erstellt...' : 'Speichern'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} width="max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Mitarbeiter bearbeiten</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Vorname</label>
                <input type="text" value={editFirst} onChange={e => setEditFirst(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Nachname</label>
                <input type="text" value={editLast} onChange={e => setEditLast(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Telefon</label>
              <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+49 171..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Bekannte Objekte</label>
              {renderPropertyChips(editPropertyIds, setEditPropertyIds)}
            </div>
            {editModal?.email && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-[#64748B]">Login: <span className="font-medium text-[#0F172A]">{editModal.email}</span></p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEditModal(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-gray-100 transition-colors">Abbrechen</button>
            <button onClick={handleEditEmployee} disabled={!editFirst || !editLast}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#22C55E] text-white hover:bg-green-600 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">Speichern</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} width="max-w-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-2">Mitarbeiter löschen?</h2>
          <p className="text-sm text-[#64748B] mb-6">
            {deleteConfirm?.first_name} {deleteConfirm?.last_name} wird unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-gray-100 transition-colors">Abbrechen</button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#EF4444] text-white hover:bg-red-600 transition-colors">Löschen</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
