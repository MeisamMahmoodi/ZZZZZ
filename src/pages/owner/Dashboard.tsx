import { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, AlertTriangle, MapPin, User, Clock, Search, UserCheck, X, Check, CalendarDays, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDateLong, formatTime, getTodayDayAbbrev } from '../../lib/utils';
import type { Employee, Property, Assignment, SickReport, EmployeeProperty } from '../../lib/types';
import { ReplacementModal } from '../../components/owner/ReplacementModal';
import { Avatar } from '../../components/shared/Avatar';
import { useToast } from '../../components/shared/Toast';
import type { Company } from '../../lib/types';

interface DashboardProps {
  company: Company;
  refreshKey: number;
  onRefresh: () => void;
}

interface SickReportWithEmployee extends SickReport {
  employee: Employee;
}

interface AssignmentWithDetails extends Assignment {
  employee: Employee;
  property: Property;
}

export function Dashboard({ company, refreshKey, onRefresh }: DashboardProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [sickReports, setSickReports] = useState<SickReportWithEmployee[]>([]);
  const [employeeProperties, setEmployeeProperties] = useState<EmployeeProperty[]>([]);
  const [replacementModal, setReplacementModal] = useState<{ sickReport: SickReportWithEmployee; property: Property; assignment: AssignmentWithDetails } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayDay = getTodayDayAbbrev();
  const isWeekend = todayDay === 'Sa' || todayDay === 'So';

  useEffect(() => { loadData(); }, [company.id, refreshKey]);

  async function loadData() {
    try {
      const [empRes, propRes, assignRes, sickRes, epRes] = await Promise.all([
        supabase.from('employees').select('*').eq('company_id', company.id),
        supabase.from('properties').select('*').eq('company_id', company.id),
        supabase.from('assignments').select('*, employee:employees(*), property:properties(*)').eq('date', todayStr),
        supabase.from('sick_reports').select('*, employee:employees(*)').eq('date', todayStr),
        supabase.from('employee_properties').select('*'),
      ]);
      setEmployees(empRes.data || []);
      setProperties(propRes.data || []);
      setAssignments((assignRes.data as unknown as AssignmentWithDetails[]) || []);
      setSickReports((sickRes.data as unknown as SickReportWithEmployee[]) || []);
      setEmployeeProperties(epRes.data || []);
    } catch {
      // Component renders with existing state
    }
  }

  const companyEmployees = useMemo(() => employees.filter(e => e.company_id === company.id), [employees, company.id]);
  const sickEmployees = useMemo(() => companyEmployees.filter(e => e.status === 'sick'), [companyEmployees]);
  const activeEmployees = useMemo(() => companyEmployees.filter(e => e.status === 'active'), [companyEmployees]);
  const todayAssignments = useMemo(() => assignments.filter(a => a.property?.company_id === company.id), [assignments, company.id]);
  const sickReportsForCompany = useMemo(() => sickReports.filter(sr => sr.employee?.company_id === company.id), [sickReports, company.id]);

  const sickReportsByEmployee = useMemo(() => {
    const map = new Map<string, SickReportWithEmployee>();
    sickReportsForCompany.forEach(sr => {
      if (!map.has(sr.employee_id)) map.set(sr.employee_id, sr);
    });
    return Array.from(map.values());
  }, [sickReportsForCompany]);

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const getPropertyAssignments = (propertyId: string) =>
    todayAssignments.filter(a => a.property_id === propertyId && a.status !== 'cancelled');

  const hasSickEmployeeForProperty = (propertyId: string) =>
    sickReportsForCompany.some(sr => todayAssignments.some(a => a.employee_id === sr.employee_id && a.property_id === propertyId));

  const handleFindReplacement = (sickReport: SickReportWithEmployee) => {
    const affectedAssignment = todayAssignments.find(a => a.employee_id === sickReport.employee_id);
    if (!affectedAssignment) return;
    const prop = properties.find(p => p.id === affectedAssignment.property_id);
    if (!prop) return;
    setReplacementModal({ sickReport, property: prop, assignment: affectedAssignment });
  };

  const handleReplacementComplete = () => {
    setReplacementModal(null);
    onRefresh();
    addToast('Ersatz wurde benachrichtigt');
  };

  const handleRemoveAssignment = async (id: string) => {
    if (!confirm('Zuweisung wirklich entfernen?')) return;
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) { addToast('Fehler beim Entfernen', 'error'); return; }
    onRefresh();
    addToast('Zuweisung entfernt');
  };

  const handleCheckIn = async (id: string) => {
    const { error } = await supabase.from('assignments').update({ status: 'checked_in' }).eq('id', id);
    if (!error) onRefresh();
  };

  const sickCount = sickEmployees.length;
  const openSickCount = sickReportsByEmployee.filter(sr => {
    const empAssignments = todayAssignments.filter(a => a.employee_id === sr.employee_id);
    if (empAssignments.length === 0) return false;
    const hasReplacement = empAssignments.some(a => todayAssignments.some(ta => ta.property_id === a.property_id && ta.employee_id !== sr.employee_id));
    return !hasReplacement;
  }).length;

  const coveredSickCount = sickReportsByEmployee.filter(sr => {
    const empAssignments = todayAssignments.filter(a => a.employee_id === sr.employee_id);
    if (empAssignments.length === 0) return false;
    const hasReplacement = empAssignments.some(a => todayAssignments.some(ta => ta.property_id === a.property_id && ta.employee_id !== sr.employee_id));
    return hasReplacement;
  }).length;

  const sickWithAssignments = useMemo(() => {
    return sickReportsByEmployee
      .map(sr => {
        const empAssignments = todayAssignments.filter(a => a.employee_id === sr.employee_id);
        const hasReplacement = empAssignments.some(a => todayAssignments.some(ta => ta.property_id === a.property_id && ta.employee_id !== sr.employee_id));
        return { sickReport: sr, assignments: empAssignments, hasReplacement };
      })
      .filter(item => item.assignments.length > 0);
  }, [sickReportsByEmployee, todayAssignments]);

  const sickWithoutAssignments = useMemo(() => {
    return sickReportsByEmployee
      .filter(sr => !todayAssignments.some(a => a.employee_id === sr.employee_id))
      .map(sr => ({ sickReport: sr }));
  }, [sickReportsByEmployee, todayAssignments]);

  const propertiesWithAssignments = useMemo(() => {
    const propIds = new Set(todayAssignments.map(a => a.property_id));
    return properties.filter(p => propIds.has(p.id));
  }, [todayAssignments, properties]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-ink-900 tracking-tight">
            {getGreeting()}, {company.owner_name.split(' ')[0]}
          </h1>
          <p className="text-ink-500 text-sm mt-1.5">{formatDateLong(today)}</p>
          {isWeekend && (
            <p className="text-xs text-warning-500 mt-1.5 flex items-center gap-1.5 font-medium">
              <AlertCircle size={13} /> Wochenende — ggf. keine regulären Einsätze
            </p>
          )}
        </div>
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 rounded-xl hover:bg-surface-100 transition-colors">
            <Bell size={20} className="text-ink-500" />
            {sickCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-danger-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold px-1">{sickCount}</span>}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 bg-surface-0 rounded-xl shadow-elevated border border-surface-200/60 py-1 z-30 w-80 max-h-80 overflow-y-auto animate-scale-in">
              <div className="px-4 py-3 border-b border-surface-100"><p className="text-sm font-semibold text-ink-900">Benachrichtigungen</p></div>
              {sickReportsForCompany.length === 0 ? (
                <div className="px-4 py-8 text-center"><p className="text-sm text-ink-300">Keine Benachrichtigungen</p></div>
              ) : (
                sickReportsForCompany.map(sr => (
                  <div key={sr.id} className="px-4 py-3 hover:bg-surface-50 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={15} className="text-danger-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-900">{sr.employee?.first_name} {sr.employee?.last_name} ist krank</p>
                        <p className="text-xs text-ink-300 mt-0.5">{new Date(sr.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}{sr.reason ? ` — ${sr.reason}` : ''}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* CRITICAL: Sick employees WITH assignments */}
      {sickWithAssignments.length > 0 && (
        <div className="mb-8">
          <h2 className="section-label text-danger-500 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} /> Krankmeldungen mit Einsatz
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sickWithAssignments.map(({ sickReport: sr, assignments: empAssignments, hasReplacement }) => (
              <div key={sr.employee_id} className="bg-danger-50 border border-danger-200/60 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <Avatar firstName={sr.employee?.first_name || ''} lastName={sr.employee?.last_name || ''} id={sr.employee_id} size="lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-ink-900">{sr.employee?.first_name} {sr.employee?.last_name}</p>
                    <span className="badge-danger mt-1.5">Krankgemeldet</span>
                    {sr.reason && <p className="text-sm text-ink-500 mt-2">Grund: {sr.reason}</p>}
                    {empAssignments.map(a => (
                      <div key={a.id} className="mt-3 bg-white/70 rounded-xl p-3">
                        <p className="text-sm font-semibold text-ink-900 flex items-center gap-1.5"><MapPin size={14} className="text-ink-300" /> {a.property?.name}</p>
                        <p className="text-[13px] text-ink-500 mt-0.5 flex items-center gap-1.5"><Clock size={13} className="text-ink-300" /> {formatTime(a.property?.time_from || '')} – {formatTime(a.property?.time_to || '')} Uhr</p>
                      </div>
                    ))}
                  </div>
                </div>
                {!hasReplacement && (
                  <button onClick={() => handleFindReplacement(sr)} className="w-full mt-5 py-3 rounded-xl text-sm font-semibold bg-danger-500 text-white hover:bg-danger-600 transition-colors flex items-center justify-center gap-2">
                    <Search size={16} /> Ersatz finden
                  </button>
                )}
                {hasReplacement && (
                  <div className="mt-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-50 text-brand-600 text-center flex items-center justify-center gap-2">
                    <UserCheck size={16} /> Ersatz gefunden
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sick employees WITHOUT assignments */}
      {sickWithoutAssignments.length > 0 && (
        <div className="mb-8">
          <h2 className="section-label text-warning-500 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} /> Krankmeldungen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sickWithoutAssignments.map(({ sickReport: sr }) => (
              <div key={sr.employee_id} className="bg-warning-50 border border-warning-100 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <Avatar firstName={sr.employee?.first_name || ''} lastName={sr.employee?.last_name || ''} id={sr.employee_id} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-ink-900">{sr.employee?.first_name} {sr.employee?.last_name}</p>
                    <span className="badge-warning mt-1.5">Krankgemeldet</span>
                    {sr.reason && <p className="text-sm text-ink-500 mt-1.5">Grund: {sr.reason}</p>}
                    <p className="text-sm text-ink-300 mt-2">Kein Einsatz heute</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 sm:p-6">
          <p className="section-label mb-3">Mitarbeiter</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-ink-900">{activeEmployees.length}</p>
            <span className="text-lg text-ink-300 font-normal">/</span>
            <span className="text-lg text-ink-300 font-normal">{companyEmployees.length}</span>
          </div>
          <p className="text-sm text-ink-300 mt-2">verfügbar</p>
          {sickCount > 0 && <p className="text-xs text-warning-500 font-semibold mt-1">{sickCount} krank</p>}
        </div>
        <div className="card p-5 sm:p-6">
          <p className="section-label mb-3">Einsätze heute</p>
          <p className="text-3xl font-bold text-ink-900">{todayAssignments.length}</p>
          {todayAssignments.length > 0 ? (
            <p className="text-sm text-brand-600 font-medium mt-2">{propertiesWithAssignments.length} Objekte</p>
          ) : (
            <p className="text-sm text-ink-300 mt-2">Keine Einsätze</p>
          )}
        </div>
        <div className="card p-5 sm:p-6 col-span-2 lg:col-span-1">
          <p className="section-label mb-3">Krankmeldungen</p>
          <p className="text-3xl font-bold text-ink-900">{sickCount}</p>
          {openSickCount > 0 ? (
            <p className="text-sm text-danger-500 font-semibold mt-2">{openSickCount} Ersatz fehlt</p>
          ) : coveredSickCount > 0 ? (
            <p className="text-sm text-brand-600 font-medium mt-2">{coveredSickCount} mit Ersatz</p>
          ) : (
            <p className="text-sm text-brand-600 font-medium mt-2">Alles erledigt</p>
          )}
        </div>
      </div>

      {/* Today's Assignments */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-ink-900">Heutige Einsätze</h2>
          <span className="text-sm text-ink-300 font-medium">{today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        </div>

        {todayAssignments.length === 0 ? (
          <div className="card p-10 text-center">
            <CalendarDays size={36} className="text-ink-100 mx-auto mb-3" />
            <p className="text-ink-300 text-sm">Keine Einsätze für heute</p>
          </div>
        ) : (
          <div className="space-y-4">
            {propertiesWithAssignments.map(prop => {
              const propAssignments = getPropertyAssignments(prop.id);
              const hasSick = hasSickEmployeeForProperty(prop.id);
              const sickForProp = sickReportsForCompany.filter(sr => propAssignments.some(a => a.employee_id === sr.employee_id));
              const activeAssignments = propAssignments.filter(a => !sickReportsForCompany.some(sr => sr.employee_id === a.employee_id));

              let statusColor = 'bg-ink-100';
              if (hasSick && activeAssignments.length === 0) statusColor = 'bg-danger-400';
              else if (propAssignments.length > 0 && !hasSick) statusColor = 'bg-brand-500';
              else if (hasSick) statusColor = 'bg-warning-400';

              return (
                <div key={prop.id} className="card overflow-hidden">
                  <div className="p-5 sm:p-6 flex items-start gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${statusColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-ink-900">{prop.name}</p>
                      <p className="text-[13px] text-ink-500 mt-1 flex items-center gap-1.5"><MapPin size={13} className="text-ink-300" /> {prop.address}</p>
                      <p className="text-[13px] text-ink-500 mt-0.5 flex items-center gap-1.5"><Clock size={13} className="text-ink-300" /> {formatTime(prop.time_from)} – {formatTime(prop.time_to)} Uhr</p>
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {activeAssignments.map(a => (
                          <span key={a.id} className="badge-neutral"><User size={12} /> {a.employee?.first_name} {a.employee?.last_name?.charAt(0)}.</span>
                        ))}
                        {sickForProp.map(sr => (
                          <span key={sr.id} className="badge-danger"><User size={12} /> {sr.employee?.first_name} {sr.employee?.last_name?.charAt(0)}. (krank)</span>
                        ))}
                        {activeAssignments.length === 0 && !hasSick && <span className="text-[13px] text-ink-300">Kein Personal zugewiesen</span>}
                        {hasSick && activeAssignments.length === 0 && <span className="text-[13px] text-danger-500 font-semibold">Ersatz fehlt noch</span>}
                      </div>
                    </div>
                    {hasSick && activeAssignments.length === 0 && sickForProp.length > 0 && (
                      <button onClick={() => handleFindReplacement(sickForProp[0])} className="bg-danger-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-danger-600 transition-colors shrink-0">
                        <span className="hidden sm:inline">Ersatz finden</span><span className="sm:hidden">Ersatz</span>
                      </button>
                    )}
                  </div>
                  {propAssignments.length > 0 && (
                    <div className="border-t border-surface-100 divide-y divide-surface-100">
                      {propAssignments.map(a => {
                        const isSick = sickReportsForCompany.some(sr => sr.employee_id === a.employee_id);
                        return (
                          <div key={a.id} className={`px-5 sm:px-6 py-3.5 flex items-center gap-3 ${isSick ? 'bg-danger-50/40' : ''}`}>
                            <Avatar firstName={a.employee?.first_name || ''} lastName={a.employee?.last_name || ''} id={a.employee_id} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-ink-900">{a.employee?.first_name} {a.employee?.last_name}</p>
                            </div>
                            {isSick && <span className="badge-danger">Krank</span>}
                            {!isSick && (
                              <span className={
                                a.status === 'checked_in' ? 'badge-success' :
                                a.status === 'completed' ? 'badge-neutral' :
                                'badge-info'
                              }>
                                {a.status === 'checked_in' ? 'Eingecheckt' : a.status === 'completed' ? 'Fertig' : 'Zugewiesen'}
                              </span>
                            )}
                            {a.status === 'assigned' && !isSick && (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleCheckIn(a.id)} className="p-1.5 rounded-lg hover:bg-brand-50 transition-colors text-brand-500" title="Einchecken"><Check size={15} /></button>
                                <button onClick={() => handleRemoveAssignment(a.id)} className="p-1.5 rounded-lg hover:bg-danger-50 transition-colors text-danger-400" title="Entfernen"><X size={15} /></button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {replacementModal && (
        <ReplacementModal
          sickReport={replacementModal.sickReport}
          property={replacementModal.property}
          employees={companyEmployees}
          employeeProperties={employeeProperties}
          assignments={todayAssignments}
          onClose={() => setReplacementModal(null)}
          onComplete={handleReplacementComplete}
        />
      )}
    </div>
  );
}
