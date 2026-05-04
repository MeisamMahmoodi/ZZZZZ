import { useState, useEffect } from 'react';
import { Clock, Check, CalendarDays, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/shared/Avatar';
import { formatTime } from '../../lib/utils';
import type { Employee, Property, Assignment, Company } from '../../lib/types';

interface TimestampsProps {
  company: Company;
  refreshKey: number;
  onRefresh: () => void;
}

interface AssignmentWithDetails extends Assignment {
  employee: Employee;
  property: Property;
}

export function Timestamps({ company, refreshKey }: TimestampsProps) {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => { loadData(); }, [company.id, refreshKey, selectedDate]);

  async function loadData() {
    try {
      const { data } = await supabase
        .from('assignments')
        .select('*, employee:employees(*), property:properties(*)')
        .eq('date', selectedDate)
        .order('checked_in_at', { ascending: true, nullsFirst: false });
      setAssignments((data as unknown as AssignmentWithDetails[]) || []);
    } catch {
      // Component renders with existing state
    }
  }

  const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  const withTimestamps = assignments.filter(a => a.checked_in_at || a.completed_at);
  const withoutTimestamps = assignments.filter(a => !a.checked_in_at && !a.completed_at && a.status !== 'cancelled');

  const checkedInCount = assignments.filter(a => a.status === 'checked_in').length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const assignedCount = assignments.filter(a => a.status === 'assigned').length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Zeitstempel</h1>
          <p className="text-[#64748B] text-sm mt-1.5">Check-in und Fertigstellungszeiten aller Mitarbeiter</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="input-field !w-auto"
        />
      </div>

      {/* Date label */}
      <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-5">{dateLabel}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="section-label mb-3">Eingecheckt</p>
          <p className="text-2xl font-bold text-[#3B82F6]">{checkedInCount}</p>
          <p className="text-xs text-[#94A3B8] mt-2">aktiv</p>
        </div>
        <div className="card p-5">
          <p className="section-label mb-3">Fertig</p>
          <p className="text-2xl font-bold text-[#22C55E]">{completedCount}</p>
          <p className="text-xs text-[#94A3B8] mt-2">abgeschlossen</p>
        </div>
        <div className="card p-5">
          <p className="section-label mb-3">Ausstehend</p>
          <p className="text-2xl font-bold text-[#0F172A]">{assignedCount}</p>
          <p className="text-xs text-[#94A3B8] mt-2">noch nicht da</p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarDays size={40} className="text-[#CBD5E1] mx-auto mb-4" />
          <p className="text-sm text-[#94A3B8]">Keine Einsaetze fuer diesen Tag</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Assignments with timestamps */}
          {withTimestamps.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Zeitstempel erfasst</h2>
              <div className="card divide-y divide-[#F1F5F9]">
                {withTimestamps
                  .sort((a, b) => {
                    const tA = a.completed_at || a.checked_in_at || '';
                    const tB = b.completed_at || b.checked_in_at || '';
                    return tA.localeCompare(tB);
                  })
                  .map(a => (
                    <div key={a.id} className="px-5 sm:px-6 py-4 flex items-start gap-4">
                      <Avatar firstName={a.employee?.first_name || ''} lastName={a.employee?.last_name || ''} id={a.employee_id} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {a.employee?.first_name} {a.employee?.last_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin size={11} className="text-[#94A3B8]" />
                          <p className="text-xs text-[#64748B]">{a.property?.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock size={11} className="text-[#94A3B8]" />
                          <p className="text-xs text-[#64748B]">
                            {formatTime(a.property?.time_from || '')} – {formatTime(a.property?.time_to || '')} Uhr
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right space-y-1.5">
                        {a.checked_in_at && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Clock size={12} className="text-[#3B82F6]" />
                            <span className="text-xs font-semibold text-[#0F172A]">
                              {new Date(a.checked_in_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] text-[#94A3B8] w-14">Check-in</span>
                          </div>
                        )}
                        {a.completed_at && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Check size={12} className="text-[#22C55E]" />
                            <span className="text-xs font-semibold text-[#0F172A]">
                              {new Date(a.completed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] text-[#94A3B8] w-14">Fertig</span>
                          </div>
                        )}
                        {a.checked_in_at && a.completed_at && (() => {
                          const diffMs = new Date(a.completed_at).getTime() - new Date(a.checked_in_at).getTime();
                          const diffMin = Math.round(diffMs / 60000);
                          const h = Math.floor(diffMin / 60);
                          const m = diffMin % 60;
                          return (
                            <p className="text-[10px] text-[#94A3B8] text-right">
                              {h > 0 ? `${h}h ` : ''}{m}min Dauer
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Assignments without timestamps */}
          {withoutTimestamps.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Noch kein Check-in</h2>
              <div className="card divide-y divide-[#F1F5F9]">
                {withoutTimestamps.map(a => (
                  <div key={a.id} className="px-5 sm:px-6 py-4 flex items-center gap-4">
                    <Avatar firstName={a.employee?.first_name || ''} lastName={a.employee?.last_name || ''} id={a.employee_id} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {a.employee?.first_name} {a.employee?.last_name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin size={11} className="text-[#94A3B8]" />
                        <p className="text-xs text-[#64748B]">{a.property?.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={11} className="text-[#94A3B8]" />
                        <p className="text-xs text-[#64748B]">
                          {formatTime(a.property?.time_from || '')} – {formatTime(a.property?.time_to || '')} Uhr
                        </p>
                      </div>
                    </div>
                    <span className="badge-neutral text-[10px] shrink-0">Ausstehend</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
