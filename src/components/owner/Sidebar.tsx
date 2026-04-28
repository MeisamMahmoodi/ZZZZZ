import { LayoutDashboard, Users, Building2, Settings, LogOut } from 'lucide-react';
import { Avatar } from '../shared/Avatar';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  active: string;
  onNavigate: (page: string) => void;
  ownerName: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'employees', label: 'Mitarbeiter', icon: Users },
  { id: 'properties', label: 'Objekte', icon: Building2 },
  { id: 'settings', label: 'Einstellungen', icon: Settings },
];

export function Sidebar({ active, onNavigate, ownerName }: SidebarProps) {
  const { signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#0F172A] flex flex-col z-40">
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-white text-xl font-bold tracking-tight">Putzo</h1>
        <p className="text-slate-400 text-[13px] mt-0.5">Reinigungsservice</p>
      </div>

      <nav className="flex-1 mt-6 px-3">
        {navItems.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                isActive
                  ? 'bg-white/10 text-white border-l-[3px] border-[#22C55E] pl-[9px]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
              }`}
            >
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
          <button onClick={signOut} className="text-slate-400 hover:text-white transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
