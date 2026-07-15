import { useState, useEffect } from 'react';
import { CheckCircle2, MapPin, Clock, Calendar, ShieldCheck, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/utils';

interface RecentEntry {
  date: string;
  time_from: string | null;
  time_to: string | null;
  checked_in_at: string | null;
  completed_at: string | null;
  gps_verified: boolean;
  employee_first_name: string;
  checklist_items: string[];
}

interface PortalStatus {
  property_name: string;
  property_type: string;
  next_date: string | null;
  recent: RecentEntry[];
}

const typeLabels: Record<string, string> = {
  office: 'Büro',
  school: 'Schule',
  supermarket: 'Supermarkt',
  doctor: 'Arztpraxis',
  other: 'Objekt',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

export function CustomerPortal() {
  const [status, setStatus] = useState<PortalStatus | null | undefined>(undefined);

  useEffect(() => {
    const token = window.location.pathname.replace('/kunde/', '').trim();
    if (!token) { setStatus(null); return; }

    supabase
      .rpc('get_public_property_status', { p_token: token })
      .then(({ data, error }) => {
        if (error || !data) { setStatus(null); return; }
        setStatus(data as PortalStatus);
      });
  }, []);

  if (status === undefined) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-[#0F172A] font-semibold mb-1.5">Link nicht gültig</p>
          <p className="text-[#64748B] text-sm">Dieser Link ist entweder falsch oder wurde deaktiviert. Bitte beim Reinigungsunternehmen nachfragen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-5 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-10 h-10 rounded-xl bg-[#0F172A] flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">{status.property_name}</h1>
            <p className="text-xs text-[#94A3B8]">{typeLabels[status.property_type] || 'Objekt'} · Reinigungsstatus</p>
          </div>
        </div>

        {status.next_date && (
          <div className="mt-6 flex items-center gap-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3">
            <Calendar size={16} className="text-[#2563EB] shrink-0" />
            <p className="text-sm text-[#0F172A]">
              Nächste geplante Reinigung: <span className="font-semibold">{formatDate(status.next_date)}</span>
            </p>
          </div>
        )}

        <p className="section-label mt-8 mb-3">Letzte Reinigungen</p>

        {status.recent.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-[#94A3B8]">Noch keine abgeschlossene Reinigung erfasst.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {status.recent.map((r, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{formatDate(r.date)}</p>
                    {r.time_from && r.time_to && (
                      <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5">
                        <Clock size={12} className="text-[#94A3B8]" /> {formatTime(r.time_from)}–{formatTime(r.time_to)} Uhr · gereinigt von {r.employee_first_name}
                      </p>
                    )}
                  </div>
                  <span className="badge-success shrink-0"><CheckCircle2 size={12} /> Erledigt</span>
                </div>

                {r.gps_verified && (
                  <p className="text-[11px] text-[#16A34A] font-medium mt-3 flex items-center gap-1.5">
                    <MapPin size={11} /> Vor-Ort-Nachweis per GPS bestätigt
                  </p>
                )}

                {r.checklist_items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex flex-wrap gap-1.5">
                    {r.checklist_items.map((item, j) => (
                      <span key={j} className="chip"><CheckCircle2 size={11} className="text-[#16A34A]" /> {item}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-[#E2E8F0] flex items-center justify-center gap-1.5 text-[11px] text-[#94A3B8]">
          <ShieldCheck size={12} /> Nur-Lese-Ansicht · Erstellt mit meizo.de
        </div>
      </div>
    </div>
  );
}
