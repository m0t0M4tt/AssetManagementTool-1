import { Package, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from '../hooks/useNavigate';

export default function Dashboard() {
  const { users, devices, usersLoading, devicesLoading } = useData();
  const navigate = useNavigate();

  const loading = usersLoading || devicesLoading;

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'active').length,
    totalDevices: devices.length,
    availableDevices: devices.filter((d) => d.status === 'available').length,
    assignedDevices: devices.filter((d) => d.status === 'assigned').length,
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick, subtitle, isLoading }: {
    title: string;
    value: number;
    icon: typeof Package;
    color: string;
    onClick: () => void;
    subtitle: string | JSX.Element;
    isLoading: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm p-6 border-l-4 border-${color}-600 text-left hover:shadow-md transition-shadow cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          {isLoading ? (
            <p className="text-3xl font-bold text-slate-400 mt-2">Loading...</p>
          ) : (
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          )}
        </div>
        <Icon className={`text-${color}-600`} size={40} />
      </div>
      <div className="mt-4 text-sm text-slate-600">{subtitle}</div>
    </button>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
          onClick={() => navigate('/directory')}
          subtitle={<><span className="text-green-600 font-medium">{stats.activeUsers}</span> active</>}
          isLoading={usersLoading}
        />

        <StatCard
          title="Total Devices"
          value={stats.totalDevices}
          icon={Package}
          color="green"
          onClick={() => navigate('/devices')}
          subtitle={
            <>
              <span className="text-green-600 font-medium">{stats.availableDevices}</span> available,{' '}
              <span className="text-blue-600 font-medium">{stats.assignedDevices}</span> assigned
            </>
          }
          isLoading={devicesLoading}
        />

        <StatCard
          title="Available Devices"
          value={stats.availableDevices}
          icon={AlertTriangle}
          color="amber"
          onClick={() => navigate('/devices?filter=available')}
          subtitle="Ready for deployment"
          isLoading={devicesLoading}
        />

        <StatCard
          title="Assigned Devices"
          value={stats.assignedDevices}
          icon={CheckCircle}
          color="emerald"
          onClick={() => navigate('/devices?filter=assigned')}
          subtitle="Successfully deployed"
          isLoading={devicesLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Users</h2>
          <div className="space-y-3">
            {users.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-600">{user.department}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {user.status}
                </span>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-center py-4 text-slate-500">No users found</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Devices</h2>
          <div className="space-y-3">
            {devices.slice(0, 5).map((device) => (
              <div key={device.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium text-slate-900">{device.model}</p>
                  <p className="text-sm text-slate-600">{device.serialNumber}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    device.status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : device.status === 'assigned'
                      ? 'bg-blue-100 text-blue-800'
                      : device.status === 'maintenance'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {device.status}
                </span>
              </div>
            ))}
            {devices.length === 0 && (
              <p className="text-center py-4 text-slate-500">No devices found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
