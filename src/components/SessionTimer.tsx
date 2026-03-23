import { Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SessionTimer() {
  const { timeRemaining } = useAuth();

  if (!timeRemaining) return null;

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  const isLowTime = timeRemaining <= 5 * 60 * 1000;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      isLowTime ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'
    }`}>
      <Clock className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="text-xs font-medium">Session expires in</span>
        <span className={`text-sm font-mono font-semibold ${
          isLowTime ? 'text-red-800' : 'text-slate-900'
        }`}>
          {hours > 0 && `${hours}h `}{String(minutes).padStart(2, '0')}m {String(seconds).padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
}
