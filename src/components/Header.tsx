import { HelpCircle, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SessionTimer from './SessionTimer';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { userEmail, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="bg-slate-700 text-white h-20 flex items-center justify-between px-6 text-sm border-b border-slate-600">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-base">CommandCentral Asset Manager</span>
      </div>

      <div className="flex items-center gap-6">
        <SessionTimer />

        <button className="flex items-center gap-1 hover:bg-slate-600 px-3 py-2 rounded transition-colors">
          <HelpCircle size={18} />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 hover:bg-slate-600 px-3 py-2 rounded transition-colors"
          >
            <span className="text-slate-300 text-xs">Signed in as</span>
            <span className="text-slate-100">{userEmail}</span>
            <ChevronDown size={16} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-1 z-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <LogOut size={16} />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
