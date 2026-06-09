import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LangProvider, useLang } from './hooks/useLang';
import { ToastProvider } from './components/shared/Toast';
import { OwnerLayout } from './components/owner/OwnerLayout';
import { Dashboard } from './pages/owner/Dashboard';
import { Employees } from './pages/owner/Employees';
import { Properties } from './pages/owner/Properties';
import { Assignments } from './pages/owner/Assignments';
import { Payroll } from './pages/owner/Payroll';
import { Timestamps } from './pages/owner/Timestamps';
import { Settings } from './pages/owner/Settings';
import { Impressum } from './pages/owner/Impressum';
import { Datenschutz } from './pages/owner/Datenschutz';
import { EmployeeHome } from './pages/employee/EmployeeHome';
import { SickLeave } from './pages/employee/SickLeave';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { supabase } from './lib/supabase';
import type { Company } from './lib/types';
import { Eye, EyeOff } from 'lucide-react';
import { Pricing } from './pages/Pricing';
import { PaywallModal } from './components/shared/PaywallModal';

function OwnerApp({ company }: { company: Company & { paid_until: string | null } }) {
  const [page, setPage] = useState('dashboard');

  return (
    <OwnerLayout company={company} activePage={page} onNavigate={setPage}>
      {(props) => {
        switch (page) {
          case 'dashboard': return <Dashboard {...props} />;
          case 'employees': return <Employees {...props} />;
          case 'properties': return <Properties {...props} />;
          case 'assignments': return <Assignments {...props} />;
          case 'payroll': return <Payroll {...props} />;
          case 'timestamps': return <Timestamps {...props} />;
          case 'settings': return <Settings company={props.company} onRefresh={props.onRefresh} />;
          case 'impressum': return <Impressum />;
          case 'datenschutz': return <Datenschutz />;
          default: return <Dashboard {...props} />;
        }
      }}
    </OwnerLayout>
  );
}

function EmployeeApp() {
  const [screen, setScreen] = useState<'home' | 'sick'>('home');
  const [refreshKey, setRefreshKey] = useState(0);

  if (screen === 'sick') {
    return <SickLeave onBack={() => setScreen('home')} onComplete={() => { setScreen('home'); setRefreshKey(k => k + 1); }} />;
  }

  return <EmployeeHome key={refreshKey} onSickLeave={() => setScreen('sick')} />;
}

