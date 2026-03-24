import { useAuth } from '../contexts/AuthContext';

export default function SessionTimer() {
  const { timeRemaining } = useAuth();

  if (!timeRemaining) return null;

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  const isLowTime = timeRemaining <= 5 * 60 * 1000;

  return (
    <div className={`text-xs ${isLowTime ? 'text-red-400' : 'text-slate-300'} text-right`} style={{ height: '43.73px' }}>
      <div className="leading-tight">Session expires in</div>
      <div className="font-semibold leading-tight">
        {hours}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
}
