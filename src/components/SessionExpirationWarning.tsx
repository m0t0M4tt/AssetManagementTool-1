import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SessionExpirationWarning() {
  const { showExpirationWarning, timeRemaining, extendSession, logout } = useAuth();

  if (!showExpirationWarning || !timeRemaining) return null;

  const minutes = Math.floor(timeRemaining / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Session Expiring Soon
            </h3>
            <p className="text-slate-600 mb-4">
              Your session will expire in{' '}
              <span className="font-semibold text-amber-600">
                {minutes}m {String(seconds).padStart(2, '0')}s
              </span>
              . Would you like to extend your session?
            </p>

            <div className="flex gap-3">
              <button
                onClick={extendSession}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Extend Session
              </button>
              <button
                onClick={logout}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
