import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, MoreVertical, Phone, Pencil, Trash2 } from 'lucide-react';
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
  const [filter, setFilter] = useState<'all' | 'active' | 'sick' | 'free'>('all');
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<Employee | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPropertyIds, setNewPropertyIds] = useState<string[]>([]);

  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPropertyIds, setEditPropertyIds] = useState<string[]>([]);

  useEffect(() => { loadData(); }, [company.id, refreshKey]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  async function loadData() {
    const [empRes, propRes, epRes] = await Promise.all([
      supabase.from('employees').select('*').eq('company_id', company.id).order('last_name'),
      supabase.from('properties').select('*').eq('company_id', company.id),
      supabase.from('employee_properties').select('*'),
    ]);
    setEmployees(empRes.data || []);
    setProperties(propRes.data || []);
    setEmployeeProperties(epRes.data || []);
  }

  const getKnownProperties = (empId: string) =>
    employeeProperties
      .filter(ep => ep.employee_id === empId)
      .map(ep => properties.find(p => p.id === ep.property_id))
      .filter(Boolean) as Property[];

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEmployees = useMemo(() => {
    let list = employees;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e =>
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(s) ||
        e.phone.toLowerCase().includes(s)
      );
    }
    if (filter === 'active') list = list.filter(e => e.status === 'active');
    if (filter === 'sick') list = list.filter(e => e.status === 'sick');
    if (filter === 'free') list = list.filter(e => e.status === 'active');
    return list;
  }, [employees, search, filter]);

  const handleAddEmployee = async () => {
    if (!newFirst || !newLast) return;
    const { data, error } = await supabase
      .from('employees')
      .insert({ company_id: company.id, first_name: newFirst, last_name: newLast, phone: newPhone, status: 'active' })
      .select()
      .maybeSingle();

    if (error) { addToast('Fehler beim Speichern', 'error'); return; }
    if (data && newPropertyIds.length > 0) {
      await supabase.from('employee_properties').insert(
        newPropertyIds.map(pid => ({ employee_id: data.id, property_id: pid }))
      );
    }
    setAddModal(false);
    setNewFirst(''); setNewLast(''); setNewPhone(''); setNewPropertyIds([]);
    onRefresh();
    addToast('Mitarbeiter hinzugefügt');
  };

  const openEditModal = (emp: Employee) => {
    setEditFirst(emp.first_name);
    setEditLast(emp.last_name);
    setEditPhone(emp.phone);
    const currentPropIds = employeeProperties
      .filter(ep => ep.employee_id === emp.id)
      .map(ep => ep.property_id);
    setEditPropertyIds(currentPropIds);
    setEditModal(emp);
    setMenuOpen(null);
  };

  const handleEditEmployee = async () => {
    if (!editModal || !editFirst || !editLast) return;

    const { error } = await supabase
      .from('employees')
      .update({ first_name: editFirst, last_name: editLast, phone: editPhone })
      .eq('id', editModal.id);

    if (error) { addToast('Fehler beim Speichern', 'error'); return; }

    // Update property assignments
    const currentPropIds = employeeProperties
      .filter(ep => ep.employee_id === editModal.id)
      .map(ep => ep.property_id);

    const toAdd = editPropertyIds.filter(id => !currentPropIds.includes(id));
    const toRemove = currentPropIds.filter(id => !editPropertyIds.includes(id));

    if (toRemove.length > 0) {
      await supabase
        .from('employee_properties')
        .delete()
        .eq('employee_id', editModal.id)
        .in('property_id', toRemove);
    }
    if (toAdd.length > 0) {
      await supabase.from('employee_properties').insert(
        toAdd.map(pid => ({ employee_id: editModal.id, property_id: pid }))
      );
    }

    setEditModal(null);
    onRefresh();
    addToast('Mitarbeiter aktualisiert');
  };

  const handleMarkSick = async (emp: Employee) => {
    await supabase.from('employees').update({ status: 'sick' }).eq('id', emp.id);
    await supabase.from('sick_reports').insert({ employee_id: emp.id, date: todayStr, reason: '' });
    setMenuOpen(null);
    onRefresh();
    addToast(`${emp.first_name} ${emp.last_name} als krank markiert`);
  };

  const handleMarkActive = async (emp: Employee) => {
    await supabase.from('employees').update({ status: 'active' }).eq('id', emp.id);
    setMenuOpen(null);
    onRefresh();
    addToast(`${emp.first_name} ${emp.last_name} als aktiv markiert`);
  };

  const handleDelete = async (emp: Employee) => {
    await supabase.from('employee_properties').delete().eq('employee_id', emp.id);
    await supabase.from('employees').delete().eq('id', emp.id);
    setMenuOpen(null);
    onRefresh();
    addToast('Mitarbeiter gelöscht');
  };

  const toggleProperty = (pid: string, setter: typeof setNewPropertyIds) => {
    setter(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]);
  };

  const counts = useMemo(() => ({
    all: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    sick: employees.filter(e => e.status === 'sick').length,
    free: employees.filter(e => e.status === 'active').length,
  }), [employees]);

  const renderPropertyChips = (
    selectedIds: string[],
    setter: typeof setNewPropertyIds,
  ) => (
    <div className="flex flex-wrap gap-2">
      {properties.map(p => (
        <button
          key={p.id}
          onClick={() => toggleProperty(p.id, setter)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedIds.includes(p.id)
              ? 'bg-[#22C55E] text-white'
              : 'bg-gray-100 text-[#64748B] hover:bg-gray-200'
          }`}
        >
          {p.name}
        </button>
      ))}
      {properties.length === 0 && (
        <span className="text-sm text-[#64748B]">Keine Objekte vorhanden</span>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Mitarbeiter</h1>
        <button
          onClick={() => setAddModal(true)}
          className="flex items-center gap-2 bg-[#22C55E] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
        >
          <Plus size={16} /> Mitarbeiter hinzufügen
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          placeholder="Name oder Telefon suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: `Alle ${counts.all}` },
          { key: 'active', label: `Aktiv ${counts.active}` },
          { key: 'sick', label: `Krank ${counts.sick}` },
          { key: 'free', label: `Frei heute ${counts.free}` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-[#0F172A] text-white'
                : 'bg-gray-100 text-[#64748B] hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-wider font-medium">Mitarbeiter</th>
              <th className="text-left px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-wider font-medium">Telefon</th>
              <th className="text-left px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-wider font-medium">Status</th>
              <th className="text-left px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-wider font-medium">Bekannte Objekte</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => {
              const knownProps = getKnownProperties(emp.id);
              return (
                <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={emp.first_name} lastName={emp.last_name} id={emp.id} size="sm" />
                      <span className="text-sm font-medium text-[#0F172A]">{emp.first_name} {emp.last_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-[#64748B] flex items-center gap-1.5">
                      <Phone size={13} /> {emp.phone}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      emp.status === 'sick'
                        ? 'bg-red-50 text-[#EF4444]'
                        : 'bg-green-50 text-[#22C55E]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'sick' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`} />
                      {emp.status === 'sick' ? 'Krank' : 'Aktiv'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {knownProps.map(p => (
                        <span key={p.id} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-[#64748B]">
                          {p.name}
                        </span>
                      ))}
                      {knownProps.length === 0 && <span className="text-xs text-[#64748B]">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 relative" ref={menuOpen === emp.id ? menuRef : null}>
                    <button
                      onClick={() => setMenuOpen(menuOpen === emp.id ? null : emp.id)}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical size={16} className="text-[#64748B]" />
                    </button>
                    {menuOpen === emp.id && (
                      <div className="absolute right-5 top-10 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 min-w-[180px]">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="w-full text-left px-4 py-2 text-sm text-[#0F172A] hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <Pencil size={14} /> Bearbeiten
                        </button>
                        {emp.status === 'active' ? (
                          <button
                            onClick={() => handleMarkSick(emp)}
                            className="w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-red-50 transition-colors"
                          >
                            Als krank melden
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkActive(emp)}
                            className="w-full text-left px-4 py-2 text-sm text-[#22C55E] hover:bg-green-50 transition-colors"
                          >
                            Als aktiv markieren
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(emp)}
                          className="w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Löschen
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#64748B]">
                  Keine Mitarbeiter gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} width="max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Mitarbeiter hinzufügen</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Vorname</label>
              <input type="text" value={newFirst} onChange={e => setNewFirst(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Nachname</label>
              <input type="text" value={newLast} onChange={e => setNewLast(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Telefon</label>
              <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+49 171..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Bekannte Objekte</label>
              {renderPropertyChips(newPropertyIds, setNewPropertyIds)}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setAddModal(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-gray-100 transition-colors">
              Abbrechen
            </button>
            <button onClick={handleAddEmployee} disabled={!newFirst || !newLast}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#22C55E] text-white hover:bg-green-600 transition-colors disabled:opacity-50">
              Speichern
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} width="max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Mitarbeiter bearbeiten</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Vorname</label>
              <input type="text" value={editFirst} onChange={e => setEditFirst(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Nachname</label>
              <input type="text" value={editLast} onChange={e => setEditLast(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]" />
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
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEditModal(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-gray-100 transition-colors">
              Abbrechen
            </button>
            <button onClick={handleEditEmployee} disabled={!editFirst || !editLast}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#22C55E] text-white hover:bg-green-600 transition-colors disabled:opacity-50">
              Speichern
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
