import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { EmployeeHome } from './pages/employee/EmployeeHome';
import { SickLeave } from './pages/employee/SickLeave';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { supabase } from './lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

function OwnerApp() {
  const [page, setPage] = useState('dashboard');

  return (
    <OwnerLayout activePage={page} onNavigate={setPage}>
      {(props) => {
        switch (page) {
          case 'dashboard': return <Dashboard {...props} />;
          case 'employees': return <Employees {...props} />;
          case 'properties': return <Properties {...props} />;
          case 'assignments': return <Assignments {...props} />;
          case 'payroll': return <Payroll {...props} />;
          case 'timestamps': return <Timestamps {...props} />;
          case 'settings': return <Settings company={props.company} onRefresh={props.onRefresh} />;
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
          <img src="/meizoLogo.png" alt="Meizo" className="h-16 w-auto mx-auto mb-5" />
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

function AppRoutes() {
  const { user, loading, mustChangePassword } = useAuth();
  const [role, setRole] = useState<'owner' | 'employee' | 'admin' | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const prevUserId = React.useRef<string | null>(null);

  useEffect(() => {
    const uid = user?.id ?? null;
    if (uid === prevUserId.current) return;
    prevUserId.current = uid;

    if (!uid) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);

    const timeout = setTimeout(() => setRoleLoading(false), 3000);

    supabase
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.role === 'owner' || data?.role === 'employee' || data?.role === 'admin') {
          setRole(data.role);
        } else {
          setRole(null);
        }
      })
      .catch(() => setRole(null))
      .finally(() => {
        clearTimeout(timeout);
        setRoleLoading(false);
      });

    return () => clearTimeout(timeout);
  }, [user]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/*" element={<UnifiedLogin />} />
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
    return (
      <Routes>
        <Route path="/*" element={<OwnerApp />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-ink-500 text-sm">Kein Profil gefunden. Bitte wenden Sie sich an den Administrator.</p>
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
          <img src="/meizoLogo.png" alt="Meizo" className="h-16 w-auto mx-auto mb-5" />
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
