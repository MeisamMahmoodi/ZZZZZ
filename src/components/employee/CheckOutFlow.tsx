import { useState, useRef, useCallback } from 'react';
import { Camera, MapPin, Check, X, RotateCcw, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CheckOutFlowProps {
  assignmentId: string;
  propertyName: string;
  checkedInAt: string;
  onSuccess: () => void;
  onCancel: () => void;
  rtl?: boolean;
}

type Step = 'intro' | 'camera' | 'preview' | 'uploading' | 'done';

export function CheckOutFlow({ assignmentId, propertyName, checkedInAt, onSuccess, onCancel, rtl }: CheckOutFlowProps) {
  const [step, setStep] = useState<Step>('intro');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const checkedInTime = new Date(checkedInAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const now = new Date();
  const elapsedMs = now.getTime() - new Date(checkedInAt).getTime();
  const elapsedMin = Math.round(elapsedMs / 60000);
  const elapsedH = Math.floor(elapsedMin / 60);
  const elapsedM = elapsedMin % 60;
  const elapsedLabel = elapsedH > 0 ? `${elapsedH}h ${elapsedM}min` : `${elapsedM}min`;

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
      setUploadError('Kamera konnte nicht geöffnet werden.');
      setStep('intro');
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

    try {
      const coords = await getGPS();

      const res = await fetch(photoDataUrl);
      const blob = await res.blob();
      const filename = `checkout/${assignmentId}_${Date.now()}.jpg`;

      const { error: storageError } = await supabase.storage
        .from('assignment-photos')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: true });

      if (storageError) throw new Error(storageError.message);

      const { data: urlData } = supabase.storage.from('assignment-photos').getPublicUrl(filename);
      const photoUrl = urlData.publicUrl;

      const { error: dbError } = await supabase.from('assignments').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        checkout_photo_url: photoUrl,
        checkout_lat: coords?.lat ?? null,
        checkout_lng: coords?.lng ?? null,
      }).eq('id', assignmentId);

      if (dbError) throw new Error(dbError.message);

      setStep('done');
      setTimeout(onSuccess, 1500);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Fehler beim Hochladen');
      setStep('preview');
    }
  }, [photoDataUrl, assignmentId, onSuccess]);

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 ${rtl ? 'text-right' : 'text-left'}`}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl overflow-hidden" style={{ maxHeight: '95dvh' }}>

        {/* Intro Step */}
        {step === 'intro' && (
          <div className="p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0F172A]">Auschecken</h2>
              <button onClick={handleCancel} className="p-2 rounded-xl hover:bg-[#F1F5F9] transition-colors"><X size={18} className="text-[#94A3B8]" /></button>
            </div>

            <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-6">
              <p className="text-sm font-semibold text-[#0F172A]">{propertyName}</p>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Einchecken</p>
                  <p className="text-sm font-semibold text-[#0F172A]">{checkedInTime} Uhr</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Dauer</p>
                  <p className="text-sm font-semibold text-[#22C55E]">{elapsedLabel}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Jetzt</p>
                  <p className="text-sm font-semibold text-[#0F172A]">{now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center py-4 mb-4">
              <div className="w-20 h-20 rounded-3xl bg-[#FFF7ED] flex items-center justify-center mb-4">
                <Camera size={36} className="text-[#F97316]" />
              </div>
              <p className="text-sm font-semibold text-[#0F172A] text-center">Foto als Nachweis</p>
              <p className="text-sm text-[#64748B] text-center mt-1">Fotografiere den gereinigten Bereich als Nachweis der erledigten Arbeit.</p>
            </div>

            {uploadError && <p className="text-xs text-[#EF4444] text-center mb-4">{uploadError}</p>}

            <button onClick={startCamera}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-[#F97316] text-white hover:bg-[#EA580C] transition-colors flex items-center justify-center gap-2">
              <Camera size={16} /> Foto & Auschecken
            </button>
          </div>
        )}

        {/* Camera Step */}
        {step === 'camera' && (
          <div className="relative bg-black" style={{ minHeight: '60dvh' }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full object-cover" style={{ maxHeight: '70dvh' }} />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-6 border-2 border-white/30 rounded-2xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[80%] bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-white text-xs font-medium text-center">Erledigten Bereich fotografieren</p>
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
              <img src={photoDataUrl} alt="Nachweis-Foto" className="w-full object-cover" style={{ maxHeight: '55dvh' }} />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <MapPin size={12} className="text-[#22C55E]" />
                <span className="text-white text-[11px] font-medium">GPS wird erfasst</span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-base font-bold text-[#0F172A] mb-1">Foto prüfen</h3>
              <p className="text-sm text-[#64748B] mb-5">Ist die erledigte Arbeit gut erkennbar?</p>
              {uploadError && <p className="text-xs text-[#EF4444] mb-4">{uploadError}</p>}
              <div className="flex gap-3">
                <button onClick={retakePhoto} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] transition-colors flex items-center justify-center gap-2">
                  <RotateCcw size={15} /> Nochmal
                </button>
                <button onClick={uploadAndCheckOut} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold bg-[#F97316] text-white hover:bg-[#EA580C] transition-colors flex items-center justify-center gap-2">
                  <Check size={15} /> Auschecken
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Uploading */}
        {step === 'uploading' && (
          <div className="p-10 flex flex-col items-center justify-center" style={{ minHeight: '40dvh' }}>
            <Loader2 size={40} className="text-[#F97316] animate-spin mb-5" />
            <p className="text-sm font-semibold text-[#0F172A]">Auschecken...</p>
            <p className="text-xs text-[#94A3B8] mt-1">Foto wird hochgeladen</p>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="p-10 flex flex-col items-center justify-center" style={{ minHeight: '40dvh' }}>
            <div className="w-20 h-20 rounded-3xl bg-[#FFF7ED] flex items-center justify-center mb-5">
              <Check size={40} className="text-[#F97316]" />
            </div>
            <p className="text-lg font-bold text-[#0F172A]">Ausgecheckt!</p>
            <p className="text-sm text-[#64748B] mt-1">Dauer: {elapsedLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}
