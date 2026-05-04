import { useState, useRef, useCallback } from 'react';
import { Camera, MapPin, Check, X, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CheckInFlowProps {
  assignmentId: string;
  propertyName: string;
  propertyAddress: string;
  onSuccess: () => void;
  onCancel: () => void;
  rtl?: boolean;
}

type Step = 'gps' | 'camera' | 'preview' | 'uploading' | 'done';

export function CheckInFlow({ assignmentId, propertyName, propertyAddress, onSuccess, onCancel, rtl }: CheckInFlowProps) {
  const [step, setStep] = useState<Step>('gps');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getGPS = useCallback(() => {
    setGpsStatus('loading');
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus('ok');
      },
      err => {
        setGpsError(err.code === 1 ? 'GPS-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.' : 'GPS nicht verfügbar. Bitte versuche es erneut.');
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

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
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.85));
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
      // Convert data URL to blob
      const res = await fetch(photoDataUrl);
      const blob = await res.blob();
      const filename = `checkin/${assignmentId}_${Date.now()}.jpg`;

      const { error: storageError } = await supabase.storage
        .from('assignment-photos')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: true });

      if (storageError) throw new Error(storageError.message);

      const { data: urlData } = supabase.storage.from('assignment-photos').getPublicUrl(filename);
      const photoUrl = urlData.publicUrl;

      const { error: dbError } = await supabase.from('assignments').update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
        checkin_photo_url: photoUrl,
        checkin_lat: coords?.lat ?? null,
        checkin_lng: coords?.lng ?? null,
      }).eq('id', assignmentId);

      if (dbError) throw new Error(dbError.message);

      setStep('done');
      setTimeout(onSuccess, 1200);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Fehler beim Hochladen');
      setStep('preview');
    }
  }, [photoDataUrl, assignmentId, coords, onSuccess]);

  // Cleanup on unmount
  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 ${rtl ? 'text-right' : 'text-left'}`}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl overflow-hidden" style={{ maxHeight: '95dvh' }}>

        {/* GPS Step */}
        {step === 'gps' && (
          <div className="p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0F172A]">Einchecken</h2>
              <button onClick={handleCancel} className="p-2 rounded-xl hover:bg-[#F1F5F9] transition-colors"><X size={18} className="text-[#94A3B8]" /></button>
            </div>

            <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-6">
              <p className="text-sm font-semibold text-[#0F172A]">{propertyName}</p>
              <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5"><MapPin size={11} />{propertyAddress}</p>
            </div>

            <div className="flex flex-col items-center py-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 transition-all ${gpsStatus === 'ok' ? 'bg-[#DCFCE7]' : gpsStatus === 'error' ? 'bg-[#FEF2F2]' : 'bg-[#EFF6FF]'}`}>
                {gpsStatus === 'loading' ? (
                  <Loader2 size={36} className="text-[#3B82F6] animate-spin" />
                ) : gpsStatus === 'ok' ? (
                  <Check size={36} className="text-[#22C55E]" />
                ) : gpsStatus === 'error' ? (
                  <AlertTriangle size={36} className="text-[#EF4444]" />
                ) : (
                  <MapPin size={36} className="text-[#3B82F6]" />
                )}
              </div>
              {gpsStatus === 'idle' && <p className="text-sm text-[#64748B] text-center">Standort wird zur Verifikation benötigt</p>}
              {gpsStatus === 'loading' && <p className="text-sm text-[#64748B] text-center">GPS wird ermittelt...</p>}
              {gpsStatus === 'ok' && (
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#22C55E]">Standort bestätigt</p>
                  <p className="text-xs text-[#94A3B8] mt-1">{coords?.lat.toFixed(5)}, {coords?.lng.toFixed(5)}</p>
                </div>
              )}
              {gpsStatus === 'error' && <p className="text-xs text-[#EF4444] text-center max-w-[260px]">{gpsError}</p>}
            </div>

            {uploadError && <p className="text-xs text-[#EF4444] text-center mb-4">{uploadError}</p>}

            <div className="space-y-3 mt-2">
              {gpsStatus !== 'ok' && (
                <button onClick={getGPS} disabled={gpsStatus === 'loading'}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-[#0F172A] text-white hover:bg-[#1E293B] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {gpsStatus === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                  GPS bestimmen
                </button>
              )}
              {gpsStatus === 'ok' && (
                <button onClick={startCamera}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2">
                  <Camera size={16} /> Foto aufnehmen
                </button>
              )}
              {gpsStatus === 'error' && (
                <button onClick={() => { setGpsStatus('ok'); setCoords(null); startCamera(); }}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-[#F97316] text-white hover:bg-[#EA580C] transition-colors flex items-center justify-center gap-2">
                  <Camera size={16} /> Trotzdem einchecken (ohne GPS)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Camera Step */}
        {step === 'camera' && (
          <div className="relative bg-black" style={{ minHeight: '60dvh' }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full object-cover" style={{ maxHeight: '70dvh' }} />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay guide */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-6 border-2 border-white/30 rounded-2xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[80%] bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-white text-xs font-medium text-center">Gebäude fotografieren</p>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent">
              <button onClick={handleCancel} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <X size={20} className="text-white" />
              </button>
              <button onClick={takePhoto}
                className="w-18 h-18 rounded-full bg-white border-4 border-white/30 shadow-lg flex items-center justify-center transition-transform active:scale-95"
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
              <img src={photoDataUrl} alt="Aufgenommenes Foto" className="w-full object-cover" style={{ maxHeight: '55dvh' }} />
              {coords && (
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#22C55E]" />
                  <span className="text-white text-[11px] font-medium">GPS verifiziert</span>
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
