import { HelpCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SessionTimer from './SessionTimer';

export default function Header() {
  const { userEmail } = useAuth();

  return (
    <header className="bg-slate-700 text-white h-10 flex items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-semibold">CommandCentral Asset Manager</span>
      </div>

      <div className="flex items-center gap-6">
        <SessionTimer />

        <button className="flex items-center gap-1 hover:bg-slate-600 px-2 py-1 rounded transition-colors">
          <HelpCircle size={14} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[10px]">Signed in as</span>
          <span className="text-slate-200">{userEmail}</span>
          <button className="hover:bg-slate-600 px-2 py-1 rounded transition-colors">
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
