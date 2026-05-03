import { useState, useMemo } from 'react';
import { AlertTriangle, Star } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Avatar } from '../shared/Avatar';
import { formatTime } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import type { Employee, Property, SickReport, EmployeeProperty, Assignment } from '../../lib/types';

interface ReplacementModalProps {
  sickReport: SickReport & { employee: Employee };
  property: Property;
  employees: Employee[];
  employeeProperties: EmployeeProperty[];
  assignments: Assignment[];
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'select' | 'confirm';

export function ReplacementModal({
  sickReport,
  property,
  employees,
  employeeProperties,
  assignments,
  onClose,
  onComplete,
}: ReplacementModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  type AvailableEmployee = Employee & { knowsProperty: boolean; availStatus: 'free' | 'partial' | 'unknown'; empAssignments: Assignment[] };
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'app'>('whatsapp');
  const [sending, setSending] = useState(false);

  const availableEmployees = useMemo((): AvailableEmployee[] => {
    const sickEmployeeId = sickReport.employee_id;
    const todayStr = new Date().toISOString().split('T')[0];

    return employees
      .filter(e => e.id !== sickEmployeeId && e.status === 'active')
      .map(e => {
        const knowsProperty = employeeProperties.some(
          ep => ep.employee_id === e.id && ep.property_id === property.id
        );
        const empAssignments = assignments.filter(a => a.employee_id === e.id && a.date === todayStr);
        const isFree = empAssignments.length === 0;
        const hasPartial = empAssignments.length > 0;

        let availStatus: 'free' | 'partial' | 'unknown' = 'unknown';
        if (isFree) availStatus = 'free';
        else if (hasPartial) availStatus = 'partial';

        return { ...e, knowsProperty, availStatus, empAssignments };
      })
      .sort((a, b) => {
        if (a.knowsProperty && !b.knowsProperty) return -1;
        if (!a.knowsProperty && b.knowsProperty) return 1;
        if (a.availStatus === 'free' && b.availStatus !== 'free') return -1;
        if (a.availStatus !== 'free' && b.availStatus === 'free') return 1;
        return 0;
      });
  }, [employees, sickReport, property, employeeProperties, assignments]);

  const handleSelect = (emp: AvailableEmployee) => {
    setSelectedEmployee(emp);
    const todayStr = new Date().toISOString().split('T')[0];
    const empAssignments = assignments.filter(a => a.employee_id === emp.id && a.date === todayStr);
    const timeInfo = empAssignments.length > 0
      ? `Du hast heute bereits eine Schicht.`
      : '';

    setMessage(
      `Hallo ${emp.first_name}, kannst du heute von ${formatTime(property.time_from)}–${formatTime(property.time_to)} Uhr ${property.name} übernehmen? ${sickReport.employee.first_name} ist krank. Bitte melde dich kurz zurück. ${timeInfo}`
    );
    setStep('confirm');
  };

  const handleSend = async () => {
    if (!selectedEmployee) return;
    setSending(true);

    try {
      const { error } = await supabase.from('replacement_requests').insert({
        sick_report_id: sickReport.id,
        property_id: property.id,
        replacement_employee_id: selectedEmployee.id,
        status: 'pending',
        message,
        channel,
      });

      if (error) {
        setSending(false);
        return;
      }

      if (channel === 'whatsapp' && selectedEmployee.phone) {
        const phone = selectedEmployee.phone.replace(/[^0-9]/g, '');
        const text = encodeURIComponent(message);
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
      } else if (channel === 'sms' && selectedEmployee.phone) {
        const phone = selectedEmployee.phone.replace(/[^0-9+]/g, '');
        const body = encodeURIComponent(message);
        window.open(`sms:${phone}?body=${body}`, '_self');
      }

      onComplete();
    } catch {
      setSending(false);
    }
  };

  const getStatusLabel = (emp: AvailableEmployee) => {
    if (emp.availStatus === 'free' && emp.knowsProperty) return 'Heute frei · Kennt das Objekt';
    if (emp.availStatus === 'free') return 'Heute frei · Objekt unbekannt';
    if (emp.availStatus === 'partial' && emp.knowsProperty) return 'Hat heute Schicht · Kennt das Objekt';
    if (emp.availStatus === 'partial') return 'Hat heute Schicht · Objekt unbekannt';
    return 'Objekt unbekannt';
  };

  const getStatusDot = (status: string) => {
    if (status === 'free') return 'bg-[#22C55E]';
    if (status === 'partial') return 'bg-[#F97316]';
    return 'bg-gray-300';
  };

  return (
    <Modal open onClose={onClose} width="max-w-xl">
      {step === 'select' && (
        <div className="p-6">
          <div className="flex items-start gap-3 mb-1">
            <AlertTriangle size={20} className="text-[#EF4444] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Krankmeldung — Ersatz finden</h2>
              <p className="text-sm text-[#64748B] mt-1">
                {sickReport.employee.first_name} {sickReport.employee.last_name} · {property.name} · {formatTime(property.time_from)}–{formatTime(property.time_to)} Uhr
              </p>
            </div>
          </div>

          <hr className="my-4 border-gray-100" />

          <p className="text-[11px] text-[#64748B] uppercase tracking-wider font-medium mb-3">
            Verfügbare Mitarbeiter
          </p>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {availableEmployees.map(emp => {
              const isBest = emp.knowsProperty && emp.availStatus === 'free';
              return (
                <div
                  key={emp.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <Avatar firstName={emp.first_name} lastName={emp.last_name} id={emp.id} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusDot(emp.availStatus)}`} />
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {emp.first_name} {emp.last_name}
                      </p>
                      {isBest && (
                        <span className="inline-flex items-center gap-1 bg-[#22C55E]/10 text-[#22C55E] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          <Star size={10} /> Beste Wahl
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#64748B] mt-0.5">{getStatusLabel(emp)}</p>
                  </div>
                  <button
                    onClick={() => handleSelect(emp)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E] hover:text-white transition-colors shrink-0"
                  >
                    Zuweisen
                  </button>
                </div>
              );
            })}
            {availableEmployees.length === 0 && (
              <p className="text-sm text-[#64748B] text-center py-4">Keine verfügbaren Mitarbeiter</p>
            )}
          </div>
        </div>
      )}

      {step === 'confirm' && selectedEmployee && (
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              {selectedEmployee.first_name} {selectedEmployee.last_name} zuweisen
            </h2>
          </div>

          <p className="text-sm text-[#64748B] mb-3">Nachricht an {selectedEmployee.first_name}:</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-[#0F172A] resize-none focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
          />

          <p className="text-sm text-[#64748B] mt-4 mb-2">Senden via:</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="channel"
                checked={channel === 'whatsapp'}
                onChange={() => setChannel('whatsapp')}
                className="accent-[#22C55E]"
              />
              <span className="text-sm text-[#0F172A]">WhatsApp</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="channel"
                checked={channel === 'sms'}
                onChange={() => setChannel('sms')}
                className="accent-[#22C55E]"
              />
              <span className="text-sm text-[#0F172A]">SMS</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="channel"
                checked={channel === 'app'}
                onChange={() => setChannel('app')}
                className="accent-[#22C55E]"
              />
              <span className="text-sm text-[#0F172A]">Nur speichern</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setStep('select')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-gray-100 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#22C55E] text-white hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {sending ? 'Wird gesendet...' : 'Jetzt senden →'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
