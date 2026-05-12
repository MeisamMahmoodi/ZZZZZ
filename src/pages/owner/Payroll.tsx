import { useState, useEffect, useMemo } from 'react';
import { Euro, TrendingUp, TrendingDown, Minus, Clock, Check, CalendarDays, AlertCircle, Pencil, X, Lock, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/shared/Avatar';
import { Modal } from '../../components/shared/Modal';
import { UpgradeModal } from '../../components/shared/UpgradeModal';
import type { Plan } from '../../components/shared/UpgradeModal';
import { useToast } from '../../components/shared/Toast';
import { formatTime } from '../../lib/utils';
import type { Employee, Property, Assignment, EmployeeProperty, Company } from '../../lib/types';

interface PayrollProps {
  company: Company;
  refreshKey: number;
  onRefresh: () => void;
}

interface AssignmentWithDetails extends Assignment {
  employee: Employee;
  property: Property;
}

export function Payroll({ company, refreshKey, onRefresh }: PayrollProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [employeeProperties, setEmployeeProperties] = useState<EmployeeProperty[]>([]);
  const [monthAssignments, setMonthAssignments] = useState<AssignmentWithDetails[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [defaultWage, setDefaultWage] = useState('');
  const [wageModal, setWageModal] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [editingWageId, setEditingWageId] = useState<string | null>(null);
  const [editingWageValue, setEditingWageValue] = useState('');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { addToast } = useToast();

  const plan = ((company.contract as Plan) || 'Starter') as Plan;
  const isPremium = plan === 'Premium';
  const hasBusiness = plan === 'Business' || plan === 'Premium';

  useEffect(() => { loadData(); }, [company.id, refreshKey, selectedMonth]);

  async function loadData() {
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const [empRes, propRes, epRes, assignRes] = await Promise.all([
        supabase.from('employees').select('*').eq('company_id', company.id).order('last_name'),
        supabase.from('properties').select('*').eq('company_id', company.id),
        supabase.from('employee_properties').select('*'),
        supabase.from('assignments').select('*, employee:employees(*), property:properties(*)').gte('date', monthStart).lte('date', monthEnd),
      ]);
      setEmployees(empRes.data || []);
      setProperties(propRes.data || []);
      setEmployeeProperties(epRes.data || []);
      setMonthAssignments((assignRes.data as unknown as AssignmentWithDetails[]) || []);
    } catch {
      // Component renders with existing state
    }
  }

  const today = new Date();
  const [selYear, selMonth] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(selYear, selMonth, 0).getDate();
  const isCurrentMonth = selYear === today.getFullYear() && selMonth === today.getMonth() + 1;
  const daysPassed = isCurrentMonth ? today.getDate() : daysInMonth;

  const payrollData = useMemo(() => {
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

      const aTimeFrom = a.time_from ?? prop.time_from;
      const aTimeTo = a.time_to ?? prop.time_to;
      const [fromH, fromM] = aTimeFrom.split(':').map(Number);
      const [toH, toM] = aTimeTo.split(':').map(Number);
      const durationMin = (toH * 60 + toM) - (fromH * 60 + fromM);

      if (a.status === 'completed' || a.status === 'checked_in') {
        entry.totalMinutes += durationMin;
      }
    }

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
        let workDaysThisMonth = 0;
        for (let d = 1; d <= daysPassed; d++) {
          const date = new Date(selYear, selMonth - 1, d);
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
    const totalExpectedHours = results.reduce((sum, r) => sum + r.expected, 0) / 60;

    return { results, totalMonthlyCost, totalWorkedHours, totalExpectedHours, daysInMonth, daysPassed };
  }, [employees, monthAssignments, employeeProperties, properties, selYear, selMonth, daysPassed, daysInMonth]);

  const handleSetDefaultWage = async () => {
    const wage = parseFloat(defaultWage);
    if (!wage || wage <= 0) return;
    const empsWithoutWage = employees.filter(e => e.hourly_wage == null);
    if (empsWithoutWage.length === 0) { setWageModal(false); return; }
    const { error } = await supabase.from('employees').update({ hourly_wage: wage }).in('id', empsWithoutWage.map(e => e.id));
    if (!error) { onRefresh(); addToast(`Stundenlohn (${wage.toFixed(2)} EUR) fuer ${empsWithoutWage.length} Mitarbeiter gesetzt`); }
    setWageModal(false);
    setDefaultWage('');
  };

  const handleSaveIndividualWage = async (employeeId: string) => {
    const wage = parseFloat(editingWageValue);
    if (isNaN(wage) || wage < 0) { setEditingWageId(null); return; }
    const { error } = await supabase.from('employees').update({ hourly_wage: wage || null }).eq('id', employeeId);
    if (!error) { onRefresh(); addToast('Stundenlohn gespeichert'); }
    setEditingWageId(null);
    setEditingWageValue('');
  };

  const monthLabel = new Date(selYear, selMonth - 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  const monthOptions = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    monthOptions.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Abrechnung</h1>
          <p className="text-[#64748B] text-sm mt-1.5">Zeitstempel, Ueberstunden und Lohnabrechnung</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="input-field !w-auto !pr-8">
            {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => hasBusiness ? setWageModal(true) : setUpgradeOpen(true)} className="btn-primary flex items-center gap-2">
            {!hasBusiness && <Lock size={14} />}
            <Euro size={16} /> Stundenlohn setzen
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5 sm:p-6">
          <p className="section-label mb-3">Gesamtkosten</p>
          <p className="text-2xl font-bold text-[#0F172A]">{payrollData.totalMonthlyCost.toFixed(2)} <span className="text-sm font-medium text-[#94A3B8]">EUR</span></p>
          <p className="text-xs text-[#94A3B8] mt-2">{monthLabel}</p>
        </div>
        <div className="card p-5 sm:p-6">
          <p className="section-label mb-3">Gearbeitet</p>
          <p className="text-2xl font-bold text-[#0F172A]">{payrollData.totalWorkedHours.toFixed(1)} <span className="text-sm font-medium text-[#94A3B8]">Std.</span></p>
          <p className="text-xs text-[#94A3B8] mt-2">{payrollData.daysPassed}/{payrollData.daysInMonth} Tage</p>
        </div>
        <div className="card p-5 sm:p-6">
          <p className="section-label mb-3">Erwartet</p>
          <p className="text-2xl font-bold text-[#0F172A]">{payrollData.totalExpectedHours.toFixed(1)} <span className="text-sm font-medium text-[#94A3B8]">Std.</span></p>
          <p className="text-xs text-[#94A3B8] mt-2">nach Planung</p>
        </div>
        <div className="card p-5 sm:p-6">
          <p className="section-label mb-3">Ohne Stundenlohn</p>
          <p className="text-2xl font-bold text-[#0F172A]">{employees.filter(e => e.hourly_wage == null).length}</p>
          <p className="text-xs text-[#F97316] font-medium mt-2">{employees.filter(e => e.hourly_wage == null).length > 0 ? 'Lohn fehlt' : 'Alle erfasst'}</p>
        </div>
      </div>

      {/* Employee Payroll List */}
      <div className="space-y-3">
        {payrollData.results.map(({ employee, worked, expected, diff, wage, monthlyEarnings, assignments }) => {
          const workedH = worked / 60;
          const expectedH = expected / 60;
          const diffH = diff / 60;
          const isExpanded = expandedEmployee === employee.id;
          const completedAssignments = assignments.filter(a => a.status === 'completed' || a.status === 'checked_in');

          return (
            <div key={employee.id} className="card">
              <div className="px-5 sm:px-6 py-4 flex items-center gap-4">
                <button onClick={() => setExpandedEmployee(isExpanded ? null : employee.id)} className="shrink-0">
                  <Avatar firstName={employee.first_name} lastName={employee.last_name} id={employee.id} size="md" />
                </button>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedEmployee(isExpanded ? null : employee.id)}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#0F172A]">{employee.first_name} {employee.last_name}</p>
                    {employee.status === 'sick' && <span className="badge-danger text-[10px]">Krank</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    {isPremium ? (
                      editingWageId === employee.id ? (
                        <span className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <input
                            type="number" step="0.01" min="0"
                            value={editingWageValue}
                            onChange={e => setEditingWageValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveIndividualWage(employee.id); if (e.key === 'Escape') setEditingWageId(null); }}
                            autoFocus
                            className="w-24 text-xs px-2 py-1 border border-[#3B82F6] rounded-lg outline-none bg-white"
                            placeholder="0.00"
                          />
                          <button onClick={() => handleSaveIndividualWage(employee.id)} className="p-1 rounded-lg bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors"><Check size={11} /></button>
                          <button onClick={() => setEditingWageId(null)} className="p-1 rounded-lg bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] transition-colors"><X size={11} /></button>
                        </span>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setEditingWageId(employee.id); setEditingWageValue(wage != null ? wage.toFixed(2) : ''); }}
                          className="flex items-center gap-1.5 group text-xs text-[#64748B] hover:text-[#0F172A] transition-colors"
                        >
                          <span>{wage != null ? `${wage.toFixed(2)} EUR/h` : 'Kein Lohn'}</span>
                          <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#94A3B8]" />
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-[#64748B]">
                        {wage != null ? `${wage.toFixed(2)} EUR/h` : 'Kein Lohn'}
                      </span>
                    )}
                    <span className="text-xs text-[#64748B]">
                      {completedAssignments.length} Einsaetze
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0 cursor-pointer" onClick={() => setExpandedEmployee(isExpanded ? null : employee.id)}>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-[#0F172A]">{workedH.toFixed(1)} Std.</p>
                    <p className="text-[11px] text-[#64748B]">gearbeitet</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-[#64748B]">{expectedH.toFixed(1)} Std.</p>
                    <p className="text-[11px] text-[#94A3B8]">erwartet</p>
                  </div>
                  <div className="text-right hidden sm:block min-w-[80px]">
                    <div className="flex items-center justify-end gap-1">
                      {diffH > 0.05 ? <TrendingUp size={14} className="text-[#22C55E]" /> : diffH < -0.05 ? <TrendingDown size={14} className="text-[#EF4444]" /> : <Minus size={14} className="text-[#94A3B8]" />}
                      <span className={`text-sm font-medium ${diffH > 0.05 ? 'text-[#22C55E]' : diffH < -0.05 ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
                        {diffH > 0 ? '+' : ''}{diffH.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">Differenz</p>
                  </div>
                  <div className="text-right min-w-[90px]">
                    {monthlyEarnings != null ? (
                      <p className="text-sm font-bold text-[#0F172A]">{monthlyEarnings.toFixed(2)} EUR</p>
                    ) : (
                      <p className="text-xs text-[#94A3B8]">--</p>
                    )}
                    <p className="text-[11px] text-[#94A3B8]">Verdienst</p>
                  </div>
                </div>
              </div>

              {/* Mobile stats */}
              <div className="sm:hidden px-5 pb-3 flex gap-4">
                <div className="flex-1 bg-[#F8FAFC] rounded-xl p-3">
                  <p className="text-xs text-[#94A3B8] mb-1">Gearbeitet</p>
                  <p className="text-sm font-semibold text-[#0F172A]">{workedH.toFixed(1)} Std.</p>
                </div>
                <div className="flex-1 bg-[#F8FAFC] rounded-xl p-3">
                  <p className="text-xs text-[#94A3B8] mb-1">Erwartet</p>
                  <p className="text-sm text-[#64748B]">{expectedH.toFixed(1)} Std.</p>
                </div>
                <div className="flex-1 bg-[#F8FAFC] rounded-xl p-3">
                  <p className="text-xs text-[#94A3B8] mb-1">Differenz</p>
                  <div className="flex items-center gap-1">
                    {diffH > 0.05 ? <TrendingUp size={12} className="text-[#22C55E]" /> : diffH < -0.05 ? <TrendingDown size={12} className="text-[#EF4444]" /> : <Minus size={12} className="text-[#94A3B8]" />}
                    <span className={`text-sm font-medium ${diffH > 0.05 ? 'text-[#22C55E]' : diffH < -0.05 ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
                      {diffH > 0 ? '+' : ''}{diffH.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded: Timestamps */}
              {isExpanded && (
                <div className="border-t border-[#F1F5F9]">
                  <div className="px-5 sm:px-6 py-4">
                    <h3 className="text-xs font-semibold text-[#0F172A] mb-3 flex items-center gap-1.5">
                      <CalendarDays size={13} /> Einsaetze im {monthLabel}
                    </h3>
                    {assignments.length === 0 ? (
                      <p className="text-sm text-[#94A3B8]">Keine Einsaetze in diesem Monat</p>
                    ) : (
                      <div className="space-y-2">
                        {assignments
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map(a => {
                            const aTimeFrom = a.time_from ?? a.property.time_from;
                            const aTimeTo = a.time_to ?? a.property.time_to;
                            const [fromH, fromM] = aTimeFrom.split(':').map(Number);
                            const [toH, toM] = aTimeTo.split(':').map(Number);
                            const durationMin = (toH * 60 + toM) - (fromH * 60 + fromM);
                            const durationH = durationMin / 60;
                            return (
                              <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-[#F1F5F9] last:border-0">
                                <div className="w-10 text-center shrink-0">
                                  <p className="text-sm font-semibold text-[#0F172A]">{new Date(a.date).getDate()}</p>
                                  <p className="text-[10px] text-[#94A3B8] uppercase">{new Date(a.date).toLocaleDateString('de-DE', { weekday: 'short' })}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#0F172A]">{a.property.name}</p>
                                  <p className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
                                    <Clock size={11} /> {formatTime(aTimeFrom)} – {formatTime(aTimeTo)} Uhr
                                    <span className="text-[#94A3B8]">({durationH.toFixed(1)} Std.)</span>
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  {a.status === 'completed' && (
                                    <div>
                                      <span className="badge-success text-[10px]"><Check size={10} /> Fertig</span>
                                      {a.checked_in_at && (
                                        <p className="text-[10px] text-[#94A3B8] mt-0.5">{new Date(a.checked_in_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} – {a.completed_at ? new Date(a.completed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                                      )}
                                    </div>
                                  )}
                                  {a.status === 'checked_in' && (
                                    <div>
                                      <span className="badge-info text-[10px]"><Clock size={10} /> Aktiv</span>
                                      {a.checked_in_at && (
                                        <p className="text-[10px] text-[#94A3B8] mt-0.5">seit {new Date(a.checked_in_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                                      )}
                                    </div>
                                  )}
                                  {a.status === 'assigned' && (
                                    <span className="badge-neutral text-[10px]">Zugewiesen</span>
                                  )}
                                  {a.status === 'cancelled' && (
                                    <span className="badge-danger text-[10px]">Storniert</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {payrollData.results.length === 0 && (
          <div className="card p-10 text-center">
            <AlertCircle size={36} className="text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">Keine Mitarbeiter gefunden</p>
          </div>
        )}
      </div>

      {/* Total Footer */}
      {payrollData.results.length > 0 && (
        <div className="card mt-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">Gesamtkosten {monthLabel}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{payrollData.totalWorkedHours.toFixed(1)} Std. gearbeitet / {payrollData.totalExpectedHours.toFixed(1)} Std. erwartet</p>
            </div>
            <p className="text-xl font-bold text-[#0F172A]">{payrollData.totalMonthlyCost.toFixed(2)} EUR</p>
          </div>
        </div>
      )}

      {/* Premium upsell banner for non-premium users */}
      {!isPremium && employees.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[#FED7AA] bg-gradient-to-r from-[#FFF7ED] to-[#FFFBF5] p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center shrink-0">
            <Crown size={20} className="text-[#F97316]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0F172A]">Individuelle Stundenlöhne</p>
            <p className="text-xs text-[#64748B] mt-0.5">Mit dem Premium-Plan kannst du für jeden Mitarbeiter einen eigenen Stundensatz hinterlegen – direkt hier in der Abrechnung.</p>
          </div>
          <button onClick={() => setUpgradeOpen(true)} className="shrink-0 flex items-center gap-1.5 bg-[#F97316] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#EA6C00] transition-colors">
            <Crown size={13} /> Premium
          </button>
        </div>
      )}

      {/* Set Default Wage Modal */}
      <Modal open={wageModal} onClose={() => { setWageModal(false); setDefaultWage(''); }} width="max-w-sm">
        <div className="p-8">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mb-5">
            <Euro size={22} className="text-[#3B82F6]" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] mb-2">Standard-Stundenlohn setzen</h2>
          <p className="text-sm text-[#64748B] leading-relaxed mb-6">
            Setze einen einheitlichen Stundenlohn fuer das gesamte Team. Gilt fuer alle Mitarbeiter ohne individuellen Lohn. Bereits gesetzte Loehne bleiben unveraendert.
          </p>
          <div className="mb-2">
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Standard-Stundenlohn (EUR)</label>
            <input type="number" step="0.01" min="0" value={defaultWage} onChange={e => setDefaultWage(e.target.value)} placeholder="z.B. 14.50" className="input-field" />
          </div>
          <p className="text-xs text-[#94A3B8] mb-6">{employees.filter(e => e.hourly_wage == null).length} Mitarbeiter ohne Stundenlohn</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setWageModal(false); setDefaultWage(''); }} className="btn-ghost">Abbrechen</button>
            <button onClick={handleSetDefaultWage} disabled={!defaultWage || parseFloat(defaultWage) <= 0} className="btn-primary">Uebernehmen</button>
          </div>
        </div>
      </Modal>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        currentPlan={plan}
        requiredPlan="Premium"
        featureName="Individuelle Stundenlöhne"
      />
    </div>
  );
}
