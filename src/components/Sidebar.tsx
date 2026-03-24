import { LayoutDashboard, Users, Package, ClipboardCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

export type PageType = 'dashboard' | 'directory' | 'devices' | 'provisioning';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { id: 'dashboard' as PageType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'directory' as PageType, label: 'User Directory', icon: Users },
    { id: 'devices' as PageType, label: 'Devices', icon: Package },
    { id: 'provisioning' as PageType, label: 'Provisioning', icon: ClipboardCheck },
  ];

  return (
    <div
      className={`bg-slate-900 text-white h-full flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex items-center justify-end p-4 border-b border-slate-700">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-3 pt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg mb-3 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon size={24} className="flex-shrink-0" />
              {isExpanded && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
