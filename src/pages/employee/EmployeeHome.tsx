import { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, LogIn, Mail, LogOut, Heart, Bell, CheckCircle, CalendarDays } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDateLong, formatTime } from '../../lib/utils';
import type { Employee, Property, Assignment, ReplacementRequest, Notification } from '../../lib/types';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [openAssignments, setOpenAssignments] = useState<(Assignment & { property: Property })[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    // Load today's assignment
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

    // Load replacement requests
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

    // Load notifications
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('employee_id', emp.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(20);

    setNotifications(notifs || []);

    // Load open assignments for today (assigned to this employee)
    const { data: todayAssignments } = await supabase
      .from('assignments')
      .select('*, property:properties(*)')
      .eq('employee_id', emp.id)
      .eq('date', todayStr)
      .eq('status', 'assigned');

    if (todayAssignments && todayAssignments.length > 0) {
      setOpenAssignments(todayAssignments as unknown as (Assignment & { property: Property })[]);
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

  const handleMarkNotificationRead = async (notifId: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notifId);
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const handleMarkAllRead = async () => {
    if (!employee) return;
    await supabase.from('notifications').update({ read: true }).eq('employee_id', employee.id).eq('read', false);
    setNotifications([]);
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

  const unreadCount = notifications.length;

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 py-6 sm:py-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
            {getGreeting()}, {employee.first_name}
          </h1>
          <p className="text-[#64748B] text-sm mt-1">{formatDateLong(today)}</p>
        </div>
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} className="text-[#64748B]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#EF4444] rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-30 w-72 max-h-80 overflow-y-auto">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#0F172A]">Nachrichten</p>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-[#22C55E] font-medium">
                    Alle gelesen
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-[#64748B]">Keine neuen Nachrichten</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleMarkNotificationRead(n.id)}>
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'new_assignment' ? 'bg-[#22C55E]' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A]">{n.title}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notifications Banner */}
      {notifications.length > 0 && (
        <div className="mb-6 space-y-2">
          {notifications.slice(0, 3).map(n => (
            <div
              key={n.id}
              className={`rounded-xl p-4 border ${
                n.type === 'new_assignment'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {n.type === 'new_assignment' ? (
                  <CalendarDays size={18} className="text-[#22C55E] shrink-0 mt-0.5" />
                ) : (
                  <Mail size={18} className="text-blue-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A]">{n.title}</p>
                  <p className="text-sm text-[#64748B] mt-0.5">{n.message}</p>
                </div>
                <button
                  onClick={() => handleMarkNotificationRead(n.id)}
                  className="text-[#64748B] hover:text-[#0F172A] transition-colors shrink-0"
                >
                  <CheckCircle size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Replacement Request Banner */}
      {replacementRequest && !requestResponded && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={18} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Einspringen?</span>
          </div>
          <p className="text-sm text-blue-700 mb-1">
            {replacementRequest.sickEmployee?.first_name} ist krank. Kannst du heute einspringen?
          </p>
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
          <p className="text-sm font-semibold text-green-800">Chef wurde informiert!</p>
          {replacementRequest.property?.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(replacementRequest.property.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-[#22C55E] hover:underline"
            >
              Route anzeigen
            </a>
          )}
        </div>
      )}

      {/* Today's Assignment */}
      <div className="bg-[#F8FAFC] rounded-xl p-4 sm:p-5 mb-6">
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
          className="w-full py-3.5 rounded-xl text-base font-semibold bg-[#22C55E] text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <LogIn size={20} /> Einchecken
        </button>
      )}

      {checkedIn && (
        <div className="w-full py-3.5 rounded-xl text-base font-semibold bg-green-50 text-[#22C55E] text-center mb-6">
          Eingechekt
        </div>
      )}

      {/* Bottom Actions */}
      <div className="border-t border-gray-100 pt-4 mt-2 space-y-1">
        <button
          onClick={onSickLeave}
          className="w-full flex items-center justify-center gap-2 text-sm text-[#EF4444] hover:bg-red-50 transition-colors py-3 rounded-lg font-medium"
        >
          <Heart size={16} /> Krank melden
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 text-sm text-[#64748B] hover:bg-gray-50 transition-colors py-3 rounded-lg"
        >
          <LogOut size={16} /> Abmelden
        </button>
      </div>
    </div>
  );
}
