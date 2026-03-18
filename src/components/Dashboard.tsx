import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Users, ClipboardCheck, AlertCircle } from 'lucide-react';
import type { TerritoryType } from '../lib/database.types';

interface DashboardStats {
  totalDevices: number;
  devicesAssigned: number;
  devicesAvailable: number;
  totalUsers: number;
  usersProvisioning: number;
  pendingTasks: number;
  territoryDistribution: Record<string, number>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    devicesAssigned: 0,
    devicesAvailable: 0,
    totalUsers: 0,
    usersProvisioning: 0,
    pendingTasks: 0,
    territoryDistribution: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  async function loadDashboardStats() {
    try {
      const [devicesRes, usersRes, tasksRes] = await Promise.all([
        supabase.from('devices').select('status'),
        supabase.from('users_directory').select('status, territory'),
        supabase.from('provisioning_tasks').select('completed'),
      ]);

      const devices = devicesRes.data || [];
      const users = usersRes.data || [];
      const tasks = tasksRes.data || [];

      const territoryDist: Record<string, number> = {};
      users.forEach((user) => {
        if (user.territory) {
          territoryDist[user.territory] = (territoryDist[user.territory] || 0) + 1;
        }
      });

      setStats({
        totalDevices: devices.length,
        devicesAssigned: devices.filter((d) => d.status === 'assigned').length,
        devicesAvailable: devices.filter((d) => d.status === 'available').length,
        totalUsers: users.length,
        usersProvisioning: users.filter((u) => u.status === 'provisioning').length,
        pendingTasks: tasks.filter((t) => !t.completed).length,
        territoryDistribution: territoryDist,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const territories: TerritoryType[] = ['Central', 'Northeast', 'Southeast', 'West', 'Federal', 'Software', 'Video'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Devices</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalDevices}</p>
            </div>
            <Package className="text-blue-500" size={40} />
          </div>
          <div className="mt-4 text-sm text-slate-600">
            <span className="text-green-600 font-medium">{stats.devicesAssigned}</span> assigned,{' '}
            <span className="text-slate-500 font-medium">{stats.devicesAvailable}</span> available
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Users</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalUsers}</p>
            </div>
            <Users className="text-green-500" size={40} />
          </div>
          <div className="mt-4 text-sm text-slate-600">
            Across {Object.keys(stats.territoryDistribution).length} territories
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Provisioning</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.usersProvisioning}</p>
            </div>
            <ClipboardCheck className="text-amber-500" size={40} />
          </div>
          <div className="mt-4 text-sm text-slate-600">
            Users in provisioning status
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Tasks</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.pendingTasks}</p>
            </div>
            <AlertCircle className="text-red-500" size={40} />
          </div>
          <div className="mt-4 text-sm text-slate-600">
            Provisioning tasks incomplete
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Device Distribution by Territory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {territories.map((territory) => {
            const count = stats.territoryDistribution[territory] || 0;
            const percentage = stats.totalUsers > 0 ? ((count / stats.totalUsers) * 100).toFixed(1) : '0';

            return (
              <div key={territory} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{territory}</span>
                  <span className="text-lg font-bold text-slate-900">{count}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-slate-500">{percentage}% of total</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
