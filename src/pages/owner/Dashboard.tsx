import { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, AlertTriangle, MapPin, User, Clock, Search, UserCheck, X, Check, CalendarDays, AlertCircle, Euro, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDateLong, formatTime, getTodayDayAbbrev } from '../../lib/utils';
import type { Employee, Property, Assignment, SickReport, EmployeeProperty } from '../../lib/types';
import { ReplacementModal } from '../../components/owner/ReplacementModal';
import { Modal } from '../../components/shared/Modal';
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
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [monthAssignments, setMonthAssignments] = useState<AssignmentWithDetails[]>([]);
  const [defaultWage, setDefaultWage] = useState('');
  const [wageModal, setWageModal] = useState(false);
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
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      const [empRes, propRes, assignRes, sickRes, epRes, monthRes] = await Promise.all([
        supabase.from('employees').select('*').eq('company_id', company.id),
        supabase.from('properties').select('*').eq('company_id', company.id),
        supabase.from('assignments').select('*, employee:employees(*), property:properties(*)').eq('date', todayStr),
        supabase.from('sick_reports').select('*, employee:employees(*)').eq('date', todayStr),
        supabase.from('employee_properties').select('*'),
        supabase.from('assignments').select('*, employee:employees(*), property:properties(*)').gte('date', monthStart).lte('date', todayStr),
      ]);
      setEmployees(empRes.data || []);
      setProperties(propRes.data || []);
      setAssignments((assignRes.data as unknown as AssignmentWithDetails[]) || []);
      setSickReports((sickRes.data as unknown as SickReportWithEmployee[]) || []);
      setEmployeeProperties(epRes.data || []);
      setMonthAssignments((monthRes.data as unknown as AssignmentWithDetails[]) || []);
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
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) { addToast('Fehler beim Entfernen', 'error'); return; }
    setRemoveConfirm(null);
    onRefresh();
    addToast('Zuweisung entfernt');
  };

  const handleCheckIn = async (id: string) => {
    const { error } = await supabase.from('assignments').update({ status: 'checked_in', checked_in_at: new Date().toISOString() }).eq('id', id);
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

  const payrollData = useMemo(() => {
    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysPassed = today.getDate();

    const employeeMap = new Map<string, {
      employee: Employee;
      totalMinutes: number;
      expectedMinutes: number;
      assignments: AssignmentWithDetails[];
    }>();

    for (const emp of employees) {
      employeeMap.set(emp.id, { employee: emp, totalMinutes: 0, expectedMinutes: 0, assignments: [] });
    }

    for (const a of monthAssignments) {
      const entry = employeeMap.get(a.employee_id);
      if (!entry) continue;
      entry.assignments.push(a);

      const prop = a.property;
      if (!prop) continue;

      const [fromH, fromM] = prop.time_from.split(':').map(Number);
      const [toH, toM] = prop.time_to.split(':').map(Number);
      const durationMin = (toH * 60 + toM) - (fromH * 60 + fromM);

      if (a.status === 'completed' || a.status === 'checked_in') {
        entry.totalMinutes += durationMin;
      }
    }

    // Calculate expected hours based on assigned properties' cleaning days
    for (const emp of employees) {
      const entry = employeeMap.get(emp.id);
      if (!entry) continue;
      const empProps = employeeProperties.filter(ep => ep.employee_id === emp.id);
      for (const ep of empProps) {
        const prop = properties.find(p => p.id === ep.property_id);
        if (!prop) continue;
        const [fromH, fromM] = prop.time_from.split(':').map(Number);
        const [toH, toM] = prop.time_to.split(':').map(Number);
        const durationMin = (toH * 60 + toM) - (fromH * 60 + fromM);
        const daysPerWeek = prop.cleaning_days.length;
        // Count how many of those cleaning days have passed this month
        let workDaysThisMonth = 0;
        for (let d = 1; d <= daysPassed; d++) {
          const date = new Date(today.getFullYear(), today.getMonth(), d);
          const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
          if (prop.cleaning_days.includes(dayNames[date.getDay()])) {
            workDaysThisMonth++;
          }
        }
        entry.expectedMinutes += durationMin * workDaysThisMonth;
      }
    }

    const results = Array.from(employeeMap.values()).map(entry => {
      const worked = entry.totalMinutes;
      const expected = entry.expectedMinutes;
      const diff = worked - expected;
      const wage = entry.employee.hourly_wage;
      const monthlyEarnings = wage != null ? (worked / 60) * wage : null;
      return { ...entry, worked, expected, diff, wage, monthlyEarnings };
    });

    const totalMonthlyCost = results.reduce((sum, r) => sum + (r.monthlyEarnings || 0), 0);
    const totalWorkedHours = results.reduce((sum, r) => sum + r.worked, 0) / 60;

    return { results, totalMonthlyCost, totalWorkedHours, monthStart, daysInMonth, daysPassed };
  }, [employees, monthAssignments, employeeProperties, properties, today]);

  const handleSetDefaultWage = async () => {
    const wage = parseFloat(defaultWage);
    if (!wage || wage <= 0) return;
    const empsWithoutWage = employees.filter(e => e.hourly_wage == null);
    if (empsWithoutWage.length === 0) { setWageModal(false); return; }
    const { error } = await supabase.from('employees').update({ hourly_wage: wage }).in('id', empsWithoutWage.map(e => e.id));
    if (!error) { onRefresh(); addToast(`Stundenlohn (${wage.toFixed(2)} EUR) für ${empsWithoutWage.length} Mitarbeiter gesetzt`); }
    setWageModal(false);
    setDefaultWage('');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {getGreeting()}, {company.owner_name.split(' ')[0]}
          </h1>
          <p className="text-[#64748B] text-sm mt-1.5">{formatDateLong(today)}</p>
          {isWeekend && (
            <p className="text-xs text-[#F97316] mt-1.5 flex items-center gap-1.5 font-medium">
              <AlertCircle size={13} /> Wochenende — ggf. keine regulären Einsätze
            </p>
          )}
        </div>
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 rounded-xl hover:bg-white/60 transition-colors">
            <Bell size={20} className="text-[#64748B]" />
            {sickCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#EF4444] rounded-full text-white text-[10px] flex items-center justify-center font-bold px-1">{sickCount}</span>}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-4px_rgba(0,0,0,0.04)] border border-[#E2E8F0]/60 py-1 z-30 w-80 max-h-80 overflow-y-auto animate-scale-in">
              <div className="px-4 py-3 border-b border-[#F1F5F9]"><p className="text-sm font-semibold text-[#0F172A]">Benachrichtigungen</p></div>
              {sickReportsForCompany.length === 0 ? (
                <div className="px-4 py-8 text-center"><p className="text-sm text-[#94A3B8]">Keine Benachrichtigungen</p></div>
              ) : (
                sickReportsForCompany.map(sr => (
                  <div key={sr.id} className="px-4 py-3 hover:bg-[#F8FAFC] transition-colors">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={15} className="text-[#F87171] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A]">{sr.employee?.first_name} {sr.employee?.last_name} ist krank</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">{new Date(sr.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}{sr.reason ? ` — ${sr.reason}` : ''}</p>
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
          <h2 className="section-label text-[#EF4444] mb-4 flex items-center gap-2">
            <AlertTriangle size={14} /> Krankmeldungen mit Einsatz
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sickWithAssignments.map(({ sickReport: sr, assignments: empAssignments, hasReplacement }) => (
              <div key={sr.employee_id} className="bg-[#FEF2F2] border border-[#FECACA]/60 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <Avatar firstName={sr.employee?.first_name || ''} lastName={sr.employee?.last_name || ''} id={sr.employee_id} size="lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-[#0F172A]">{sr.employee?.first_name} {sr.employee?.last_name}</p>
                    <span className="badge-danger mt-1.5">Krankgemeldet</span>
                    {sr.reason && <p className="text-sm text-[#64748B] mt-2">Grund: {sr.reason}</p>}
                    {empAssignments.map(a => (
                      <div key={a.id} className="mt-3 bg-white/70 rounded-xl p-3">
                        <p className="text-sm font-semibold text-[#0F172A] flex items-center gap-1.5"><MapPin size={14} className="text-[#94A3B8]" /> {a.property?.name}</p>
                        <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1.5"><Clock size={12} className="text-[#94A3B8]" /> {formatTime(a.property?.time_from || '')} – {formatTime(a.property?.time_to || '')} Uhr</p>
                      </div>
                    ))}
                  </div>
                </div>
                {!hasReplacement && (
                  <button onClick={() => handleFindReplacement(sr)} className="w-full mt-5 py-3 rounded-xl text-sm font-semibold bg-[#EF4444] text-white hover:bg-[#DC2626] transition-colors flex items-center justify-center gap-2">
                    <Search size={16} /> Ersatz finden
                  </button>
                )}
                {hasReplacement && (
                  <div className="mt-5 py-2.5 rounded-xl text-sm font-semibold bg-[#F0FDF4] text-[#16A34A] text-center flex items-center justify-center gap-2">
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
          <h2 className="section-label text-[#F97316] mb-4 flex items-center gap-2">
            <AlertTriangle size={14} /> Krankmeldungen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sickWithoutAssignments.map(({ sickReport: sr }) => (
              <div key={sr.employee_id} className="bg-[#FFF7ED] border border-[#FFEDD5]/60 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <Avatar firstName={sr.employee?.first_name || ''} lastName={sr.employee?.last_name || ''} id={sr.employee_id} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-[#0F172A]">{sr.employee?.first_name} {sr.employee?.last_name}</p>
                    <span className="badge-warning mt-1.5">Krankgemeldet</span>
                    {sr.reason && <p className="text-sm text-[#64748B] mt-1.5">Grund: {sr.reason}</p>}
                    <p className="text-xs text-[#94A3B8] mt-2">Kein Einsatz heute</p>
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
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-bold text-[#0F172A]">{activeEmployees.length}</p>
            <span className="text-sm text-[#94A3B8]">/</span>
            <span className="text-sm text-[#94A3B8]">{companyEmployees.length}</span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-2">verfügbar</p>
          {sickCount > 0 && <p className="text-xs text-[#F97316] font-semibold mt-1">{sickCount} krank</p>}
        </div>
        <div className="card p-5 sm:p-6">
          <p className="section-label mb-3">Einsätze heute</p>
          <p className="text-2xl font-bold text-[#0F172A]">{todayAssignments.length}</p>
          {todayAssignments.length > 0 ? (
            <p className="text-xs text-[#16A34A] font-medium mt-2">{propertiesWithAssignments.length} Objekte</p>
          ) : (
            <p className="text-xs text-[#94A3B8] mt-2">Keine Einsätze</p>
          )}
        </div>
        <div className="card p-5 sm:p-6 col-span-2 lg:col-span-1">
          <p className="section-label mb-3">Krankmeldungen</p>
          <p className="text-2xl font-bold text-[#0F172A]">{sickCount}</p>
          {openSickCount > 0 ? (
            <p className="text-xs text-[#EF4444] font-semibold mt-2">{openSickCount} Ersatz fehlt</p>
          ) : coveredSickCount > 0 ? (
            <p className="text-xs text-[#16A34A] font-medium mt-2">{coveredSickCount} mit Ersatz</p>
          ) : (
            <p className="text-xs text-[#16A34A] font-medium mt-2">Alles erledigt</p>
          )}
        </div>
      </div>

      {/* Employee Timestamps */}
      {todayAssignments.some(a => a.checked_in_at || a.completed_at) && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Zeitstempel heute</h2>
          <div className="card divide-y divide-[#F1F5F9]">
            {todayAssignments
              .filter(a => a.checked_in_at || a.completed_at)
              .sort((a, b) => {
                const timeA = a.completed_at || a.checked_in_at || '';
                const timeB = b.completed_at || b.checked_in_at || '';
                return timeA.localeCompare(timeB);
              })
              .map(a => {
                const isSick = sickReportsForCompany.some(sr => sr.employee_id === a.employee_id);
                return (
                  <div key={a.id} className={`px-5 sm:px-6 py-3.5 flex items-center gap-3 ${isSick ? 'opacity-50' : ''}`}>
                    <Avatar firstName={a.employee?.first_name || ''} lastName={a.employee?.last_name || ''} id={a.employee_id} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A]">{a.employee?.first_name} {a.employee?.last_name}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">{a.property?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {a.completed_at && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Check size={12} className="text-[#22C55E]" />
                          <span className="text-xs font-semibold text-[#0F172A]">{new Date(a.completed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[10px] text-[#94A3B8] font-medium">Fertig</span>
                        </div>
                      )}
                      {a.checked_in_at && !a.completed_at && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock size={12} className="text-[#3B82F6]" />
                          <span className="text-xs font-semibold text-[#0F172A]">{new Date(a.checked_in_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[10px] text-[#94A3B8] font-medium">Check-in</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Payroll Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A]">Abrechnung {today.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={() => setWageModal(true)} className="text-xs font-medium text-[#3B82F6] hover:text-[#2563EB] transition-colors flex items-center gap-1">
            <Euro size={12} /> Stundenlohn setzen
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <div className="card p-5">
            <p className="section-label mb-3">Gesamtkosten</p>
            <p className="text-2xl font-bold text-[#0F172A]">{payrollData.totalMonthlyCost.toFixed(2)} <span className="text-sm font-medium text-[#94A3B8]">EUR</span></p>
            <p className="text-xs text-[#94A3B8] mt-2">dieser Monat bis heute</p>
          </div>
          <div className="card p-5">
            <p className="section-label mb-3">Gesamtstunden</p>
            <p className="text-2xl font-bold text-[#0F172A]">{payrollData.totalWorkedHours.toFixed(1)} <span className="text-sm font-medium text-[#94A3B8]">Std.</span></p>
            <p className="text-xs text-[#94A3B8] mt-2">{payrollData.daysPassed}/{payrollData.daysInMonth} Tage</p>
          </div>
          <div className="card p-5 col-span-2 lg:col-span-1">
            <p className="section-label mb-3">Ohne Stundenlohn</p>
            <p className="text-2xl font-bold text-[#0F172A]">{employees.filter(e => e.hourly_wage == null).length}</p>
            <p className="text-xs text-[#F97316] font-medium mt-2">{employees.filter(e => e.hourly_wage == null).length > 0 ? 'Lohn fehlt' : 'Alle erfasst'}</p>
          </div>
        </div>

        {/* Employee Payroll Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F1F5F9]">
                  <th className="text-left px-5 py-3.5 section-label">Mitarbeiter</th>
                  <th className="text-left px-5 py-3.5 section-label">Stundenlohn</th>
                  <th className="text-left px-5 py-3.5 section-label">Gearbeitet</th>
                  <th className="text-left px-5 py-3.5 section-label">Erwartet</th>
                  <th className="text-left px-5 py-3.5 section-label">Differenz</th>
                  <th className="text-right px-5 py-3.5 section-label">Verdienst</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.results.map(({ employee, worked, expected, diff, wage, monthlyEarnings }) => {
                  const workedH = worked / 60;
                  const expectedH = expected / 60;
                  const diffH = diff / 60;
                  return (
                    <tr key={employee.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar firstName={employee.first_name} lastName={employee.last_name} id={employee.id} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-[#0F172A]">{employee.first_name} {employee.last_name}</p>
                            {employee.status === 'sick' && <span className="text-[10px] text-[#EF4444] font-semibold">KRANK</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {wage != null ? (
                          <span className="text-sm font-medium text-[#0F172A]">{wage.toFixed(2)} EUR</span>
                        ) : (
                          <span className="text-xs text-[#F97316] font-medium">Nicht gesetzt</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-[#0F172A]">{workedH.toFixed(1)} Std.</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-[#64748B]">{expectedH.toFixed(1)} Std.</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {diffH > 0.05 ? <TrendingUp size={14} className="text-[#22C55E]" /> : diffH < -0.05 ? <TrendingDown size={14} className="text-[#EF4444]" /> : <Minus size={14} className="text-[#94A3B8]" />}
                          <span className={`text-sm font-medium ${diffH > 0.05 ? 'text-[#22C55E]' : diffH < -0.05 ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
                            {diffH > 0 ? '+' : ''}{diffH.toFixed(1)} Std.
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {monthlyEarnings != null ? (
                          <span className="text-sm font-semibold text-[#0F172A]">{monthlyEarnings.toFixed(2)} EUR</span>
                        ) : (
                          <span className="text-xs text-[#94A3B8]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8FAFC]">
                  <td colSpan={5} className="px-5 py-3.5 text-sm font-semibold text-[#0F172A]">Gesamt</td>
                  <td className="px-5 py-3.5 text-right text-sm font-bold text-[#0F172A]">{payrollData.totalMonthlyCost.toFixed(2)} EUR</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Today's Assignments */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-[#0F172A]">Heutige Einsätze</h2>
          <span className="text-xs text-[#94A3B8] font-medium">{today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        </div>

        {todayAssignments.length === 0 ? (
          <div className="card p-10 text-center">
            <CalendarDays size={36} className="text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">Keine Einsätze für heute</p>
          </div>
        ) : (
          <div className="space-y-4">
            {propertiesWithAssignments.map(prop => {
              const propAssignments = getPropertyAssignments(prop.id);
              const hasSick = hasSickEmployeeForProperty(prop.id);
              const sickForProp = sickReportsForCompany.filter(sr => propAssignments.some(a => a.employee_id === sr.employee_id));
              const activeAssignments = propAssignments.filter(a => !sickReportsForCompany.some(sr => sr.employee_id === a.employee_id));

              let statusColor = 'bg-[#CBD5E1]';
              if (hasSick && activeAssignments.length === 0) statusColor = 'bg-[#F87171]';
              else if (propAssignments.length > 0 && !hasSick) statusColor = 'bg-[#22C55E]';
              else if (hasSick) statusColor = 'bg-[#FB923C]';

              return (
                <div key={prop.id} className="card overflow-hidden">
                  <div className="p-5 sm:p-6 flex items-start gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${statusColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A]">{prop.name}</p>
                      <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5"><MapPin size={12} className="text-[#94A3B8]" /> {prop.address}</p>
                      <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1.5"><Clock size={12} className="text-[#94A3B8]" /> {formatTime(prop.time_from)} – {formatTime(prop.time_to)} Uhr</p>
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        {activeAssignments.map(a => (
                          <span key={a.id} className="chip"><User size={11} /> {a.employee?.first_name} {a.employee?.last_name?.charAt(0)}.</span>
                        ))}
                        {sickForProp.map(sr => (
                          <span key={sr.id} className="chip !bg-[#FEF2F2] !text-[#EF4444]"><User size={11} /> {sr.employee?.first_name} {sr.employee?.last_name?.charAt(0)}. (krank)</span>
                        ))}
                        {activeAssignments.length === 0 && !hasSick && <span className="text-xs text-[#94A3B8]">Kein Personal zugewiesen</span>}
                        {hasSick && activeAssignments.length === 0 && <span className="text-xs text-[#EF4444] font-semibold">Ersatz fehlt noch</span>}
                      </div>
                    </div>
                    {hasSick && activeAssignments.length === 0 && sickForProp.length > 0 && (
                      <button onClick={() => handleFindReplacement(sickForProp[0])} className="bg-[#EF4444] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#DC2626] transition-colors shrink-0">
                        <span className="hidden sm:inline">Ersatz finden</span><span className="sm:hidden">Ersatz</span>
                      </button>
                    )}
                  </div>
                  {propAssignments.length > 0 && (
                    <div className="border-t border-[#F1F5F9] divide-y divide-[#F1F5F9]">
                      {propAssignments.map(a => {
                        const isSick = sickReportsForCompany.some(sr => sr.employee_id === a.employee_id);
                        return (
                          <div key={a.id} className={`px-5 sm:px-6 py-3.5 flex items-center gap-3 ${isSick ? 'bg-[#FEF2F2]/40' : ''}`}>
                            <Avatar firstName={a.employee?.first_name || ''} lastName={a.employee?.last_name || ''} id={a.employee_id} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#0F172A]">{a.employee?.first_name} {a.employee?.last_name}</p>
                              {a.checked_in_at && (
                                <p className="text-[11px] text-[#94A3B8] mt-0.5 font-medium flex items-center gap-1">
                                  <Clock size={10} /> Check-in {new Date(a.checked_in_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                                </p>
                              )}
                              {a.completed_at && (
                                <p className="text-[11px] text-[#94A3B8] mt-0.5 font-medium flex items-center gap-1">
                                  <Check size={10} /> Fertig {new Date(a.completed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                                </p>
                              )}
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
                                <button onClick={() => handleCheckIn(a.id)} className="p-1.5 rounded-lg hover:bg-[#F0FDF4] transition-colors text-[#22C55E]" title="Einchecken"><Check size={15} /></button>
                                <button onClick={() => setRemoveConfirm(a.id)} className="p-1.5 rounded-lg hover:bg-[#FEF2F2] transition-colors text-[#F87171]" title="Entfernen"><X size={15} /></button>
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

      {/* Remove Confirmation */}
      <Modal open={!!removeConfirm} onClose={() => setRemoveConfirm(null)} width="max-w-sm">
        <div className="p-8">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mb-5">
            <AlertTriangle size={22} className="text-[#EF4444]" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] mb-2">Zuweisung entfernen?</h2>
          <p className="text-sm text-[#64748B] leading-relaxed mb-8">Der Mitarbeiter wird von diesem Einsatz entfernt.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRemoveConfirm(null)} className="btn-ghost">Abbrechen</button>
            <button onClick={() => removeConfirm && handleRemoveAssignment(removeConfirm)} className="btn-danger">Entfernen</button>
          </div>
        </div>
      </Modal>

      {/* Set Default Wage Modal */}
      <Modal open={wageModal} onClose={() => { setWageModal(false); setDefaultWage(''); }} width="max-w-sm">
        <div className="p-8">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mb-5">
            <Euro size={22} className="text-[#3B82F6]" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] mb-2">Stundenlohn setzen</h2>
          <p className="text-sm text-[#64748B] leading-relaxed mb-6">
            Setze einen Standard-Stundenlohn für alle Mitarbeiter ohne individuellen Lohn. Bereits gesetzte Löhne bleiben unverändert.
          </p>
          <div className="mb-2">
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Standard-Stundenlohn (EUR)</label>
            <input type="number" step="0.01" min="0" value={defaultWage} onChange={e => setDefaultWage(e.target.value)} placeholder="z.B. 14.50" className="input-field" />
          </div>
          <p className="text-xs text-[#94A3B8] mb-6">{employees.filter(e => e.hourly_wage == null).length} Mitarbeiter ohne Stundenlohn</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setWageModal(false); setDefaultWage(''); }} className="btn-ghost">Abbrechen</button>
            <button onClick={handleSetDefaultWage} disabled={!defaultWage || parseFloat(defaultWage) <= 0} className="btn-primary">Übernehmen</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
