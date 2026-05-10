import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, MapPin, Check, X, RotateCcw, Loader2, AlertTriangle, Navigation } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CheckInFlowProps {
  assignmentId: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  propertyLat?: number | null;
  propertyLng?: number | null;
  propertyRadiusM?: number | null;
  onSuccess: () => void;
  onCancel: () => void;
  rtl?: boolean;
}

type Step = 'gps' | 'camera' | 'preview' | 'uploading' | 'done';
type GpsState = 'idle' | 'geocoding' | 'locating' | 'ok' | 'too_far' | 'error';

// Haversine distance in meters
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Geocode address via Nominatim (OSM, no key required)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
    const data = await res.json();
    if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    return null;
  } catch {
    return null;
  }
}

export function CheckInFlow({
  assignmentId, propertyId, propertyName, propertyAddress,
  propertyLat, propertyLng, propertyRadiusM,
  onSuccess, onCancel, rtl,
}: CheckInFlowProps) {
  const [step, setStep] = useState<Step>('gps');
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [employeeCoords, setEmployeeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lng: number } | null>(
    propertyLat && propertyLng ? { lat: propertyLat, lng: propertyLng } : null
  );
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const radius = propertyRadiusM ?? 300;

  // Auto-start GPS check on mount
  useEffect(() => { checkProximity(); }, []);

  const checkProximity = useCallback(async () => {
    setGpsState('locating');
    setGpsError('');
    setDistanceM(null);

    // 1. Get employee location
    const empCoords = await new Promise<{ lat: number; lng: number } | null>(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => {
          if (err.code === 1) setGpsError('GPS-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.');
          else setGpsError('GPS nicht verfuegbar. Bitte erneut versuchen.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });

    if (!empCoords) { setGpsState('error'); return; }
    setEmployeeCoords(empCoords);

    // 2. Get or geocode property coords
    let propCoords = targetCoords;
    if (!propCoords) {
      setGpsState('geocoding');
      propCoords = await geocodeAddress(propertyAddress);
      if (propCoords) {
        setTargetCoords(propCoords);
        // Cache coords in DB so next time is instant
        await supabase.from('properties').update({ lat: propCoords.lat, lng: propCoords.lng }).eq('id', propertyId);
      }
    }

    if (!propCoords) {
      // Could not geocode — allow check-in but note it
      setGpsState('ok');
      setDistanceM(null);
      return;
    }

    // 3. Compare distance
    const dist = distanceMeters(empCoords.lat, empCoords.lng, propCoords.lat, propCoords.lng);
    setDistanceM(Math.round(dist));

    if (dist <= radius) {
      setGpsState('ok');
    } else {
      setGpsState('too_far');
    }
  }, [targetCoords, propertyAddress, propertyId, radius]);

  const startCamera = useCallback(async () => {
    setStep('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setUploadError('Kamera konnte nicht geöffnet werden. Bitte Berechtigung erteilen.');
      setStep('gps');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    setPhotoDataUrl(c.toDataURL('image/jpeg', 0.85));
    stopCamera();
    setStep('preview');
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setPhotoDataUrl(null);
    startCamera();
  }, [startCamera]);

  const uploadAndCheckIn = useCallback(async () => {
    if (!photoDataUrl) return;
    setStep('uploading');
    setUploadError('');
    try {
      const blob = await (await fetch(photoDataUrl)).blob();
      const filename = `checkin/${assignmentId}_${Date.now()}.jpg`;
      const { error: storageErr } = await supabase.storage
        .from('assignment-photos')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: true });
      if (storageErr) throw new Error(storageErr.message);

      const { data: urlData } = supabase.storage.from('assignment-photos').getPublicUrl(filename);

      const { error: dbErr } = await supabase.from('assignments').update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
        checkin_photo_url: urlData.publicUrl,
        checkin_lat: employeeCoords?.lat ?? null,
        checkin_lng: employeeCoords?.lng ?? null,
      }).eq('id', assignmentId);
      if (dbErr) throw new Error(dbErr.message);

      setStep('done');
      setTimeout(onSuccess, 1200);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Fehler beim Einchecken');
      setStep('preview');
    }
  }, [photoDataUrl, assignmentId, employeeCoords, onSuccess]);

  const handleCancel = () => { stopCamera(); onCancel(); };

  const distLabel = distanceM != null
    ? distanceM >= 1000 ? `${(distanceM / 1000).toFixed(1)} km` : `${distanceM} m`
    : null;

  return (
    <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 ${rtl ? 'text-right' : 'text-left'}`}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl overflow-hidden" style={{ maxHeight: '95dvh' }}>

        {/* GPS Step */}
        {step === 'gps' && (
          <div className="p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0F172A]">Einchecken</h2>
              <button onClick={handleCancel} className="p-2 rounded-xl hover:bg-[#F1F5F9] transition-colors">
                <X size={18} className="text-[#94A3B8]" />
              </button>
            </div>

            {/* Property card */}
            <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-6">
              <p className="text-sm font-semibold text-[#0F172A]">{propertyName}</p>
              <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5">
                <MapPin size={11} className="shrink-0" />{propertyAddress}
              </p>
            </div>

            {/* GPS Status */}
            <div className="flex flex-col items-center py-5">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 transition-all ${
                gpsState === 'ok' ? 'bg-[#DCFCE7]' :
                gpsState === 'too_far' ? 'bg-[#FEF2F2]' :
                gpsState === 'error' ? 'bg-[#FFF7ED]' : 'bg-[#EFF6FF]'
              }`}>
                {(gpsState === 'locating' || gpsState === 'geocoding') ? (
                  <Loader2 size={36} className="text-[#3B82F6] animate-spin" />
                ) : gpsState === 'ok' ? (
                  <Check size={36} className="text-[#22C55E]" />
                ) : gpsState === 'too_far' ? (
                  <Navigation size={36} className="text-[#EF4444]" />
                ) : gpsState === 'error' ? (
                  <AlertTriangle size={36} className="text-[#F97316]" />
                ) : (
                  <MapPin size={36} className="text-[#3B82F6]" />
                )}
              </div>

              {gpsState === 'idle' && (
                <p className="text-sm text-[#64748B] text-center">Standort wird geprueft...</p>
              )}
              {gpsState === 'locating' && (
                <p className="text-sm text-[#64748B] text-center">GPS wird ermittelt...</p>
              )}
              {gpsState === 'geocoding' && (
                <p className="text-sm text-[#64748B] text-center">Objektadresse wird geolocated...</p>
              )}
              {gpsState === 'ok' && (
                <div className="text-center">
                  <p className="text-sm font-bold text-[#22C55E]">Standort bestätigt</p>
                  {distLabel && (
                    <p className="text-xs text-[#64748B] mt-1">{distLabel} vom Objekt entfernt</p>
                  )}
                  {!distLabel && (
                    <p className="text-xs text-[#94A3B8] mt-1">Adresse konnte nicht verifiziert werden</p>
                  )}
                </div>
              )}
              {gpsState === 'too_far' && (
                <div className="text-center">
                  <p className="text-sm font-bold text-[#EF4444]">Zu weit entfernt</p>
                  <p className="text-xs text-[#64748B] mt-1">
                    Du bist {distLabel} vom Objekt entfernt.<br />
                    Erlaubt: bis {radius} m
                  </p>
                </div>
              )}
              {gpsState === 'error' && (
                <p className="text-xs text-[#F97316] text-center max-w-[260px]">{gpsError}</p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {(gpsState === 'too_far' || gpsState === 'error') && (
                <button onClick={checkProximity}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] transition-colors flex items-center justify-center gap-2">
                  <RotateCcw size={15} /> Erneut versuchen
                </button>
              )}
              {gpsState === 'ok' && (
                <button onClick={startCamera}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2">
                  <Camera size={16} /> Gebäude fotografieren
                </button>
              )}
              {gpsState === 'too_far' && (
                <p className="text-xs text-center text-[#94A3B8]">
                  Du musst vor Ort sein um einzuchecken.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Camera Step */}
        {step === 'camera' && (
          <div className="relative bg-black" style={{ minHeight: '60dvh' }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full object-cover" style={{ maxHeight: '70dvh' }} />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-6 border-2 border-white/30 rounded-2xl" />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-white text-xs font-semibold text-center">Gebäude fotografieren</p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent">
              <button onClick={handleCancel} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <X size={20} className="text-white" />
              </button>
              <button onClick={takePhoto}
                className="rounded-full bg-white border-4 border-white/30 shadow-lg flex items-center justify-center transition-transform active:scale-95"
                style={{ width: 72, height: 72 }}>
                <div className="w-14 h-14 rounded-full bg-white" />
              </button>
              <div className="w-12 h-12" />
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && photoDataUrl && (
          <div>
            <div className="relative">
              <img src={photoDataUrl} alt="Gebäude-Foto" className="w-full object-cover" style={{ maxHeight: '55dvh' }} />
              {employeeCoords && (
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#22C55E]" />
                  <span className="text-white text-[11px] font-medium">
                    GPS: {distLabel ? `${distLabel} vom Objekt` : 'verifiziert'}
                  </span>
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-base font-bold text-[#0F172A] mb-1">Foto prüfen</h3>
              <p className="text-sm text-[#64748B] mb-5">Ist das Gebäude gut erkennbar?</p>
              {uploadError && <p className="text-xs text-[#EF4444] mb-4">{uploadError}</p>}
              <div className="flex gap-3">
                <button onClick={retakePhoto} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] transition-colors flex items-center justify-center gap-2">
                  <RotateCcw size={15} /> Nochmal
                </button>
                <button onClick={uploadAndCheckIn} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2">
                  <Check size={15} /> Einchecken
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Uploading */}
        {step === 'uploading' && (
          <div className="p-10 flex flex-col items-center justify-center" style={{ minHeight: '40dvh' }}>
            <Loader2 size={40} className="text-[#22C55E] animate-spin mb-5" />
            <p className="text-sm font-semibold text-[#0F172A]">Einchecken...</p>
            <p className="text-xs text-[#94A3B8] mt-1">Foto wird hochgeladen</p>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="p-10 flex flex-col items-center justify-center" style={{ minHeight: '40dvh' }}>
            <div className="w-20 h-20 rounded-3xl bg-[#DCFCE7] flex items-center justify-center mb-5">
              <Check size={40} className="text-[#22C55E]" />
            </div>
            <p className="text-lg font-bold text-[#0F172A]">Eingecheckt!</p>
            <p className="text-sm text-[#64748B] mt-1">{new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</p>
          </div>
        )}
      </div>
    </div>
  );
}
