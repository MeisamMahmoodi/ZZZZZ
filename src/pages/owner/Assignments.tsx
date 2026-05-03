import { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, MapPin, Clock, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../../components/shared/Modal';
import { Avatar } from '../../components/shared/Avatar';
import { useToast } from '../../components/shared/Toast';
import { formatTime } from '../../lib/utils';
import type { Employee, Property, Assignment, Company } from '../../lib/types';

interface AssignmentsProps {
  company: Company;
  refreshKey: number;
  onRefresh: () => void;
}

interface AssignmentWithDetails extends Assignment {
  employee: Employee;
  property: Property;
}

export function Assignments({ company, refreshKey, onRefresh }: AssignmentsProps) {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { addToast } = useToast();

  const [newPropertyId, setNewPropertyId] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEmployeeIds, setNewEmployeeIds] = useState<string[]>([]);
  const [newTimeFrom, setNewTimeFrom] = useState('08:00');
  const [newTimeTo, setNewTimeTo] = useState('12:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [company.id, refreshKey, selectedDate]);

  async function loadData() {
    try {
      const [assignRes, propRes, empRes] = await Promise.all([
        supabase.from('assignments').select('*, employee:employees(*), property:properties(*)').eq('date', selectedDate).order('created_at'),
        supabase.from('properties').select('*').eq('company_id', company.id).order('name'),
        supabase.from('employees').select('*').eq('company_id', company.id),
      ]);
      setAssignments((assignRes.data as unknown as AssignmentWithDetails[]) || []);
      setProperties(propRes.data || []);
      setEmployees(empRes.data || []);
    } catch {
      // Component renders with existing state
    }
  }

  const companyAssignments = useMemo(() =>
    assignments.filter(a => a.property?.company_id === company.id),
    [assignments, company.id]
  );

  const activeEmployees = useMemo(() =>
    employees.filter(e => e.status === 'active'),
    [employees]
  );

  const handleAddAssignment = async () => {
    if (!newPropertyId || !newDate || newEmployeeIds.length === 0) {
      addToast('Bitte alle Felder ausfüllen', 'error');
      return;
    }
    setSaving(true);

    const inserts = newEmployeeIds.map(eid => ({
      property_id: newPropertyId,
      employee_id: eid,
      date: newDate,
      status: 'assigned',
    }));

    const { error } = await supabase.from('assignments').insert(inserts);

    if (error) {
      addToast('Fehler beim Speichern', 'error');
      setSaving(false);
      return;
    }

    // Create notifications for assigned employees
    const prop = properties.find(p => p.id === newPropertyId);
    if (prop) {
      await supabase.from('notifications').insert(
        newEmployeeIds.map(eid => ({
          employee_id: eid,
          type: 'new_assignment',
          title: 'Neuer Einsatz',
          message: `Du wurdest für ${prop.name} am ${new Date(newDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} (${formatTime(newTimeFrom)}–${formatTime(newTimeTo)} Uhr) eingeteilt.`,
          read: false,
        }))
      );
    }

    setSaving(false);
    setAddModal(false);
    setNewPropertyId('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewEmployeeIds([]);
    setNewTimeFrom('08:00');
    setNewTimeTo('12:00');
    onRefresh();
    addToast('Einsatz erstellt und Mitarbeiter benachrichtigt');
  };

  const handleRemoveAssignment = async (assignment: AssignmentWithDetails) => {
    const { error } = await supabase.from('assignments').delete().eq('id', assignment.id);
    if (error) { addToast('Fehler beim Entfernen', 'error'); return; }
    onRefresh();
    addToast('Zuweisung entfernt');
  };

  const handleStatusChange = async (assignment: AssignmentWithDetails, status: string) => {
    const { error } = await supabase.from('assignments').update({ status }).eq('id', assignment.id);
    if (!error) onRefresh();
  };

  const toggleEmployee = (empId: string) => {
    setNewEmployeeIds(prev => prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]);
  };

  const selectedProperty = properties.find(p => p.id === newPropertyId);

  const statusLabel = (status: string) => {
    switch (status) {
      case 'assigned': return 'Zugewiesen';
      case 'checked_in': return 'Eingecheckt';
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-50 text-blue-600';
      case 'checked_in': return 'bg-green-50 text-[#22C55E]';
      case 'completed': return 'bg-gray-100 text-[#64748B]';
      case 'cancelled': return 'bg-red-50 text-[#EF4444]';
      default: return 'bg-gray-100 text-[#64748B]';
    }
  };

  // Group assignments by property
  const groupedAssignments = useMemo(() => {
    const groups: Record<string, { property: Property; assignments: AssignmentWithDetails[] }> = {};
    companyAssignments.forEach(a => {
      if (!groups[a.property_id]) {
        groups[a.property_id] = { property: a.property, assignments: [] };
      }
      groups[a.property_id].assignments.push(a);
    });
    return Object.values(groups);
  }, [companyAssignments]);

  const dateNav = (direction: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Einsätze</h1>
        <button
          onClick={() => setAddModal(true)}
          className="flex items-center justify-center gap-2 bg-[#22C55E] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
        >
          <Plus size={16} /> Einsatz erstellen
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-3 mb-6 bg-white rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <button onClick={() => dateNav(-1)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-[#64748B] hover:bg-gray-200 transition-colors">
          Zurück
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-[#0F172A]">
            {new Date(selectedDate).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => dateNav(1)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-[#64748B] hover:bg-gray-200 transition-colors">
          Weiter
        </button>
        <button
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#0F172A] text-white hover:bg-slate-800 transition-colors"
        >
          Heute
        </button>
      </div>

      {/* Assignments grouped by property */}
      {groupedAssignments.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-[#64748B]">Keine Einsätze für diesen Tag</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedAssignments.map(({ property, assignments: propAssignments }) => (
            <div key={property.id} className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-gray-50 bg-[#F8FAFC]">
                <p className="text-base font-bold text-[#0F172A]">{property.name}</p>
                <p className="text-[13px] text-[#64748B] mt-0.5 flex items-center gap-1.5">
                  <MapPin size={13} /> {property.address}
                </p>
                <p className="text-[13px] text-[#64748B] mt-0.5 flex items-center gap-1.5">
                  <Clock size={13} /> {formatTime(property.time_from)} – {formatTime(property.time_to)} Uhr
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {propAssignments.map(a => (
                  <div key={a.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                    <Avatar firstName={a.employee?.first_name || ''} lastName={a.employee?.last_name || ''} id={a.employee_id} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A]">
                        {a.employee?.first_name} {a.employee?.last_name}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(a.status)}`}>
                      {statusLabel(a.status)}
                    </span>
                    {a.status === 'assigned' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStatusChange(a, 'checked_in')}
                          className="p-1.5 rounded-lg hover:bg-green-50 transition-colors text-[#22C55E]"
                          title="Einchecken"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveAssignment(a)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-[#EF4444]"
                          title="Entfernen"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Assignment Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} width="max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Einsatz erstellen</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Datum</label>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">Objekt</label>
              <select
                value={newPropertyId}
                onChange={e => {
                  setNewPropertyId(e.target.value);
                  const prop = properties.find(p => p.id === e.target.value);
                  if (prop) {
                    setNewTimeFrom(prop.time_from);
                    setNewTimeTo(prop.time_to);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
              >
                <option value="">Objekt auswählen...</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.address}</option>
                ))}
              </select>
            </div>
            {selectedProperty && (
              <div className="bg-[#F8FAFC] rounded-lg p-3 text-sm text-[#64748B]">
                <p className="flex items-center gap-1.5"><MapPin size={14} /> {selectedProperty.address}</p>
                <p className="flex items-center gap-1.5 mt-1"><Clock size={14} /> {formatTime(selectedProperty.time_from)} – {formatTime(selectedProperty.time_to)} Uhr</p>
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Uhrzeit von</label>
                <input
                  type="time"
                  value={newTimeFrom}
                  onChange={e => setNewTimeFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Uhrzeit bis</label>
                <input
                  type="time"
                  value={newTimeTo}
                  onChange={e => setNewTimeTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">Mitarbeiter zuweisen</label>
              <div className="flex flex-wrap gap-2">
                {activeEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => toggleEmployee(emp.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      newEmployeeIds.includes(emp.id)
                        ? 'bg-[#22C55E] text-white'
                        : 'bg-gray-100 text-[#64748B] hover:bg-gray-200'
                    }`}
                  >
                    {emp.first_name} {emp.last_name}
                  </button>
                ))}
                {activeEmployees.length === 0 && (
                  <span className="text-sm text-[#64748B]">Keine aktiven Mitarbeiter</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setAddModal(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-gray-100 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAddAssignment}
              disabled={saving || !newPropertyId || !newDate || newEmployeeIds.length === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#22C55E] text-white hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Wird erstellt...' : 'Einsatz erstellen'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
