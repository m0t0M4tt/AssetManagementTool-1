import { LayoutDashboard, Users, Package, Upload, ClipboardCheck } from 'lucide-react';

export type PageType = 'dashboard' | 'directory' | 'devices' | 'import' | 'provisioning';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as PageType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'directory' as PageType, label: 'User Directory', icon: Users },
    { id: 'devices' as PageType, label: 'Devices', icon: Package },
    { id: 'provisioning' as PageType, label: 'Provisioning', icon: ClipboardCheck },
    { id: 'import' as PageType, label: 'Import Data', icon: Upload },
  ];

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

      <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
        <p>Multi-Territory Asset Management</p>
      </div>
    </div>
  );
}
