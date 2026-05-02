import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LangProvider } from './hooks/useLang';
import { ToastProvider } from './components/shared/Toast';
import { OwnerLayout } from './components/owner/OwnerLayout';
import { Dashboard } from './pages/owner/Dashboard';
import { Employees } from './pages/owner/Employees';
import { Properties } from './pages/owner/Properties';
import { Assignments } from './pages/owner/Assignments';
import { Settings } from './pages/owner/Settings';
import { EmployeeHome } from './pages/employee/EmployeeHome';
import { SickLeave } from './pages/employee/SickLeave';
import { supabase } from './lib/supabase';
import { Lock, Eye, EyeOff } from 'lucide-react';

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
    <div className={`min-h-screen bg-white flex items-center justify-center px-6 ${rtl ? 'text-right' : 'text-left'}`} dir={rtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#22C55E] flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{t('setPassword')}</h1>
          <p className="text-[#64748B] text-sm mt-1">{t('chooseOwnPassword')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('newPassword')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] transition-colors ${rtl ? 'left-3' : 'right-3'}`}
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
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
            />
          </div>

          {error && <p className="text-sm text-[#EF4444] text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full py-3 rounded-lg text-sm font-semibold bg-[#22C55E] text-white hover:bg-green-600 transition-colors disabled:opacity-50"
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
  const [role, setRole] = useState<'owner' | 'employee' | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setRole(null); setChecking(false); return; }
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.role === 'owner' || data?.role === 'employee') {
          setRole(data.role);
        } else {
          setRole(null);
        }
        setChecking(false);
      });
  }, [user]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
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

  // Force password change for employees on first login
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-[#64748B] text-sm">Kein Profil gefunden. Bitte wenden Sie sich an den Administrator.</p>
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
    <div className={`min-h-screen bg-white flex items-center justify-center px-6 ${rtl ? 'text-right' : 'text-left'}`} dir={rtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#22C55E] flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Putzo</h1>
          <p className="text-[#64748B] text-sm mt-1">{t('login')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
            />
          </div>

          {error && <p className="text-sm text-[#EF4444] text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-lg text-sm font-semibold bg-[#0F172A] text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? t('sending') : t('login')}
          </button>
        </form>

        {/* Language switcher on login page */}
        <div className="flex justify-center gap-2 mt-6">
          {(['de', 'ro', 'ar', 'pl', 'en'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                lang === l ? 'bg-[#0F172A] text-white' : 'bg-gray-100 text-[#64748B] hover:bg-gray-200'
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
