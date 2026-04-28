import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/shared/Toast';
import { OwnerLayout } from './components/owner/OwnerLayout';
import { Dashboard } from './pages/owner/Dashboard';
import { Employees } from './pages/owner/Employees';
import { Properties } from './pages/owner/Properties';
import { Settings } from './pages/owner/Settings';
import { EmployeeHome } from './pages/employee/EmployeeHome';
import { SickLeave } from './pages/employee/SickLeave';
import { supabase } from './lib/supabase';

function OwnerApp() {
  const [page, setPage] = useState('dashboard');

  return (
    <OwnerLayout activePage={page} onNavigate={setPage}>
      {(props) => {
        switch (page) {
          case 'dashboard': return <Dashboard {...props} />;
          case 'employees': return <Employees {...props} />;
          case 'properties': return <Properties {...props} />;
          case 'settings': return <Settings company={props.company} onRefresh={props.onRefresh} />;
          default: return <Dashboard {...props} />;
        }
      }}
    </OwnerLayout>
  );
}

function EmployeeApp() {
  const [screen, setScreen] = useState<'home' | 'sick'>('home');

  if (screen === 'sick') {
    return <SickLeave onBack={() => setScreen('home')} onComplete={() => setScreen('home')} />;
  }

  return <EmployeeHome onSickLeave={() => setScreen('sick')} />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await signIn(email, password);
    if (err) setError(err === 'Invalid login credentials' ? 'Ungültige Anmeldedaten' : err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#22C55E] flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Putzo</h1>
          <p className="text-[#64748B] text-sm mt-1">Anmelden</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Passwort"
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
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
