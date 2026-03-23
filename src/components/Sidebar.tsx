import { LayoutDashboard, Users, Package, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export type PageType = 'dashboard' | 'directory' | 'devices';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { userEmail, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard' as PageType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'directory' as PageType, label: 'User Directory', icon: Users },
    { id: 'devices' as PageType, label: 'Devices', icon: Package },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">Asset Manager</h1>
        <p className="text-xs text-slate-400 mt-1">Device & User Tracking</p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="mb-3">
          <p className="text-xs text-slate-400 mb-1">Signed in as</p>
          <p className="text-sm text-slate-200 truncate">{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
