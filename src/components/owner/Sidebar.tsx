import { useState } from 'react';
import { LayoutDashboard, Users, Building2, Settings, LogOut, Menu, X, CalendarDays } from 'lucide-react';
import { Avatar } from '../shared/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../shared/Modal';

interface SidebarProps {
  active: string;
  onNavigate: (page: string) => void;
  ownerName: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'employees', label: 'Mitarbeiter', icon: Users },
  { id: 'properties', label: 'Objekte', icon: Building2 },
  { id: 'assignments', label: 'Einsätze', icon: CalendarDays },
  { id: 'settings', label: 'Einstellungen', icon: Settings },
];

export function Sidebar({ active, onNavigate, ownerName }: SidebarProps) {
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

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
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-white text-xl font-bold tracking-tight">Putzo</h1>
        <p className="text-slate-400 text-[13px] mt-0.5">Reinigungsservice</p>
      </div>

      <nav className="flex-1 mt-6 px-3">
        {navItems.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                isActive
                  ? 'bg-white/10 text-white border-l-[3px] border-[#22C55E] pl-[9px]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
              }`}>
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pb-6">
        <div className="flex items-center gap-3 px-2 py-3">
          <Avatar firstName={ownerName?.split(' ')[0] || 'O'} lastName={ownerName?.split(' ')[1] || ''} id="owner" size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{ownerName || 'Inhaber'}</p>
          </div>
          <button onClick={() => setLogoutConfirm(true)} className="text-slate-400 hover:text-white transition-colors" title="Abmelden">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0F172A] flex items-center justify-between px-4 z-40">
        <h1 className="text-white text-lg font-bold">Putzo</h1>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-1">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="relative w-60 h-full bg-[#0F172A] flex flex-col" onClick={e => e.stopPropagation()}>
            {sidebarContent}
          </aside>
        </div>
      )}

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-[#0F172A] flex-col z-40">
        {sidebarContent}
      </aside>

      {/* Logout Confirmation */}
      <Modal open={logoutConfirm} onClose={() => setLogoutConfirm(false)} width="max-w-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-2">Wirklich abmelden?</h2>
          <p className="text-sm text-[#64748B] mb-6">Du wirst ausgeloggt und musst dich erneut anmelden.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setLogoutConfirm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-gray-100 transition-colors">Abbrechen</button>
            <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#EF4444] text-white hover:bg-red-600 transition-colors">Abmelden</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
