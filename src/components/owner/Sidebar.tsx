import { useState } from 'react';
import { LayoutDashboard, Users, Building2, Settings, LogOut, Menu, X, CalendarDays, Wallet, Timer, FileText, Shield, Lock } from 'lucide-react';
import { Avatar } from '../shared/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../shared/Modal';
import { UpgradeModal } from '../shared/UpgradeModal';
import type { Plan } from '../../lib/plans';
import { canAccessPayroll, canAccessTimestamps, getPlan } from '../../lib/plans';

interface SidebarProps {
  active: string;
  onNavigate: (page: string) => void;
  ownerName: string;
  contract: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresPlan: null },
  { id: 'employees', label: 'Mitarbeiter', icon: Users, requiresPlan: null },
  { id: 'properties', label: 'Objekte', icon: Building2, requiresPlan: null },
  { id: 'assignments', label: 'Einsätze', icon: CalendarDays, requiresPlan: null },
  { id: 'payroll', label: 'Abrechnung', icon: Wallet, requiresPlan: 'Business' as Plan },
  { id: 'timestamps', label: 'Zeitstempel', icon: Timer, requiresPlan: 'Business' as Plan },
  { id: 'settings', label: 'Einstellungen', icon: Settings, requiresPlan: null },
];

export function Sidebar({ active, onNavigate, ownerName, contract }: SidebarProps) {
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const plan = getPlan(contract);

  const isItemAllowed = (itemId: string) => {
    if (itemId === 'payroll') return canAccessPayroll(plan);
    if (itemId === 'timestamps') return canAccessTimestamps(plan);
    return true;
  };

  const handleNav = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    setLogoutConfirm(false);
    await signOut();
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-6 pt-7 pb-5">
        <div className="flex items-center justify-between">
          <img src="/meizoLogo.png" alt="meizo" className="h-10 w-auto bg-white rounded-xl px-2 py-1" />
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="mx-5 h-px bg-white/[0.06]" />

      {/* Navigation */}
      <nav className="flex-1 mt-3 px-4">
        {navItems.map(item => {
          const isActive = active === item.id;
          const allowed = isItemAllowed(item.id);
          return (
            <button key={item.id}
              onClick={() => allowed ? handleNav(item.id) : setUpgradeOpen(true)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 mb-0.5 ${
                isActive
                  ? 'bg-white/[0.08] text-white'
                  : allowed
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  : 'text-slate-600 hover:bg-white/[0.04] cursor-pointer'
              }`}>
              <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className={isActive ? 'text-brand-400' : ''} />
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />}
              {!allowed && !isActive && <Lock size={12} className="ml-auto text-slate-600" />}
            </button>
          );
        })}
      </nav>

      <div className="mx-5 h-px bg-white/[0.06]" />

      {/* Legal links */}
      <div className="px-4 pt-3 pb-1 flex gap-1">
        <button
          onClick={() => handleNav('impressum')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
            active === 'impressum' ? 'text-slate-200 bg-white/[0.06]' : 'text-slate-500 hover:text-slate-400 hover:bg-white/[0.04]'
          }`}
        >
          <FileText size={11} />
          Impressum
        </button>
        <button
          onClick={() => handleNav('datenschutz')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
            active === 'datenschutz' ? 'text-slate-200 bg-white/[0.06]' : 'text-slate-500 hover:text-slate-400 hover:bg-white/[0.04]'
          }`}
        >
          <Shield size={11} />
          Datenschutz
        </button>
      </div>

      <div className="mx-5 h-px bg-white/[0.06]" />

      {/* User */}
      <div className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar firstName={ownerName?.split(' ')[0] || 'O'} lastName={ownerName?.split(' ')[1] || ''} id="owner" size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">{ownerName || 'Inhaber'}</p>
            <p className="text-slate-500 text-[11px] font-medium mt-0.5">Inhaber</p>
          </div>
          <button onClick={() => setLogoutConfirm(true)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all" title="Abmelden">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-ink-900/95 backdrop-blur-sm flex items-center px-4 z-40 border-b border-white/[0.06]">
        <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors mr-3">
          <Menu size={22} />
        </button>
        <img src="/meizoLogo.png" alt="meizo" className="h-7 w-auto bg-white rounded-lg px-1.5 py-0.5" />
      </div>

      {/* Mobile Drawer */}
      <div className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${mobileOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMobileOpen(false)} />
        <aside className={`absolute left-0 top-0 bottom-0 w-72 bg-ink-900 flex flex-col transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebarContent}
        </aside>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-ink-900 flex-col z-40">
        {sidebarContent}
      </aside>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} currentPlan={plan} reason="Dieses Modul ist in Ihrem aktuellen Paket nicht enthalten." />

      {/* Logout Confirmation */}
      <Modal open={logoutConfirm} onClose={() => setLogoutConfirm(false)} width="max-w-sm">
        <div className="p-8">
          <div className="w-12 h-12 rounded-2xl bg-danger-50 flex items-center justify-center mb-5">
            <LogOut size={22} className="text-danger-500" />
          </div>
          <h2 className="text-lg font-bold text-ink-900 mb-2">Wirklich abmelden?</h2>
          <p className="text-sm text-ink-500 leading-relaxed mb-8">Du wirst ausgeloggt und musst dich erneut anmelden.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setLogoutConfirm(false)} className="btn-ghost">Abbrechen</button>
            <button onClick={handleLogout} className="btn-danger">Abmelden</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
