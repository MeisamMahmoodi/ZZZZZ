import { useState, useRef, useCallback } from 'react';
import { Camera, Check, X, RotateCcw, Loader2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { t as translate, langLocale, type Lang } from '../../lib/i18n';

interface CheckOutFlowProps {
  assignmentId: string;
  propertyName: string;
  checkedInAt: string;
  onSuccess: () => void;
  onCancel: () => void;
  rtl?: boolean;
  lang?: Lang;
}

type Step = 'intro' | 'camera' | 'preview' | 'uploading' | 'done';

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export function CheckOutFlow({ assignmentId, propertyName, checkedInAt, onSuccess, onCancel, rtl, lang = 'de' }: CheckOutFlowProps) {
  const tr = (key: Parameters<typeof translate>[1]) => translate(lang, key);
  const locale = langLocale[lang];

  const [step, setStep] = useState<Step>('intro');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [doneTime, setDoneTime] = useState<Date | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const now = new Date();
  const checkedInTime = new Date(checkedInAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const nowTime = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const elapsedMs = now.getTime() - new Date(checkedInAt).getTime();
  const elapsedLabel = formatDuration(elapsedMs);
  const clockSuffix = translate(lang, 'clock') ? ' ' + translate(lang, 'clock') : '';

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
      setUploadError(tr('cameraError'));
      setStep('intro');
    }
  }, [lang]);

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

  const getGPS = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

  const uploadAndCheckOut = useCallback(async () => {
    if (!photoDataUrl) return;
    setStep('uploading');
    setUploadError('');
    const completedAt = new Date();

    try {
      const [coords, blob] = await Promise.all([
        getGPS(),
        fetch(photoDataUrl).then(r => r.blob()),
      ]);

      const filename = `checkout/${assignmentId}_${Date.now()}.jpg`;
      const { error: storageErr } = await supabase.storage
        .from('assignment-photos')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: true });
      if (storageErr) throw new Error(storageErr.message);

      const { data: urlData } = supabase.storage.from('assignment-photos').getPublicUrl(filename);

      const { error: dbErr } = await supabase.from('assignments').update({
        status: 'completed',
        completed_at: completedAt.toISOString(),
        checkout_photo_url: urlData.publicUrl,
        checkout_lat: coords?.lat ?? null,
        checkout_lng: coords?.lng ?? null,
      }).eq('id', assignmentId);
      if (dbErr) throw new Error(dbErr.message);

      setDoneTime(completedAt);
      setStep('done');
      setTimeout(onSuccess, 1800);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : tr('checkOutError'));
      setStep('preview');
    }
  }, [photoDataUrl, assignmentId, onSuccess, lang]);

  const handleCancel = () => { stopCamera(); onCancel(); };

  const finalDuration = doneTime
    ? formatDuration(doneTime.getTime() - new Date(checkedInAt).getTime())
    : elapsedLabel;

  return (
    <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 ${rtl ? 'text-right' : 'text-left'}`}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl overflow-hidden" style={{ maxHeight: '95dvh' }}>

        {/* Intro */}
        {step === 'intro' && (
          <div className="p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0F172A]">{tr('checkOutTitle')}</h2>
              <button onClick={handleCancel} className="p-2 rounded-xl hover:bg-[#F1F5F9] transition-colors">
                <X size={18} className="text-[#94A3B8]" />
              </button>
            </div>

            <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-6">
              <p className="text-sm font-semibold text-[#0F172A]">{propertyName}</p>
              <div className="flex items-center gap-5 mt-3">
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide mb-0.5">{tr('checkedInLabel')}</p>
                  <p className="text-sm font-bold text-[#0F172A]">{checkedInTime}{clockSuffix}</p>
                </div>
                <div className="w-px h-8 bg-[#E2E8F0]" />
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide mb-0.5">{tr('nowLabel')}</p>
                  <p className="text-sm font-bold text-[#0F172A]">{nowTime}{clockSuffix}</p>
                </div>
                <div className="w-px h-8 bg-[#E2E8F0]" />
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide mb-0.5">{tr('durationLabel')}</p>
                  <p className="text-sm font-bold text-[#22C55E]">{elapsedLabel}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center py-4 mb-4">
              <div className="w-20 h-20 rounded-3xl bg-[#FFF7ED] flex items-center justify-center mb-4">
                <Camera size={36} className="text-[#F97316]" />
              </div>
              <p className="text-sm font-semibold text-[#0F172A] text-center">{tr('proofPhoto')}</p>
              <p className="text-sm text-[#64748B] text-center mt-1">
                {tr('proofPhotoDesc')}
              </p>
            </div>

            {uploadError && <p className="text-xs text-[#EF4444] text-center mb-4">{uploadError}</p>}

            <button onClick={startCamera}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-[#F97316] text-white hover:bg-[#EA580C] transition-colors flex items-center justify-center gap-2">
              <Camera size={16} /> {tr('photoCheckout')}
            </button>
          </div>
        )}

        {/* Camera */}
        {step === 'camera' && (
          <div className="relative bg-black" style={{ minHeight: '60dvh' }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full object-cover" style={{ maxHeight: '70dvh' }} />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-6 border-2 border-white/30 rounded-2xl" />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-white text-xs font-semibold">{tr('takeWorkPhoto')}</p>
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

        {/* Preview */}
        {step === 'preview' && photoDataUrl && (
          <div>
            <div className="relative">
              <img src={photoDataUrl} alt={tr('proofPhoto')} className="w-full object-cover" style={{ maxHeight: '55dvh' }} />
            </div>
            <div className="p-6">
              <h3 className="text-base font-bold text-[#0F172A] mb-1">{tr('reviewPhoto')}</h3>
              <p className="text-sm text-[#64748B] mb-5">{tr('reviewWorkDesc')}</p>
              {uploadError && <p className="text-xs text-[#EF4444] mb-4">{uploadError}</p>}
              <div className="flex gap-3">
                <button onClick={retakePhoto} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] transition-colors flex items-center justify-center gap-2">
                  <RotateCcw size={15} /> {tr('retake')}
                </button>
                <button onClick={uploadAndCheckOut} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold bg-[#F97316] text-white hover:bg-[#EA580C] transition-colors flex items-center justify-center gap-2">
                  <Check size={15} /> {tr('checkOutSuccess')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Uploading */}
        {step === 'uploading' && (
          <div className="p-10 flex flex-col items-center justify-center" style={{ minHeight: '40dvh' }}>
            <Loader2 size={40} className="text-[#F97316] animate-spin mb-5" />
            <p className="text-sm font-semibold text-[#0F172A]">{tr('checkingOut')}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{tr('uploadingPhoto')}</p>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="p-10 flex flex-col items-center justify-center" style={{ minHeight: '40dvh' }}>
            <div className="w-20 h-20 rounded-3xl bg-[#FFF7ED] flex items-center justify-center mb-5">
              <Check size={40} className="text-[#F97316]" />
            </div>
            <p className="text-lg font-bold text-[#0F172A]">{tr('checkOutSuccess')}</p>
            <div className="flex items-center gap-2 mt-2 bg-[#F8FAFC] rounded-xl px-4 py-2">
              <Clock size={14} className="text-[#94A3B8]" />
              <p className="text-sm text-[#64748B]">{tr('durationPrefix')}<span className="font-bold text-[#0F172A]">{finalDuration}</span></p>
            </div>
            <p className="text-xs text-[#94A3B8] mt-2">{tr('recordedInBilling')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
