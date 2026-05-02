import { useState, useEffect } from 'react';
import { MapPin, Clock, LogIn, Mail, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDateLong, formatTime } from '../../lib/utils';
import type { Employee, Property, Assignment, ReplacementRequest } from '../../lib/types';

interface EmployeeHomeProps {
  onSickLeave: () => void;
}

export function EmployeeHome({ onSickLeave }: EmployeeHomeProps) {
  const { user, signOut } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayAssignment, setTodayAssignment] = useState<(Assignment & { property: Property }) | null>(null);
  const [replacementRequest, setReplacementRequest] = useState<(ReplacementRequest & { property: Property; sickEmployee: Employee }) | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [requestResponded, setRequestResponded] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    const { data: emp } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!emp) return;
    setEmployee(emp);

    const { data: assignments } = await supabase
      .from('assignments')
      .select('*, property:properties(*)')
      .eq('employee_id', emp.id)
      .eq('date', todayStr)
      .eq('status', 'assigned')
      .limit(1);

    if (assignments && assignments.length > 0) {
      setTodayAssignment(assignments[0] as unknown as Assignment & { property: Property });
    }

    const { data: requests } = await supabase
      .from('replacement_requests')
      .select('*, property:properties(*)')
      .eq('replacement_employee_id', emp.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (requests && requests.length > 0) {
      const req = requests[0];
      const { data: sickEmp } = await supabase
        .from('sick_reports')
        .select('*, employee:employees(*)')
        .eq('id', req.sick_report_id)
        .maybeSingle();

      setReplacementRequest({
        ...req,
        property: req.property,
        sickEmployee: sickEmp?.employee,
      } as unknown as ReplacementRequest & { property: Property; sickEmployee: Employee });
    }
  }

  const handleCheckIn = async () => {
    if (!todayAssignment) return;
    await supabase
      .from('assignments')
      .update({ status: 'checked_in' })
      .eq('id', todayAssignment.id);
    setCheckedIn(true);
  };

  const handleAcceptReplacement = async () => {
    if (!replacementRequest || !employee) return;
    await supabase
      .from('replacement_requests')
      .update({ status: 'accepted' })
      .eq('id', replacementRequest.id);

    await supabase.from('assignments').insert({
      property_id: replacementRequest.property_id,
      employee_id: employee.id,
      date: todayStr,
      status: 'assigned',
    });

    setRequestResponded(true);
  };

  const handleDeclineReplacement = async () => {
    if (!replacementRequest) return;
    await supabase
      .from('replacement_requests')
      .update({ status: 'declined' })
      .eq('id', replacementRequest.id);
    setRequestResponded(true);
  };

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          {getGreeting()}, {employee.first_name}
        </h1>
        <p className="text-[#64748B] text-sm mt-1">{formatDateLong(today)}</p>
      </div>

      {/* Replacement Request Banner */}
      {replacementRequest && !requestResponded && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={18} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Neue Anfrage</span>
          </div>
          <p className="text-sm text-blue-700 mb-1">Kannst du heute einspringen?</p>
          <p className="text-sm text-blue-600">
            {replacementRequest.property?.name} · {formatTime(replacementRequest.property?.time_from || '')}–{formatTime(replacementRequest.property?.time_to || '')} Uhr
          </p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={handleAcceptReplacement}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-[#22C55E] text-white hover:bg-green-600 transition-colors"
            >
              Ja, ich komme
            </button>
            <button
              onClick={handleDeclineReplacement}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-[#64748B] hover:bg-gray-200 transition-colors"
            >
              Nein
            </button>
          </div>
        </div>
      )}

      {replacementRequest && requestResponded && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm font-semibold text-green-800">Super! Chef wurde informiert.</p>
          {replacementRequest.property?.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(replacementRequest.property.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-[#22C55E] hover:underline"
            >
              Route anzeigen →
            </a>
          )}
        </div>
      )}

      {/* Today's Assignment */}
      <div className="bg-[#F8FAFC] rounded-xl p-5 mb-6">
        <p className="text-[11px] text-[#64748B] uppercase tracking-wider font-medium mb-3">
          Dein heutiger Einsatz
        </p>

        {todayAssignment ? (
          <>
            <p className="text-lg font-bold text-[#0F172A]">
              {todayAssignment.property?.name}
            </p>
            <p className="text-sm text-[#64748B] mt-1.5 flex items-center gap-1.5">
              <MapPin size={14} /> {todayAssignment.property?.address}
            </p>
            <p className="text-sm text-[#64748B] mt-1 flex items-center gap-1.5">
              <Clock size={14} /> {formatTime(todayAssignment.property?.time_from || '')} – {formatTime(todayAssignment.property?.time_to || '')} Uhr
            </p>
          </>
        ) : (
          <p className="text-sm text-[#64748B]">Heute kein Einsatz geplant</p>
        )}
      </div>

      {/* Check-in Button */}
      {todayAssignment && !checkedIn && (
        <button
          onClick={handleCheckIn}
          className="w-full py-3.5 rounded-xl text-base font-semibold bg-[#22C55E] text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <LogIn size={20} /> Einchecken
        </button>
      )}

      {checkedIn && (
        <div className="w-full py-3.5 rounded-xl text-base font-semibold bg-green-50 text-[#22C55E] text-center mb-4">
          Eingechekt
        </div>
      )}

      {/* Sick Leave Link */}
      <button
        onClick={onSickLeave}
        className="w-full text-center text-sm text-[#64748B] hover:text-[#0F172A] transition-colors py-2"
      >
        Krank melden
      </button>

      {/* Logout */}
      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors py-3 mt-4"
      >
        <LogOut size={16} /> Abmelden
      </button>
    </div>
  );
}
