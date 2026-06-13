import { useState, useEffect } from 'react';

export function IosInstallGuide() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('ios-install-dismissed');
    if (isIos && !isStandalone && !dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem('ios-install-dismissed', 'true');
    setVisible(false);
  };

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 32px',
        }}
      >
        <p style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 16, textAlign: 'center' }}>
          App installieren
        </p>
        <img src="/ios-guide.png" alt="iOS Installationsanleitung" style={{ width: '100%', borderRadius: 12, display: 'block' }} />
        <button
          onClick={handleDismiss}
          style={{
            marginTop: 20, width: '100%',
            background: '#0d0d0d', color: '#fff',
            border: 'none', borderRadius: 12,
            padding: '14px 0', fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Verstanden
        </button>
      </div>
    </div>
  );
}
