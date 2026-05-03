import { useState, useEffect, useRef } from 'react';
import { Plus, MapPin, Users, MoreVertical, Pencil, Trash2, Building2, GraduationCap, ShoppingCart, HeartPulse, AlertCircle, CalendarPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import { formatTime, getTodayDayAbbrev } from '../../lib/utils';
import type { Employee, Property, EmployeeProperty, Company } from '../../lib/types';

interface PropertiesProps {
  company: Company;
  refreshKey: number;
  onRefresh: () => void;
  onNavigate?: (page: string) => void;
}

const dayOptions = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const typeOptions = [
  { value: 'office', label: 'Büro', icon: Building2 },
  { value: 'school', label: 'Schule', icon: GraduationCap },
  { value: 'supermarket', label: 'Supermarkt', icon: ShoppingCart },
  { value: 'doctor', label: 'Arztpraxis', icon: HeartPulse },
  { value: 'other', label: 'Sonstiges', icon: Building2 },
];

export function Properties({ company, refreshKey, onRefresh, onNavigate }: PropertiesProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeProperties, setEmployeeProperties] = useState<EmployeeProperty[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<Property | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Property | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newType, setNewType] = useState('office');
  const [newDays, setNewDays] = useState<string[]>(['Mo', 'Di', 'Mi', 'Do', 'Fr']);
  const [newTimeFrom, setNewTimeFrom] = useState('08:00');
  const [newTimeTo, setNewTimeTo] = useState('12:00');
  const [newEmployeeIds, setNewEmployeeIds] = useState<string[]>([]);

  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editType, setEditType] = useState('office');
  const [editDays, setEditDays] = useState<string[]>([]);
  const [editTimeFrom, setEditTimeFrom] = useState('08:00');
  const [editTimeTo, setEditTimeTo] = useState('12:00');
  const [editEmployeeIds, setEditEmployeeIds] = useState<string[]>([]);

  const todayDay = getTodayDayAbbrev();

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
      const [propRes, empRes, epRes] = await Promise.all([
        supabase.from('properties').select('*').eq('company_id', company.id).order('name'),
        supabase.from('employees').select('*').eq('company_id', company.id),
        supabase.from('employee_properties').select('*'),
      ]);
      setProperties(propRes.data || []);
      setEmployees(empRes.data || []);
      setEmployeeProperties(epRes.data || []);
    } catch {
      // Component renders with existing state
    }
  }

  const getPropertyEmployees = (propId: string) =>
    employeeProperties.filter(ep => ep.property_id === propId).map(ep => employees.find(e => e.id === ep.employee_id)).filter(Boolean) as Employee[];

  const toggleDay = (day: string, setter: typeof setNewDays) => {
    setter(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleEmployee = (empId: string, setter: typeof setNewEmployeeIds) => {
    setter(prev => prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]);
  };

  const openEditModal = (prop: Property) => {
    setEditName(prop.name); setEditAddress(prop.address); setEditType(prop.type);
    setEditDays(prop.cleaning_days || []); setEditTimeFrom(prop.time_from || '08:00'); setEditTimeTo(prop.time_to || '12:00');
    setEditEmployeeIds(employeeProperties.filter(ep => ep.property_id === prop.id).map(ep => ep.employee_id));
    setEditModal(prop); setMenuOpen(null);
  };

  const handleAddProperty = async () => {
    if (!newName) return;
    const { data, error } = await supabase.from('properties').insert({
      company_id: company.id, name: newName, address: newAddress, type: newType, cleaning_days: newDays, time_from: newTimeFrom, time_to: newTimeTo,
    }).select().maybeSingle();

    if (error) { addToast('Fehler beim Speichern', 'error'); return; }

    if (data && newEmployeeIds.length > 0) {
      await supabase.from('employee_properties').insert(newEmployeeIds.map(eid => ({ employee_id: eid, property_id: data.id })));
      const todayStr = new Date().toISOString().split('T')[0];
      if (newDays.includes(todayDay)) {
        await supabase.from('assignments').insert(newEmployeeIds.map(eid => ({ property_id: data.id, employee_id: eid, date: todayStr, status: 'assigned' })));
      }
    }

    setAddModal(false); resetForm(); onRefresh(); addToast('Objekt hinzugefügt');
  };

  const handleEditProperty = async () => {
    if (!editModal || !editName) return;
    const { error } = await supabase.from('properties').update({
      name: editName, address: editAddress, type: editType, cleaning_days: editDays, time_from: editTimeFrom, time_to: editTimeTo,
    }).eq('id', editModal.id);

    if (error) { addToast('Fehler beim Speichern', 'error'); return; }

    const currentEmpIds = employeeProperties.filter(ep => ep.property_id === editModal.id).map(ep => ep.employee_id);
    const toAdd = editEmployeeIds.filter(id => !currentEmpIds.includes(id));
    const toRemove = currentEmpIds.filter(id => !editEmployeeIds.includes(id));
    if (toRemove.length > 0) await supabase.from('employee_properties').delete().eq('property_id', editModal.id).in('employee_id', toRemove);
    if (toAdd.length > 0) await supabase.from('employee_properties').insert(toAdd.map(eid => ({ employee_id: eid, property_id: editModal.id })));

    setEditModal(null); onRefresh(); addToast('Objekt aktualisiert');
  };

  const handleDelete = async (prop: Property) => {
    await supabase.from('employee_properties').delete().eq('property_id', prop.id);
    await supabase.from('assignments').delete().eq('property_id', prop.id);
    const { error } = await supabase.from('properties').delete().eq('id', prop.id);
    if (error) { addToast('Fehler beim Löschen', 'error'); return; }
    setDeleteConfirm(null); setMenuOpen(null); onRefresh(); addToast('Objekt gelöscht');
  };

  const resetForm = () => {
    setNewName(''); setNewAddress(''); setNewType('office');
    setNewDays(['Mo', 'Di', 'Mi', 'Do', 'Fr']); setNewTimeFrom('08:00'); setNewTimeTo('12:00'); setNewEmployeeIds([]);
  };

  const TypeIcon = ({ type }: { type: string }) => {
    const opt = typeOptions.find(o => o.value === type) || typeOptions[4];
    const Icon = opt.icon;
    return <Icon size={20} className="text-ink-700" />;
  };

  const renderEmployeeChips = (selectedIds: string[], setter: typeof setNewEmployeeIds) => (
    <div className="flex flex-wrap gap-2">
      {employees.filter(e => e.status === 'active').map(emp => (
        <button key={emp.id} onClick={() => toggleEmployee(emp.id, setter)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${selectedIds.includes(emp.id) ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-100 text-ink-500 hover:bg-surface-200'}`}>
          {emp.first_name} {emp.last_name}
        </button>
      ))}
      {employees.filter(e => e.status === 'active').length === 0 && <span className="text-sm text-ink-300">Keine aktiven Mitarbeiter</span>}
    </div>
  );

  const renderDayPicker = (selectedDays: string[], setter: typeof setNewDays) => (
    <div className="flex gap-2">
      {dayOptions.map(day => (
        <button key={day} onClick={() => toggleDay(day, setter)}
          className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200 ${selectedDays.includes(day) ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-100 text-ink-500 hover:bg-surface-200'}`}>
          {day}
        </button>
      ))}
    </div>
  );

  const renderTypePicker = (selectedType: string, setter: typeof setNewType) => (
    <div className="flex flex-wrap gap-2">
      {typeOptions.map(opt => (
        <button key={opt.value} onClick={() => setter(opt.value)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${selectedType === opt.value ? 'bg-ink-900 text-white shadow-sm' : 'bg-surface-100 text-ink-500 hover:bg-surface-200'}`}>
          <opt.icon size={14} /> {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-[28px] font-bold text-ink-900 tracking-tight">Objekte</h1>
        <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Objekt hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {properties.map(prop => {
          const propEmployees = getPropertyEmployees(prop.id);
          const isToday = prop.cleaning_days?.includes(todayDay);
          const noStaff = propEmployees.length === 0;

          return (
            <div key={prop.id} className={`card-interactive p-5 relative ${noStaff ? 'border-warning-200/60' : ''}`}>
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-surface-50 flex items-center justify-center shrink-0">
                  <TypeIcon type={prop.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-ink-900">{prop.name}</p>
                  <p className={`text-[13px] mt-1 font-medium ${isToday ? 'text-brand-600' : 'text-ink-500'}`}>
                    {prop.cleaning_days?.join(' · ')} · {formatTime(prop.time_from)}–{formatTime(prop.time_to)} Uhr
                  </p>
                  <p className="text-[13px] text-ink-500 mt-0.5 flex items-center gap-1.5"><MapPin size={13} className="text-ink-300" /> {prop.address}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Users size={13} className="text-ink-300" />
                    {propEmployees.map(e => (
                      <span key={e.id} className="px-2.5 py-1 bg-surface-100 rounded-lg text-xs font-medium text-ink-500">{e.first_name} {e.last_name.charAt(0)}.</span>
                    ))}
                    {noStaff && (
                      <span className="badge-warning">
                        <AlertCircle size={12} /> Kein Personal
                      </span>
                    )}
                  </div>
                  {noStaff && (
                    <p className="text-[11px] text-warning-500 mt-1.5 font-medium">Objekt ohne Personal — Einsatz nicht möglich</p>
                  )}
                </div>
                <div className="relative" ref={menuOpen === prop.id ? menuRef : null}>
                  <button onClick={() => setMenuOpen(menuOpen === prop.id ? null : prop.id)} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
                    <MoreVertical size={16} className="text-ink-300" />
                  </button>
                  {menuOpen === prop.id && (
                    <div className="absolute right-0 top-9 bg-surface-0 rounded-xl shadow-elevated border border-surface-200/60 py-1.5 z-20 min-w-[180px] animate-scale-in">
                      <button onClick={() => openEditModal(prop)} className="w-full text-left px-4 py-2.5 text-sm text-ink-900 hover:bg-surface-50 transition-colors flex items-center gap-2.5"><Pencil size={14} className="text-ink-300" /> Bearbeiten</button>
                      <button onClick={() => { setMenuOpen(null); onNavigate?.('assignments'); }} className="w-full text-left px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50 transition-colors flex items-center gap-2.5"><CalendarPlus size={14} /> Einsatz erstellen</button>
                      <div className="mx-3 my-1 h-px bg-surface-100" />
                      <button onClick={() => { setDeleteConfirm(prop); setMenuOpen(null); }} className="w-full text-left px-4 py-2.5 text-sm text-danger-500 hover:bg-danger-50 transition-colors flex items-center gap-2.5"><Trash2 size={14} /> Löschen</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {properties.length === 0 && (
          <div className="col-span-2 card p-10 text-center"><p className="text-ink-300 text-sm">Keine Objekte vorhanden</p></div>
        )}
      </div>

      {/* Add Property Modal */}
      <Modal open={addModal} onClose={() => { setAddModal(false); resetForm(); }} width="max-w-md">
        <div className="p-8">
          <h2 className="text-lg font-bold text-ink-900 mb-6">Objekt hinzufügen</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">Objektname <span className="text-danger-500">*</span></label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">Adresse</label>
              <input type="text" value={newAddress} onChange={e => setNewAddress(e.target.value)} className="input-field" />
            </div>
            <div><label className="block text-sm font-medium text-ink-900 mb-1.5">Typ</label>{renderTypePicker(newType, setNewType)}</div>
            <div><label className="block text-sm font-medium text-ink-900 mb-1.5">Reinigungstage</label>{renderDayPicker(newDays, setNewDays)}</div>
            <div className="flex gap-3">
              <div className="flex-1"><label className="block text-sm font-medium text-ink-900 mb-1.5">Uhrzeit von</label><input type="time" value={newTimeFrom} onChange={e => setNewTimeFrom(e.target.value)} className="input-field" /></div>
              <div className="flex-1"><label className="block text-sm font-medium text-ink-900 mb-1.5">Uhrzeit bis</label><input type="time" value={newTimeTo} onChange={e => setNewTimeTo(e.target.value)} className="input-field" /></div>
            </div>
            <div><label className="block text-sm font-medium text-ink-900 mb-1.5">Zugewiesene Mitarbeiter</label>{renderEmployeeChips(newEmployeeIds, setNewEmployeeIds)}</div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button onClick={() => { setAddModal(false); resetForm(); }} className="btn-ghost">Abbrechen</button>
            <button onClick={handleAddProperty} disabled={!newName} className="btn-primary">Speichern</button>
          </div>
        </div>
      </Modal>

      {/* Edit Property Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} width="max-w-md">
        <div className="p-8">
          <h2 className="text-lg font-bold text-ink-900 mb-6">Objekt bearbeiten</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-ink-900 mb-1.5">Objektname</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-ink-900 mb-1.5">Adresse</label><input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-ink-900 mb-1.5">Typ</label>{renderTypePicker(editType, setEditType)}</div>
            <div><label className="block text-sm font-medium text-ink-900 mb-1.5">Reinigungstage</label>{renderDayPicker(editDays, setEditDays)}</div>
            <div className="flex gap-3">
              <div className="flex-1"><label className="block text-sm font-medium text-ink-900 mb-1.5">Uhrzeit von</label><input type="time" value={editTimeFrom} onChange={e => setEditTimeFrom(e.target.value)} className="input-field" /></div>
              <div className="flex-1"><label className="block text-sm font-medium text-ink-900 mb-1.5">Uhrzeit bis</label><input type="time" value={editTimeTo} onChange={e => setEditTimeTo(e.target.value)} className="input-field" /></div>
            </div>
            <div><label className="block text-sm font-medium text-ink-900 mb-1.5">Zugewiesene Mitarbeiter</label>{renderEmployeeChips(editEmployeeIds, setEditEmployeeIds)}</div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button onClick={() => setEditModal(null)} className="btn-ghost">Abbrechen</button>
            <button onClick={handleEditProperty} disabled={!editName} className="btn-primary">Speichern</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} width="max-w-sm">
        <div className="p-8">
          <div className="w-12 h-12 rounded-2xl bg-danger-50 flex items-center justify-center mb-5">
            <Trash2 size={22} className="text-danger-500" />
          </div>
          <h2 className="text-lg font-bold text-ink-900 mb-2">Objekt löschen?</h2>
          <p className="text-sm text-ink-500 leading-relaxed mb-8">
            „{deleteConfirm?.name}" wird unwiderruflich gelöscht. Alle zugehörigen Einsätze und Zuweisungen werden ebenfalls entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-ghost">Abbrechen</button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="btn-danger">Löschen</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
