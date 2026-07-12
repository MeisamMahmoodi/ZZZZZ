import { useState, useEffect, useRef } from 'react';
import { Plus, MapPin, Users, MoreVertical, Pencil, Trash2, Building2, GraduationCap, ShoppingCart, HeartPulse, AlertCircle, CalendarPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import { AddressAutocomplete } from '../../components/shared/AddressAutocomplete';
import type { AddressValue } from '../../components/shared/AddressAutocomplete';
import type { Employee, Property, EmployeeProperty, Company } from '../../lib/types';

interface PropertiesProps {
  company: Company;
  refreshKey: number;
  onRefresh: () => void;
  onNavigate?: (page: string) => void;
}

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
  const [newAddress, setNewAddress] = useState<AddressValue>({ formatted: '', lat: null, lng: null });
  const [newType, setNewType] = useState('office');

  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState<AddressValue>({ formatted: '', lat: null, lng: null });
  const [editType, setEditType] = useState('office');

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

  const openEditModal = (prop: Property) => {
    setEditName(prop.name);
    setEditAddress({ formatted: prop.address, lat: prop.lat ?? null, lng: prop.lng ?? null });
    setEditType(prop.type);
    setEditModal(prop); setMenuOpen(null);
  };

  const handleAddProperty = async () => {
    if (!newName) return;
    // Objekte legen nur noch die Stammdaten fest (Name, Adresse, Typ).
    // Reinigungstage, Uhrzeiten und Mitarbeiterzuweisung passieren bewusst
    // getrennt im Einsätze-Bereich (Einzel- oder wiederkehrender Auftrag).
    const { error } = await supabase.from('properties').insert({
      company_id: company.id, name: newName, address: newAddress.formatted, type: newType,
      lat: newAddress.lat, lng: newAddress.lng,
    });

    if (error) { addToast('Fehler beim Speichern', 'error'); return; }

    setAddModal(false); resetForm(); onRefresh(); addToast('Objekt hinzugefügt');
  };

  const handleEditProperty = async () => {
    if (!editModal || !editName) return;
    const { error } = await supabase.from('properties').update({
      name: editName, address: editAddress.formatted, type: editType,
      lat: editAddress.lat, lng: editAddress.lng,
    }).eq('id', editModal.id);

    if (error) { addToast('Fehler beim Speichern', 'error'); return; }

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
    setNewName(''); setNewAddress({ formatted: '', lat: null, lng: null }); setNewType('office');
  };

  const TypeIcon = ({ type }: { type: string }) => {
    const opt = typeOptions.find(o => o.value === type) || typeOptions[4];
    const Icon = opt.icon;
    return <Icon size={20} className="text-[#334155]" />;
  };

  const renderTypePicker = (selectedType: string, setter: (v: string) => void) => (
    <div className="flex flex-wrap gap-2">
      {typeOptions.map(opt => (
        <button key={opt.value} onClick={() => setter(opt.value)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${selectedType === opt.value ? 'bg-[#0F172A] text-white shadow-sm' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'}`}>
          <opt.icon size={14} /> {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Objekte</h1>
        <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Objekt hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {properties.map(prop => {
          const propEmployees = getPropertyEmployees(prop.id);
          const noStaff = propEmployees.length === 0;

          return (
            <div key={prop.id} className={`card p-5 relative ${noStaff ? 'border-[#FFEDD5]/60' : ''}`}>
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#F8FAFC] flex items-center justify-center shrink-0">
                  <TypeIcon type={prop.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A]">{prop.name}</p>
                  <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5"><MapPin size={12} className="text-[#94A3B8]" /> {prop.address}</p>
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <Users size={12} className="text-[#94A3B8]" />
                    {propEmployees.map(e => (
                      <span key={e.id} className="chip">{e.first_name} {e.last_name.charAt(0)}.</span>
                    ))}
                    {noStaff && (
                      <span className="badge-warning">
                        <AlertCircle size={11} /> Kein Personal
                      </span>
                    )}
                  </div>
                  {noStaff && (
                    <p className="text-[11px] text-[#F97316] mt-1.5 font-medium">Objekt ohne Personal — im Mitarbeiter-Bereich zuweisen</p>
                  )}
                </div>
                <div className="relative" ref={menuOpen === prop.id ? menuRef : null}>
                  <button onClick={() => setMenuOpen(menuOpen === prop.id ? null : prop.id)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors">
                    <MoreVertical size={16} className="text-[#94A3B8]" />
                  </button>
                  {menuOpen === prop.id && (
                    <div className="absolute right-0 top-9 bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-4px_rgba(0,0,0,0.04)] border border-[#E2E8F0]/60 py-1.5 z-20 min-w-[180px] animate-scale-in">
                      <button onClick={() => openEditModal(prop)} className="w-full text-left px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors flex items-center gap-2.5"><Pencil size={14} className="text-[#94A3B8]" /> Bearbeiten</button>
                      <button onClick={() => { setMenuOpen(null); onNavigate?.('assignments'); }} className="w-full text-left px-4 py-2.5 text-sm text-[#16A34A] hover:bg-[#F0FDF4] transition-colors flex items-center gap-2.5"><CalendarPlus size={14} /> Einsatz erstellen</button>
                      <div className="mx-3 my-1 h-px bg-[#F1F5F9]" />
                      <button onClick={() => { setDeleteConfirm(prop); setMenuOpen(null); }} className="w-full text-left px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors flex items-center gap-2.5"><Trash2 size={14} /> Löschen</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {properties.length === 0 && (
          <div className="col-span-2 card p-10 text-center"><p className="text-sm text-[#94A3B8]">Keine Objekte vorhanden</p></div>
        )}
      </div>

      {/* Add Property Modal */}
      <Modal open={addModal} onClose={() => { setAddModal(false); resetForm(); }} width="max-w-md">
        <div className="p-8">
          <h2 className="text-lg font-bold text-[#0F172A] mb-6">Objekt hinzufügen</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Objektname <span className="text-[#EF4444]">*</span></label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Adresse <span className="text-[#EF4444]">*</span></label>
              <AddressAutocomplete
                value={newAddress.formatted}
                onChange={setNewAddress}
              />
            </div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1.5">Typ</label>{renderTypePicker(newType, setNewType)}</div>
          </div>
          <p className="text-xs text-[#94A3B8] mt-5">Reinigungstage, Uhrzeiten und Mitarbeiter legst du im Einsätze-Bereich fest, sobald du für dieses Objekt einen Einzel- oder wiederkehrenden Auftrag erstellst.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => { setAddModal(false); resetForm(); }} className="btn-ghost">Abbrechen</button>
            <button onClick={handleAddProperty} disabled={!newName || !newAddress.lat} className="btn-primary">Speichern</button>
          </div>
        </div>
      </Modal>

      {/* Edit Property Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} width="max-w-md">
        <div className="p-8">
          <h2 className="text-lg font-bold text-[#0F172A] mb-6">Objekt bearbeiten</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1.5">Objektname</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-field" /></div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Adresse <span className="text-[#EF4444]">*</span></label>
              <AddressAutocomplete
                value={editAddress.formatted}
                onChange={setEditAddress}
              />
            </div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1.5">Typ</label>{renderTypePicker(editType, setEditType)}</div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button onClick={() => setEditModal(null)} className="btn-ghost">Abbrechen</button>
            <button onClick={handleEditProperty} disabled={!editName || !editAddress.lat} className="btn-primary">Speichern</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} width="max-w-sm">
        <div className="p-8">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mb-5">
            <Trash2 size={22} className="text-[#EF4444]" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] mb-2">Objekt löschen?</h2>
          <p className="text-sm text-[#64748B] leading-relaxed mb-8">
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
