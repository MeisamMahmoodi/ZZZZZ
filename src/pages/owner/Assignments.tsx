import { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, MapPin, Clock, Check, X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../../components/shared/Modal';
import { Avatar } from '../../components/shared/Avatar';
import { useToast } from '../../components/shared/Toast';
import { formatTime } from '../../lib/utils';
import { sendPushToEmployee } from '../../hooks/usePushNotifications';
import type { Employee, Property, Assignment, Company, SickReport } from '../../lib/types';

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
  const [sickReports, setSickReports] = useState<SickReport[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const [newPropertyId, setNewPropertyId] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEmployeeIds, setNewEmployeeIds] = useState<string[]>([]);
  const [newTimeFrom, setNewTimeFrom] = useState('');
  const [newTimeTo, setNewTimeTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<AssignmentWithDetails | null>(null);

  useEffect(() => { loadData(); }, [company.id, refreshKey, selectedDate]);

  useEffect(() => {
    const channel = supabase
      .channel(`assignments-${company.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sick_reports' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [company.id, selectedDate]);

  async function loadData() {
    setLoading(true);
    try {
      const [assignRes, propRes, empRes, sickRes] = await Promise.all([
        supabase.from('assignments').select('*, employee:employees(*), property:properties(*)').eq('date', selectedDate).order('created_at'),
        supabase.from('properties').select('*').eq('company_id', company.id).order('name'),
        supabase.from('employees').select('*').eq('company_id', company.id),
        supabase.from('sick_reports').select('*').eq('date', selectedDate),
      ]);
      setAssignments((assignRes.data as unknown as AssignmentWithDetails[]) || []);
      setProperties(propRes.data || []);
      setEmployees(empRes.data || []);
      setSickReports(sickRes.data || []);
    } catch {
      // Component renders with existing state
    }
    setLoading(false);
  }

  const companyAssignments = useMemo(() => assignments.filter(a => a.property?.company_id === company.id), [assignments, company.id]);
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'active'), [employees]);
  const sickEmployeeIds = useMemo(() => new Set(sickReports.map(sr => sr.employee_id)), [sickReports]);

  const handleAddAssignment = async () => {
    if (!newPropertyId || !newDate || newEmployeeIds.length === 0) {
      addToast('Bitte alle Felder ausfüllen', 'error');
      return;
    }

    const prop = properties.find(p => p.id === newPropertyId);
    const timeFrom = newTimeFrom || null;
    const timeTo = newTimeTo || null;

    const resolvedFrom = timeFrom ?? prop?.time_from ?? null;
    const resolvedTo = timeTo ?? prop?.time_to ?? null;
    const duplicate = newEmployeeIds.some(eid =>
      companyAssignments.some(a =>
        a.property_id === newPropertyId &&
        a.employee_id === eid &&
        a.date === newDate &&
        (a.time_from ?? a.property?.time_from ?? null) === resolvedFrom &&
        (a.time_to ?? a.property?.time_to ?? null) === resolvedTo
      )
    );
    if (duplicate) {
      addToast('Für diesen Mitarbeiter existiert bereits ein Einsatz zu dieser Zeit', 'error');
      return;
    }

    setSaving(true);
    const inserts = newEmployeeIds.map(eid => ({
      property_id: newPropertyId,
      employee_id: eid,
      date: newDate,
      status: 'assigned',
      time_from: timeFrom,
      time_to: timeTo,
    }));
    const { error } = await supabase.from('assignments').insert(inserts);

    if (error) { addToast('Fehler beim Speichern', 'error'); setSaving(false); return; }

    if (prop) {
      const dateLabel = new Date(newDate).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeLabel = `${formatTime(timeFrom ?? prop.time_from)} – ${formatTime(timeTo ?? prop.time_to)} Uhr`;
      const pushTitle = `Neuer Einsatz: ${prop.name}`;
      const pushBody = `${dateLabel}, ${timeLabel}`;

      // Send push + in-app notification to each employee in parallel
      await Promise.all(
        newEmployeeIds.map(eid =>
          sendPushToEmployee(eid, pushTitle, pushBody, { type: 'new_assignment' })
        )
      );
    }

    setSaving(false); setAddModal(false);
    setNewPropertyId(''); setNewDate(new Date().toISOString().split('T')[0]); setNewEmployeeIds([]); setNewTimeFrom(''); setNewTimeTo('');
    onRefresh(); addToast('Einsatz erstellt und Mitarbeiter benachrichtigt');
  };

  const handleRemoveAssignment = async (assignment: AssignmentWithDetails) => {
    const { error } = await supabase.from('assignments').delete().eq('id', assignment.id);
    if (error) { addToast('Fehler beim Entfernen', 'error'); return; }
    setRemoveConfirm(null);
    const dateLabel = new Date(assignment.date + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    sendPushToEmployee(assignment.employee_id, 'Einsatz abgesagt', `${assignment.property.name} am ${dateLabel} wurde entfernt`, { type: 'info' });
    onRefresh(); addToast('Zuweisung entfernt');
  };

  const handleStatusChange = async (assignment: AssignmentWithDetails, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'checked_in') updates.checked_in_at = new Date().toISOString();
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    const { error } = await supabase.from('assignments').update(updates).eq('id', assignment.id);
    if (!error) onRefresh();
  };

  const toggleEmployee = (empId: string) => {
    setNewEmployeeIds(prev => prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]);
  };

  const selectedProperty = properties.find(p => p.id === newPropertyId);
  const employeesForProperty = activeEmployees;

  const statusLabel = (status: string) => {
    switch (status) {
      case 'assigned': return 'Zugewiesen';
      case 'checked_in': return 'Eingecheckt';
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const groupedAssignments = useMemo(() => {
    const groups: Record<string, { property: Property; assignments: AssignmentWithDetails[] }> = {};
    companyAssignments.forEach(a => {
      const timeFrom = a.time_from ?? a.property?.time_from ?? '';
      const timeTo = a.time_to ?? a.property?.time_to ?? '';
      const key = `${a.property_id}__${timeFrom}__${timeTo}`;
      if (!groups[key]) groups[key] = { property: a.property, assignments: [] };
      groups[key].assignments.push(a);
    });
    return Object.values(groups);
  }, [companyAssignments]);

  const dateNav = (direction: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Einsätze</h1>
        <button onClick={() => setAddModal(true)} className="btn-primary flex items-center justify-center gap-2">
          <Plus size={16} /> Einsatz erstellen
        </button>
      </div>

      {/* Date Navigation */}
      <div className="card p-2 mb-6">
        <div className="flex items-center gap-1.5">
          <button onClick={() => dateNav(-1)} className="p-2.5 rounded-xl hover:bg-[#F1F5F9] transition-colors text-[#64748B]">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-[#0F172A]">
              {new Date(selectedDate).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={() => dateNav(1)} className="p-2.5 rounded-xl hover:bg-[#F1F5F9] transition-colors text-[#64748B]">
            <ChevronRight size={18} />
          </button>
          {!isToday && (
            <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="px-3.5 py-2 rounded-xl text-sm font-semibold bg-[#0F172A] text-white hover:bg-[#334155] transition-colors ml-1">
              Heute
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" /></div>
      ) : groupedAssignments.length === 0 ? (
        <div className="card p-10 text-center">
          <Calendar size={36} className="text-[#CBD5E1] mx-auto mb-3" />
          <p className="text-sm text-[#94A3B8]">Keine Einsätze für diesen Tag</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedAssignments.map(({ property, assignments: propAssignments }) => {
            const firstA = propAssignments[0];
            const displayFrom = firstA?.time_from ?? property.time_from;
            const displayTo = firstA?.time_to ?? property.time_to;
            return (
            <div key={property.id} className="card">
              <div className="px-5 sm:px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
                <p className="text-sm font-semibold text-[#0F172A]">{property.name}</p>
                <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1.5"><MapPin size={12} className="text-[#94A3B8]" /> {property.address}</p>
                <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1.5"><Clock size={12} className="text-[#94A3B8]" /> {formatTime(displayFrom)} – {formatTime(displayTo)} Uhr</p>
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {propAssignments.map(a => {
                  const isSick = sickEmployeeIds.has(a.employee_id);
                  return (
                    <div key={a.id} className={`px-5 sm:px-6 py-4 flex items-center gap-3.5 ${isSick ? 'bg-[#FEF2F2]/30' : ''}`}>
                      <Avatar firstName={a.employee?.first_name || ''} lastName={a.employee?.last_name || ''} id={a.employee_id} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A]">
                          {a.employee?.first_name} {a.employee?.last_name}
                          {isSick && <span className="ml-2 text-[#EF4444] text-xs font-semibold">(krank)</span>}
                        </p>
                        {a.status === 'checked_in' && a.checked_in_at && (
                          <p className="text-[11px] text-[#94A3B8] mt-0.5 font-medium">Eingecheckt {new Date(a.checked_in_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</p>
                        )}
                        {a.status === 'completed' && a.completed_at && (
                          <p className="text-[11px] text-[#94A3B8] mt-0.5 font-medium">Fertiggestellt {new Date(a.completed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</p>
                        )}
                      </div>
                      {isSick ? (
                        <span className="badge-danger"><AlertTriangle size={11} /> Krank</span>
                      ) : (
                        <span className={
                          a.status === 'assigned' ? 'badge-info' :
                          a.status === 'checked_in' ? 'badge-success' :
                          a.status === 'completed' ? 'badge-neutral' :
                          'badge-danger'
                        }>{statusLabel(a.status)}</span>
                      )}
                      {a.status === 'assigned' && !isSick && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleStatusChange(a, 'checked_in')} className="p-1.5 rounded-lg hover:bg-[#F0FDF4] transition-colors text-[#22C55E]" title="Einchecken"><Check size={16} /></button>
                          <button onClick={() => setRemoveConfirm(a)} className="p-1.5 rounded-lg hover:bg-[#FEF2F2] transition-colors text-[#F87171]" title="Entfernen"><X size={16} /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );})}
        </div>
      )}

      {/* Add Assignment Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} width="max-w-md">
        <div className="p-8">
          <h2 className="text-lg font-bold text-[#0F172A] mb-6">Einsatz erstellen</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Datum</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Objekt <span className="text-[#EF4444]">*</span></label>
              <select value={newPropertyId} onChange={e => {
                setNewPropertyId(e.target.value);
                const prop = properties.find(p => p.id === e.target.value);
                if (prop) { setNewTimeFrom(prop.time_from); setNewTimeTo(prop.time_to); }
                else { setNewTimeFrom(''); setNewTimeTo(''); }
              }} className="input-field">
                <option value="">Objekt auswählen...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name} — {p.address}</option>)}
              </select>
            </div>
            {selectedProperty && (
              <div className="bg-[#F8FAFC] rounded-xl p-3.5 text-sm text-[#64748B]">
                <p className="flex items-center gap-1.5"><MapPin size={14} className="text-[#94A3B8]" /> {selectedProperty.address}</p>
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1"><label className="block text-sm font-medium text-[#0F172A] mb-1.5">Uhrzeit von</label><input type="time" value={newTimeFrom} onChange={e => setNewTimeFrom(e.target.value)} className="input-field" /></div>
              <div className="flex-1"><label className="block text-sm font-medium text-[#0F172A] mb-1.5">Uhrzeit bis</label><input type="time" value={newTimeTo} onChange={e => setNewTimeTo(e.target.value)} className="input-field" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">Mitarbeiter zuweisen</label>
              <div className="flex flex-wrap gap-2">
                {employeesForProperty.map(emp => (
                  <button key={emp.id} onClick={() => toggleEmployee(emp.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${newEmployeeIds.includes(emp.id) ? 'bg-[#22C55E] text-white shadow-sm' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'}`}>
                    {emp.first_name} {emp.last_name}
                  </button>
                ))}
                {employeesForProperty.length === 0 && <span className="text-sm text-[#94A3B8]">Keine aktiven Mitarbeiter</span>}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button onClick={() => setAddModal(false)} className="btn-ghost">Abbrechen</button>
            <button onClick={handleAddAssignment} disabled={saving || !newPropertyId || !newDate || newEmployeeIds.length === 0} className="btn-primary">
              {saving ? 'Wird erstellt...' : 'Einsatz erstellen'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Remove Confirmation */}
      <Modal open={!!removeConfirm} onClose={() => setRemoveConfirm(null)} width="max-w-sm">
        <div className="p-8">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mb-5">
            <AlertTriangle size={22} className="text-[#EF4444]" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] mb-2">Zuweisung entfernen?</h2>
          <p className="text-sm text-[#64748B] leading-relaxed mb-8">
            {removeConfirm && `${removeConfirm.employee.first_name} ${removeConfirm.employee.last_name} wird von ${removeConfirm.property.name} am ${new Date(removeConfirm.date).toLocaleDateString('de-DE')} entfernt.`}
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRemoveConfirm(null)} className="btn-ghost">Abbrechen</button>
            <button onClick={() => removeConfirm && handleRemoveAssignment(removeConfirm)} className="btn-danger">Entfernen</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
