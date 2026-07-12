import { useState, useEffect } from 'react';
import { Clock, Check, CalendarDays, MapPin, Camera, Image, Navigation, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/shared/Avatar';
import { Modal } from '../../components/shared/Modal';
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
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; label: string } | null>(null);

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

  const mapsUrl = (lat: number, lng: number) =>
    `https://www.google.com/maps?q=${lat},${lng}`;

  // Customer-facing proof-of-service report — free on every plan, not gated
  // behind a paywall, since it's the report the owner hands to their own
  // client and every copy carries the "Erstellt mit meizo.de" footer.
  const handleCustomerReport = (a: AssignmentWithDetails) => {
    if (!a.checked_in_at || !a.completed_at) return;

    const checkInTime = new Date(a.checked_in_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const checkOutTime = new Date(a.completed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const durationMin = Math.round((new Date(a.completed_at).getTime() - new Date(a.checked_in_at).getTime()) / 60000);
    const dH = Math.floor(durationMin / 60);
    const dM = durationMin % 60;
    const durationLabel = dH > 0 ? `${dH}h ${dM}min` : `${dM}min`;

    const dateLabel = new Date(a.date + 'T12:00:00').toLocaleDateString('de-DE', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });

    const hasGps = !!(a.checkin_lat && a.checkin_lng);
    const gpsBadge = hasGps
      ? '<span class="badge-ok">✓ Vor Ort bestätigt</span>'
      : '<span style="color:#9ca3af;font-size:11px;">Nicht verfügbar</span>';

    const photoBox = (url: string | null | undefined, caption: string) => url
      ? `<div class="photo-box"><div class="cap">${caption}</div><img src="${url}" alt="${caption}"/></div>`
      : '';

    const photosHtml = [
      photoBox(a.checkin_photo_url, 'Vorher (Check-in)'),
      photoBox(a.checkout_photo_url, 'Nachher (Fertig)'),
    ].filter(Boolean).join('');

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"/>
<title>Reinigungsnachweis ${a.property?.name || ''} — ${a.date}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; background:#fff; padding: 32px 36px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .header-left .company { font-size: 22px; font-weight: 700; color:#111; }
  .header-left .sub { font-size: 11px; color: #6b7280; margin-top: 4px; }
  .header-right { text-align: right; }
  .header-right .label { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #6b7280; }
  .header-right .date { font-size: 18px; font-weight: 700; color: #111; margin-top: 2px; }
  hr { border: none; border-top: 2px solid #111; margin-bottom: 24px; }
  .info-grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom:16px; }
  .info-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; }
  .info-box .label { font-size: 9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#9ca3af; margin-bottom:4px; }
  .info-box .value { font-size: 13px; font-weight:600; color:#111; }
  .badge-ok { display:inline-flex; align-items:center; gap:4px; background:#dcfce7; color:#15803d; font-weight:700; padding:3px 8px; border-radius:10px; font-size:11px; }
  .photos { display:flex; gap: 16px; margin-top: 20px; }
  .photo-box { flex:1; }
  .photo-box .cap { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#6b7280; margin-bottom:6px; }
  .photo-box img { width:100%; border-radius:8px; border:1px solid #e5e7eb; max-height: 300px; object-fit: cover; display:block; }
  .footer { margin-top: 40px; font-size: 9px; color: #9ca3af; text-align:center; }
  @media print { body { padding: 24px 28px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="company">${company.name}</div>
      <div class="sub">Reinigungsnachweis</div>
    </div>
    <div class="header-right">
      <div class="label">Datum</div>
      <div class="date">${dateLabel}</div>
    </div>
  </div>
  <hr/>
  <div class="info-grid">
    <div class="info-box">
      <div class="label">Objekt</div>
      <div class="value">${a.property?.name || ''}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px;">${a.property?.address || ''}</div>
    </div>
    <div class="info-box">
      <div class="label">Zeitraum</div>
      <div class="value">${checkInTime} – ${checkOutTime} Uhr</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px;">Dauer: ${durationLabel}</div>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-box">
      <div class="label">Durchgeführt von</div>
      <div class="value">${a.employee?.first_name || ''}</div>
    </div>
    <div class="info-box">
      <div class="label">Standort-Bestätigung</div>
      <div class="value">${gpsBadge}</div>
    </div>
  </div>
  ${photosHtml ? `<div class="photos">${photosHtml}</div>` : ''}
  <div class="footer">Erstellt automatisch mit meizo.de</div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Zeitstempel</h1>
          <p className="text-[#64748B] text-sm mt-1.5">Check-in/out mit Foto und GPS-Nachweis</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="input-field !w-auto"
        />
      </div>

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
          <p className="text-xs text-[#94A3B8] mt-2">kein Check-in</p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarDays size={40} className="text-[#CBD5E1] mx-auto mb-4" />
          <p className="text-sm text-[#94A3B8]">Keine Einsaetze fuer diesen Tag</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* With timestamps */}
          {withTimestamps.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Zeitstempel erfasst</h2>
              <div className="card divide-y divide-[#F1F5F9]">
                {withTimestamps
                  .sort((a, b) => (a.completed_at || a.checked_in_at || '').localeCompare(b.completed_at || b.checked_in_at || ''))
                  .map(a => {
                    const duration = a.checked_in_at && a.completed_at
                      ? Math.round((new Date(a.completed_at).getTime() - new Date(a.checked_in_at).getTime()) / 60000)
                      : null;
                    const dH = duration != null ? Math.floor(duration / 60) : 0;
                    const dM = duration != null ? duration % 60 : 0;
                    const durationLabel = duration != null
                      ? (dH > 0 ? `${dH}h ${dM}min` : `${dM}min`)
                      : null;

                    return (
                      <div key={a.id} className="px-5 sm:px-6 py-4">
                        {/* Row 1: employee + property + timestamps */}
                        <div className="flex items-start gap-4">
                          <Avatar firstName={a.employee?.first_name || ''} lastName={a.employee?.last_name || ''} id={a.employee_id} size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0F172A]">
                              {a.employee?.first_name} {a.employee?.last_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <MapPin size={11} className="text-[#94A3B8] shrink-0" />
                              <p className="text-xs text-[#64748B] truncate">{a.property?.name}</p>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock size={11} className="text-[#94A3B8] shrink-0" />
                              <p className="text-xs text-[#64748B]">
                                {formatTime(a.time_from ?? a.property?.time_from ?? '')} – {formatTime(a.time_to ?? a.property?.time_to ?? '')} Uhr
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
                                <span className="text-[10px] text-[#94A3B8] w-16">Check-in</span>
                              </div>
                            )}
                            {a.completed_at && (
                              <div className="flex items-center justify-end gap-1.5">
                                <Check size={12} className="text-[#22C55E]" />
                                <span className="text-xs font-semibold text-[#0F172A]">
                                  {new Date(a.completed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-[10px] text-[#94A3B8] w-16">Fertig</span>
                              </div>
                            )}
                            {durationLabel && (
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[11px] font-bold text-[#0F172A] bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 rounded-lg">
                                  {durationLabel}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payroll note */}
                        {a.status === 'completed' && durationLabel && (
                          <div className="mt-2 pl-14 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-semibold text-[#22C55E] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-1 rounded-full">
                              Wird in Abrechnung erfasst · {durationLabel}
                            </span>
                            <button
                              onClick={() => handleCustomerReport(a)}
                              className="flex items-center gap-1.5 text-[10px] font-semibold text-[#3B82F6] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-full hover:bg-[#DBEAFE] transition-colors"
                              title="Nachweis-PDF für deinen Kunden erstellen"
                            >
                              <FileText size={11} /> PDF für Kunde
                            </button>
                          </div>
                        )}
                        {a.status === 'checked_in' && a.checked_in_at && (
                          <div className="mt-2 pl-14">
                            <span className="text-[10px] font-semibold text-[#3B82F6] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-full">
                              Noch eingecheckt · seit {new Date(a.checked_in_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                            </span>
                          </div>
                        )}

                        {/* Row 2: Photos + GPS */}
                        {(a.checkin_photo_url || a.checkout_photo_url || a.checkin_lat || a.checkout_lat) && (
                          <div className="mt-3 flex flex-wrap gap-3 pl-14">
                            {/* Check-in photo */}
                            {a.checkin_photo_url && (
                              <button
                                onClick={() => setLightboxPhoto({ url: a.checkin_photo_url!, label: `Check-in — ${a.employee?.first_name} ${a.employee?.last_name}` })}
                                className="group relative w-20 h-14 rounded-xl overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#3B82F6] transition-colors shrink-0"
                              >
                                <img src={a.checkin_photo_url} alt="Check-in Foto" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Camera size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-[#3B82F6]/80 py-0.5 px-1.5">
                                  <p className="text-[9px] font-semibold text-white">Check-in</p>
                                </div>
                              </button>
                            )}

                            {/* Checkout photo */}
                            {a.checkout_photo_url && (
                              <button
                                onClick={() => setLightboxPhoto({ url: a.checkout_photo_url!, label: `Auschecken — ${a.employee?.first_name} ${a.employee?.last_name}` })}
                                className="group relative w-20 h-14 rounded-xl overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#22C55E] transition-colors shrink-0"
                              >
                                <img src={a.checkout_photo_url} alt="Checkout Foto" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Camera size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-[#22C55E]/80 py-0.5 px-1.5">
                                  <p className="text-[9px] font-semibold text-white">Fertig</p>
                                </div>
                              </button>
                            )}

                            {/* GPS links */}
                            {a.checkin_lat && a.checkin_lng && (
                              <a href={mapsUrl(a.checkin_lat, a.checkin_lng)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] text-[#3B82F6] text-[11px] font-semibold rounded-lg hover:bg-[#DBEAFE] transition-colors">
                                <Navigation size={11} /> Check-in GPS
                              </a>
                            )}
                            {a.checkout_lat && a.checkout_lng && (
                              <a href={mapsUrl(a.checkout_lat, a.checkout_lng)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0FDF4] text-[#22C55E] text-[11px] font-semibold rounded-lg hover:bg-[#DCFCE7] transition-colors">
                                <Navigation size={11} /> Fertig GPS
                              </a>
                            )}

                            {/* Placeholders if no photo yet */}
                            {!a.checkin_photo_url && a.checked_in_at && (
                              <div className="w-20 h-14 rounded-xl bg-[#F8FAFC] border border-dashed border-[#CBD5E1] flex flex-col items-center justify-center shrink-0">
                                <Image size={14} className="text-[#CBD5E1]" />
                                <p className="text-[9px] text-[#CBD5E1] mt-0.5">Kein Foto</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Without timestamps */}
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

      {/* Photo Lightbox */}
      <Modal open={!!lightboxPhoto} onClose={() => setLightboxPhoto(null)} width="max-w-2xl">
        {lightboxPhoto && (
          <div>
            <img src={lightboxPhoto.url} alt={lightboxPhoto.label} className="w-full object-contain rounded-t-2xl" style={{ maxHeight: '70vh' }} />
            <div className="px-6 py-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0F172A]">{lightboxPhoto.label}</p>
              <button onClick={() => setLightboxPhoto(null)} className="btn-ghost text-sm">Schliessen</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