function ChangePasswordScreen() {
  const { changePassword } = useAuth();
  const { t, rtl } = useLang();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }
    if (password !== confirm) {
      setError(t('passwordsDontMatch'));
      return;
    }

    setLoading(true);
    const { error: err } = await changePassword(password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className={`min-h-screen bg-surface-50 flex items-center justify-center px-6 ${rtl ? 'text-right' : 'text-left'}`} dir={rtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/meizoLogoL.jpeg" alt="Meizo" className="h-16 w-auto mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">{t('setPassword')}</h1>
          <p className="text-ink-500 text-sm mt-1.5">{t('chooseOwnPassword')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('newPassword')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field !pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-700 transition-colors ${rtl ? 'left-3.5' : 'right-3.5'}`}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('confirmPassword')}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="input-field"
            />
          </div>

          {error && <p className="text-sm text-danger-500 text-center font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="btn-primary w-full py-3"
          >
            {loading ? t('saving') : t('savePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}

function AccountSuspendedScreen() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <img src="/meizoLogoL.jpeg" alt="Meizo" className="h-14 w-auto mx-auto" />
        <div className="card p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Konto gesperrt</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Ihr Konto wurde vom Inhaber deaktiviert. Bitte wenden Sie sich direkt an uns, um Ihr Konto wiederherzustellen.
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Kontakt</p>
            <a
              href="mailto:meisammahmoodi08@gmail.com"
              className="flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 flex-shrink-0">
                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              meisammahmoodi08@gmail.com
            </a>
            <a
              href="tel:+4917661860432"
              className="flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 flex-shrink-0">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              +49 176 6186 0432
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="bg-white flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 right-0 z-50 p-4 pr-6">
        <button
          onClick={() => navigate('/login')}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg px-4 py-2"
        >
          Anmelden
        </button>
      </nav>

      {/* Hero: full-viewport slideshow */}
      <div className="w-full" style={{ height: '100vh' }}>
        <iframe
          src="/hero.html"
          className="w-full h-full border-0"
          title="meizo Präsentation"
          allow="autoplay"
        />
      </div>

    </div>
  );
}

function PricingGate() {
  const [showLogin, setShowLogin] = useState(false);
  if (showLogin) return <UnifiedLogin />;
  return <Pricing onContinue={() => setShowLogin(true)} />;
}

function AppRoutes() {
  const { user, loading, mustChangePassword, signOut } = useAuth();
  const [role, setRole] = useState<'owner' | 'employee' | 'admin' | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [ownerCompany, setOwnerCompany] = useState<(Company & { paid_until: string | null }) | null | undefined>(undefined);
  const [suspended, setSuspended] = useState(false);
  const prevUserId = React.useRef<string | null>(null);

  useEffect(() => {
    const uid = user?.id ?? null;
    if (uid === prevUserId.current) return;
    prevUserId.current = uid;

    if (!uid) {
      // Don't clear suspended here — suspension screen must persist after signOut
      setRole(null);
      setCompanyId(null);
      setOwnerCompany(undefined);
      setRoleLoading(false);
      return;
    }

    setSuspended(false);

    setRoleLoading(true);

    const timeout = setTimeout(() => setRoleLoading(false), 3000);

    supabase
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data?.role === 'owner' || data?.role === 'employee' || data?.role === 'admin') {
          setRole(data.role);
          if (data.role === 'owner') {
            const { data: company } = await supabase
              .from('companies')
              .select('*')
              .eq('owner_id', uid)
              .maybeSingle();
            setCompanyId(company?.id ?? null);
            setOwnerCompany(company ? { ...company, paid_until: (company as unknown as { paid_until: string | null }).paid_until ?? null } : null);
          }
        } else {
          setRole(null);
          setCompanyId(null);
        }
      })
      .catch(() => { setRole(null); setCompanyId(null); setOwnerCompany(undefined); })
      .finally(() => {
        clearTimeout(timeout);
        setRoleLoading(false);
      });

    return () => clearTimeout(timeout);
  }, [user]);

  // Realtime: watch for company deletion while owner is logged in
  useEffect(() => {
    if (!companyId || role !== 'owner') return;

    const channel = supabase
      .channel(`company-suspension-${companyId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'companies', filter: `id=eq.${companyId}` },
        (payload) => {
          if (payload.new?.deleted_at) {
            setSuspended(true);
            signOut();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId, role, signOut]);

  if (suspended) {
    return <AccountSuspendedScreen />;
  }

  if (loading || (user && roleLoading) || (role === 'owner' && ownerCompany === undefined)) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<UnifiedLogin />} />
        <Route path="/pricing" element={<PricingGate />} />
        <Route path="/*" element={<LandingPage />} />
      </Routes>
    );
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (mustChangePassword && role === 'employee') {
    return <ChangePasswordScreen />;
  }

  if (role === 'employee') {
    return (
      <Routes>
        <Route path="/*" element={<EmployeeApp />} />
      </Routes>
    );
  }

  if (role === 'owner') {
    if (!ownerCompany) {
      return (
        <div className="min-h-screen bg-surface-50 flex items-center justify-center px-6">
          <p className="text-ink-500 text-sm">Kein Unternehmen gefunden.</p>
        </div>
      );
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const trialActive = ownerCompany.trial_ends_at ? new Date(ownerCompany.trial_ends_at) >= today : false;
    const paidActive = ownerCompany.paid_until ? new Date(ownerCompany.paid_until) >= today : false;
    const showPaywall = !trialActive && !paidActive;
    return (
      <>
        <Routes>
          <Route path="/*" element={<OwnerApp company={ownerCompany} />} />
        </Routes>
        {showPaywall && <PaywallModal companyId={ownerCompany.id} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        <p className="text-ink-500 text-sm">Kein Profil gefunden. Bitte wenden Sie sich an den Administrator.</p>
        <button
          onClick={signOut}
          className="btn-primary"
        >
          Abmelden
        </button>
      </div>
    </div>
  );
}

function UnifiedLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { t, lang, setLang, rtl } = useLang();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await signIn(email, password);
    if (err) setError(t('invalidCredentials'));
    setLoading(false);
  };

  return (
    <div className={`min-h-screen bg-surface-50 flex items-center justify-center px-6 ${rtl ? 'text-right' : 'text-left'}`} dir={rtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/meizoLogoL.jpeg" alt="Meizo" className="h-16 w-auto mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">meizo</h1>
          <p className="text-ink-500 text-sm mt-1.5">{t('login')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
            />
          </div>

          {error && <p className="text-sm text-danger-500 text-center font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-ink-900 text-white hover:bg-ink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('sending') : t('login')}
          </button>
        </form>

        {/* Language switcher on login page */}
        <div className="flex justify-center gap-2 mt-8">
          {(['de', 'ro', 'ar', 'pl', 'en'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                lang === l ? 'bg-ink-900 text-white shadow-sm' : 'bg-surface-100 text-ink-500 hover:bg-surface-200'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
