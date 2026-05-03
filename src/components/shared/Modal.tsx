import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}

export function Modal({ open, onClose, children, width = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handler);
      return () => { document.removeEventListener('keydown', handler); };
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-surface-0 rounded-2xl shadow-modal ${width} w-full max-h-[85vh] overflow-y-auto animate-scale-in`}>
        <button onClick={onClose} className="absolute top-5 right-5 p-1.5 rounded-lg text-ink-300 hover:text-ink-700 hover:bg-surface-50 transition-all z-10">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
