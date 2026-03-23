import { Package, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { useUsers, useDevices } from '../hooks/useGoogleSheets';
import { useNavigate } from '../hooks/useNavigate';

export default function Dashboard() {
  const { users, loading: usersLoading } = useUsers();
  const { devices, loading: devicesLoading } = useDevices();
  const navigate = useNavigate();

  const loading = usersLoading || devicesLoading;

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'active').length,
    totalDevices: devices.length,
    availableDevices: devices.filter((d) => d.status === 'available').length,
    assignedDevices: devices.filter((d) => d.status === 'assigned').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => navigate('directory')}
          className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600 text-left hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Users</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalUsers}</p>
            </div>
            <Users className="text-blue-600" size={40} />
          </div>
          <div className="mt-4 text-sm text-slate-600">
            <span className="text-green-600 font-medium">{stats.activeUsers}</span> active
          </div>
        </button>

        <button
          onClick={() => navigate('devices')}
          className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600 text-left hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Devices</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalDevices}</p>
            </div>
            <Package className="text-green-600" size={40} />
          </div>
          <div className="mt-4 text-sm text-slate-600">
            <span className="text-green-600 font-medium">{stats.availableDevices}</span> available,{' '}
            <span className="text-blue-600 font-medium">{stats.assignedDevices}</span> assigned
          </div>
        </button>

        <button
          onClick={() => navigate('devices?status=available')}
          className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-600 text-left hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Available Devices</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.availableDevices}</p>
            </div>
            <AlertTriangle className="text-amber-600" size={40} />
          </div>
          <div className="mt-4 text-sm text-slate-600">Ready for deployment</div>
        </button>

        <button
          onClick={() => navigate('devices?status=assigned')}
          className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-emerald-600 text-left hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Assigned Devices</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.assignedDevices}</p>
            </div>
            <CheckCircle className="text-emerald-600" size={40} />
          </div>
          <div className="mt-4 text-sm text-slate-600">Successfully deployed</div>
        </button>
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
