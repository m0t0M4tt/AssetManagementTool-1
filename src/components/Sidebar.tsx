import { LayoutDashboard, Users, Package, ClipboardCheck } from 'lucide-react';

export type PageType = 'dashboard' | 'directory' | 'devices' | 'provisioning';

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
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-full flex flex-col">
      <nav className="flex-1 p-4 pt-6">
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
    </div>
  );
}
