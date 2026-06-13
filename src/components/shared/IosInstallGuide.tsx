import { useState } from 'react';
import { Download } from 'lucide-react';
import { useLang } from '../../hooks/useLang';

const steps: Record<string, [string, string, string]> = {
  de: [
    '1. Tippe auf das Teilen-Symbol unten in Safari',
    '2. Scrolle zu "Zum Home-Bildschirm"',
    '3. Tippe auf "Hinzufügen"',
  ],
  en: [
    '1. Tap the Share icon at the bottom of Safari',
    '2. Scroll to "Add to Home Screen"',
    '3. Tap "Add"',
  ],
  ar: [
    '1. اضغط على أيقونة المشاركة في أسفل Safari',
    '2. اختر "إضافة إلى الشاشة الرئيسية"',
    '3. اضغط "إضافة"',
  ],
  ro: [
    '1. Apasă iconița Share din josul Safari',
    '2. Derulează la "Adaugă la ecranul principal"',
    '3. Apasă "Adaugă"',
  ],
  pl: [
    '1. Dotknij ikony Udostępnij na dole Safari',
    '2. Przewiń do "Dodaj do ekranu głównego"',
    '3. Dotknij "Dodaj"',
  ],
};

const dismissLabel: Record<string, string> = {
  de: 'Verstanden', en: 'Got it', ar: 'فهمت', ro: 'Am înțeles', pl: 'Rozumiem',
};

const installLabel: Record<string, string> = {
  de: 'App installieren', en: 'Install App', ar: 'تثبيت التطبيق', ro: 'Instalează App', pl: 'Zainstaluj App',
};

function IosInstallModal({ onClose }: { onClose: () => void }) {
  const { lang, rtl } = useLang();
  const langKey = steps[lang] ? lang : 'de';
  const localSteps = steps[langKey];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        dir={rtl ? 'rtl' : 'ltr'}
        style={{
          width: '100%',
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 36px',
        }}
      >
        <p style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 16, textAlign: 'center' }}>
          {installLabel[langKey]}
        </p>
        <img
          src="/ios-guide.png"
          alt="iOS install guide"
          style={{ width: '100%', borderRadius: 12, display: 'block', marginBottom: 16 }}
        />
        <ol style={{ margin: '0 0 20px', padding: rtl ? '0 16px 0 0' : '0 0 0 16px', listStyle: 'none' }}>
          {localSteps.map((s, i) => (
            <li key={i} style={{ fontSize: 14, color: '#374151', marginBottom: 8, lineHeight: 1.5 }}>{s}</li>
          ))}
        </ol>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: '#0d0d0d', color: '#fff',
            border: 'none', borderRadius: 12,
            padding: '14px 0', fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {dismissLabel[langKey]}
        </button>
      </div>
    </div>
  );
}

export function IosInstallButton() {
  const [open, setOpen] = useState(false);
  const { lang } = useLang();

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (!isIos || isStandalone) return null;

  const langKey = steps[lang] ? lang : 'de';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#0d0d0d', color: '#fff',
          border: 'none', borderRadius: 12,
          padding: '10px 16px', fontSize: 14, fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Download size={16} color="#fff" />
        {installLabel[langKey]}
      </button>
      {open && <IosInstallModal onClose={() => setOpen(false)} />}
    </>
  );
}
