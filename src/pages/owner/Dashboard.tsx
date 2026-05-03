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

  // Deduplicate sick reports by employee_id (one card per employee, showing all assignments)
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
  // Count sick employees who still need replacement (no replacement assigned)
  const openSickCount = sickReportsByEmployee.filter(sr => {
    const empAssignments = todayAssignments.filter(a => a.employee_id === sr.employee_id);
    if (empAssignments.length === 0) return false; // no assignments = not "open"
    const hasReplacement = empAssignments.some(a => todayAssignments.some(ta => ta.property_id === a.property_id && ta.employee_id !== sr.employee_id));
    return !hasReplacement;
  }).length;

  // Count sick employees with replacement found
  const coveredSickCount = sickReportsByEmployee.filter(sr => {
    const empAssignments = todayAssignments.filter(a => a.employee_id === sr.employee_id);
    if (empAssignments.length === 0) return false;
    const hasReplacement = empAssignments.some(a => todayAssignments.some(ta => ta.property_id === a.property_id && ta.employee_id !== sr.employee_id));
    return hasReplacement;
  }).length;

  // Sick employees who have assignments today (most critical) - deduplicated by employee
  const sickWithAssignments = useMemo(() => {
    return sickReportsByEmployee
      .map(sr => {
        const empAssignments = todayAssignments.filter(a => a.employee_id === sr.employee_id);
        const hasReplacement = empAssignments.some(a => todayAssignments.some(ta => ta.property_id === a.property_id && ta.employee_id !== sr.employee_id));
        return { sickReport: sr, assignments: empAssignments, hasReplacement };
      })
      .filter(item => item.assignments.length > 0);
  }, [sickReportsByEmployee, todayAssignments]);

  // Sick employees without assignments
  const sickWithoutAssignments = useMemo(() => {
    return sickReportsByEmployee
      .filter(sr => !todayAssignments.some(a => a.employee_id === sr.employee_id))
      .map(sr => ({ sickReport: sr }));
  }, [sickReportsByEmployee, todayAssignments]);

  // Properties with assignments today (from actual assignments, not just cleaning_days)
  const propertiesWithAssignments = useMemo(() => {
    const propIds = new Set(todayAssignments.map(a => a.property_id));
    return properties.filter(p => propIds.has(p.id));
  }, [todayAssignments, properties]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
            {getGreeting()}, {company.owner_name.split(' ')[0]}
          </h1>
          <p className="text-[#64748B] text-sm mt-1">{formatDateLong(today)}</p>
          {isWeekend && (
            <p className="text-xs text-[#F97316] mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> Wochenende — ggf. keine regulären Einsätze
            </p>
          )}
        </div>
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell size={20} className="text-[#64748B]" />
            {sickCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#EF4444] rounded-full text-white text-[10px] flex items-center justify-center font-bold">{sickCount}</span>}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-30 w-72 sm:w-80 max-h-80 overflow-y-auto">
              <div className="px-4 py-2 border-b border-gray-100"><p className="text-sm font-semibold text-[#0F172A]">Benachrichtigungen</p></div>
              {sickReportsForCompany.length === 0 ? (
                <div className="px-4 py-6 text-center"><p className="text-sm text-[#64748B]">Keine Benachrichtigungen</p></div>
              ) : (
                sickReportsForCompany.map(sr => (
                  <div key={sr.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-[#EF4444] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A]">{sr.employee?.first_name} {sr.employee?.last_name} ist krank</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{new Date(sr.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}{sr.reason ? ` — ${sr.reason}` : ''}</p>
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
          <h2 className="text-base sm:text-lg font-bold text-[#EF4444] mb-4 flex items-center gap-2">
            <AlertTriangle size={22} /> KRANKMELDUNGEN MIT EINSATZ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sickWithAssignments.map(({ sickReport: sr, assignments: empAssignments, hasReplacement }) => (
              <div key={sr.employee_id} className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <Avatar firstName={sr.employee?.first_name || ''} lastName={sr.employee?.last_name || ''} id={sr.employee_id} size="lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-[#0F172A]">{sr.employee?.first_name} {sr.employee?.last_name}</p>
                    <p className="text-sm text-[#EF4444] font-bold mt-0.5">KRANKGEMELDET</p>
                    {sr.reason && <p className="text-sm text-[#64748B] mt-1">Grund: {sr.reason}</p>}
                    {empAssignments.map(a => (
                      <div key={a.id} className="mt-3 bg-white/60 rounded-lg p-3">
                        <p className="text-sm font-semibold text-[#0F172A] flex items-center gap-1.5"><MapPin size={14} /> {a.property?.name}</p>
                        <p className="text-[13px] text-[#64748B] mt-0.5 flex items-center gap-1.5"><Clock size={13} /> {formatTime(a.property?.time_from || '')} – {formatTime(a.property?.time_to || '')} Uhr</p>
                      </div>
                    ))}
                  </div>
                </div>
                {!hasReplacement && (
                  <button onClick={() => handleFindReplacement(sr)} className="w-full mt-4 py-3 rounded-xl text-sm font-bold bg-[#EF4444] text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                    <Search size={16} /> ERSATZ FINDEN
                  </button>
                )}
                {hasReplacement && (
                  <div className="mt-4 py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-[#22C55E] text-center flex items-center justify-center gap-2">
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
          <h2 className="text-base sm:text-lg font-bold text-[#F97316] mb-4 flex items-center gap-2">
            <AlertTriangle size={20} /> Krankmeldungen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sickWithoutAssignments.map(({ sickReport: sr }) => (
              <div key={sr.employee_id} className="bg-[#FEF2F2] border-2 border-[#FECACA] rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <Avatar firstName={sr.employee?.first_name || ''} lastName={sr.employee?.last_name || ''} id={sr.employee_id} size="lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-[#0F172A]">{sr.employee?.first_name} {sr.employee?.last_name}</p>
                    <p className="text-sm text-[#F97316] font-medium mt-0.5">Krankgemeldet</p>
                    {sr.reason && <p className="text-sm text-[#64748B] mt-1">Grund: {sr.reason}</p>}
                    <p className="text-sm text-[#64748B] mt-2">Kein Einsatz heute</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <p className="text-[11px] text-[#64748B] uppercase tracking-wider font-medium mb-2 sm:mb-3">Mitarbeiter</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#0F172A]">{activeEmployees.length}<span className="text-base font-normal text-[#64748B]"> / {companyEmployees.length}</span></p>
          {sickCount > 0 ? <p className="text-xs sm:text-sm text-[#F97316] mt-1 sm:mt-2 font-medium">{sickCount} krank</p> : <p className="text-xs sm:text-sm text-[#22C55E] mt-1 sm:mt-2">Alle verfügbar</p>}
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <p className="text-[11px] text-[#64748B] uppercase tracking-wider font-medium mb-2 sm:mb-3">Einsätze heute</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#0F172A]">{todayAssignments.length}</p>
          {todayAssignments.length > 0 ? <p className="text-xs sm:text-sm text-[#22C55E] mt-1 sm:mt-2">{propertiesWithAssignments.length} Objekte</p> : <p className="text-xs sm:text-sm text-[#64748B] mt-1 sm:mt-2">Keine Einsätze</p>}
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] col-span-2 lg:col-span-1">
          <p className="text-[11px] text-[#64748B] uppercase tracking-wider font-medium mb-2 sm:mb-3">Krankmeldungen</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#0F172A]">{sickCount}</p>
          {openSickCount > 0 ? (
            <p className="text-xs sm:text-sm text-[#EF4444] mt-1 sm:mt-2 font-medium">{openSickCount} Ersatz fehlt</p>
          ) : coveredSickCount > 0 ? (
            <p className="text-xs sm:text-sm text-[#22C55E] mt-1 sm:mt-2">{coveredSickCount} mit Ersatz</p>
          ) : (
            <p className="text-xs sm:text-sm text-[#22C55E] mt-1 sm:mt-2">Alles erledigt</p>
          )}
        </div>
      </div>

      {/* Today's Assignments - from actual assignments data */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0F172A]">Heutige Einsätze</h2>
          <span className="text-sm text-[#64748B]">{today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        </div>

        {todayAssignments.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <CalendarDays size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-[#64748B]">Keine Einsätze für heute</p>
          </div>
        ) : (
          <div className="space-y-3">
            {propertiesWithAssignments.map(prop => {
              const propAssignments = getPropertyAssignments(prop.id);
              const hasSick = hasSickEmployeeForProperty(prop.id);
              const sickForProp = sickReportsForCompany.filter(sr => propAssignments.some(a => a.employee_id === sr.employee_id));
              const activeAssignments = propAssignments.filter(a => !sickReportsForCompany.some(sr => sr.employee_id === a.employee_id));

              let statusColor = 'bg-gray-300';
              if (hasSick && activeAssignments.length === 0) statusColor = 'bg-[#EF4444]';
              else if (propAssignments.length > 0 && !hasSick) statusColor = 'bg-[#22C55E]';
              else if (hasSick) statusColor = 'bg-[#F97316]';

              return (
                <div key={prop.id} className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                    <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${statusColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-bold text-[#0F172A]">{prop.name}</p>
                      <p className="text-[13px] text-[#64748B] mt-1 flex items-center gap-1.5"><MapPin size={13} /> {prop.address}</p>
                      <p className="text-[13px] text-[#64748B] mt-0.5 flex items-center gap-1.5"><Clock size={13} /> {formatTime(prop.time_from)} – {formatTime(prop.time_to)} Uhr</p>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {activeAssignments.map(a => (
                          <span key={a.id} className="text-[13px] text-[#64748B] flex items-center gap-1"><User size={13} /> {a.employee?.first_name} {a.employee?.last_name?.charAt(0)}.</span>
                        ))}
                        {sickForProp.map(sr => (
                          <span key={sr.id} className="text-[13px] text-[#EF4444] font-medium flex items-center gap-1"><User size={13} /> {sr.employee?.first_name} {sr.employee?.last_name?.charAt(0)}. (krank)</span>
                        ))}
                        {activeAssignments.length === 0 && !hasSick && <span className="text-[13px] text-[#64748B]">Kein Personal zugewiesen</span>}
                        {hasSick && activeAssignments.length === 0 && <span className="text-[13px] text-[#EF4444] font-medium">Ersatz fehlt noch</span>}
                      </div>
                    </div>
                    {hasSick && activeAssignments.length === 0 && sickForProp.length > 0 && (
                      <button onClick={() => handleFindReplacement(sickForProp[0])} className="bg-[#EF4444] text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors shrink-0">
                        <span className="hidden sm:inline">Ersatz finden</span><span className="sm:hidden">Ersatz</span>
                      </button>
                    )}
                  </div>
                  {propAssignments.length > 0 && (
                    <div className="border-t border-gray-50 divide-y divide-gray-50">
                      {propAssignments.map(a => {
                        const isSick = sickReportsForCompany.some(sr => sr.employee_id === a.employee_id);
                        return (
                          <div key={a.id} className={`px-4 sm:px-5 py-2.5 flex items-center gap-3 ${isSick ? 'bg-red-50/50' : ''}`}>
                            <Avatar firstName={a.employee?.first_name || ''} lastName={a.employee?.last_name || ''} id={a.employee_id} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#0F172A]">{a.employee?.first_name} {a.employee?.last_name}</p>
                            </div>
                            {isSick && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-[#EF4444]">Krank</span>
                            )}
                            {!isSick && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                a.status === 'checked_in' ? 'bg-green-50 text-[#22C55E]' :
                                a.status === 'completed' ? 'bg-gray-100 text-[#64748B]' :
                                'bg-blue-50 text-blue-600'
                              }`}>
                                {a.status === 'checked_in' ? 'Eingecheckt' : a.status === 'completed' ? 'Fertig' : 'Zugewiesen'}
                              </span>
                            )}
                            {a.status === 'assigned' && !isSick && (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleCheckIn(a.id)} className="p-1 rounded hover:bg-green-50 transition-colors text-[#22C55E]" title="Einchecken"><Check size={14} /></button>
                                <button onClick={() => handleRemoveAssignment(a.id)} className="p-1 rounded hover:bg-red-50 transition-colors text-[#EF4444]" title="Entfernen"><X size={14} /></button>
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
