import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Package, Key, ClipboardCheck, CreditCard as Edit, CheckCircle, Circle } from 'lucide-react';
import type { Database } from '../lib/database.types';

type UserRow = Database['public']['Tables']['users_directory']['Row'];
type DeviceRow = Database['public']['Tables']['devices']['Row'];
type AccountConfigRow = Database['public']['Tables']['account_configs']['Row'];
type ProvisioningTaskRow = Database['public']['Tables']['provisioning_tasks']['Row'];

interface UserDetailProps {
  userId: string;
  onBack: () => void;
}

export default function UserDetail({ userId, onBack }: UserDetailProps) {
  const [user, setUser] = useState<UserRow | null>(null);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [accountConfig, setAccountConfig] = useState<AccountConfigRow | null>(null);
  const [provisioningTasks, setProvisioningTasks] = useState<ProvisioningTaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  async function loadUserData() {
    try {
      const [userRes, devicesRes, configRes, tasksRes] = await Promise.all([
        supabase.from('users_directory').select('*').eq('id', userId).maybeSingle(),
        supabase.from('devices').select('*').eq('user_id', userId),
        supabase.from('account_configs').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('provisioning_tasks').select('*').eq('user_id', userId).order('task_order'),
      ]);

      if (userRes.data) setUser(userRes.data);
      setDevices(devicesRes.data || []);
      setAccountConfig(configRes.data);
      setProvisioningTasks(tasksRes.data || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTaskCompletion(taskId: string, currentStatus: boolean) {
    const newStatus = !currentStatus;
    const newCompletedAt = newStatus ? new Date().toISOString() : null;

    setProvisioningTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, completed: newStatus, completed_at: newCompletedAt }
          : task
      )
    );

    try {
      const { error } = await supabase
        .from('provisioning_tasks')
        .update({
          completed: newStatus,
          completed_at: newCompletedAt,
        })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating task:', error);
      loadUserData();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading user details...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-center text-slate-500">User not found</div>
      </div>
    );
  }

  const completedTasks = provisioningTasks.filter((t) => t.completed).length;
  const totalTasks = provisioningTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Directory
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-slate-600 mt-1">{user.login_email}</p>
          </div>
          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
            <Edit size={18} />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-600">Title</p>
            <p className="font-medium text-slate-900">{user.title || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Department</p>
            <p className="font-medium text-slate-900">{user.department || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Territory</p>
            <p className="font-medium text-slate-900">{user.territory || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Core ID</p>
            <p className="font-medium text-slate-900">{user.core_id || '-'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-slate-900">Assigned Devices</h2>
          </div>

          {devices.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No devices assigned</p>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div key={device.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">{device.device_type}</span>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      {device.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>Serial: {device.serial_number}</p>
                    {device.device_id && <p>ID: {device.device_id}</p>}
                  </div>
                  {device.notes && (
                    <p className="text-xs text-slate-500 mt-2 italic">{device.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-slate-900">Account Configurations</h2>
          </div>

          {!accountConfig ? (
            <p className="text-slate-500 text-center py-4">No account configurations</p>
          ) : (
            <div className="space-y-3">
              <div className="border-b border-slate-200 pb-3">
                <p className="text-sm text-slate-600">VESTA NXT Login</p>
                <p className="font-medium text-slate-900">{accountConfig.vesta_nxt_login || '-'}</p>
              </div>
              <div className="border-b border-slate-200 pb-3">
                <p className="text-sm text-slate-600">Radio Next Login</p>
                <p className="font-medium text-slate-900">{accountConfig.radio_next_login || '-'}</p>
              </div>
              <div className="border-b border-slate-200 pb-3">
                <p className="text-sm text-slate-600">Radio N70 Login</p>
                <p className="font-medium text-slate-900">{accountConfig.radio_n70_login || '-'}</p>
              </div>
              <div className="border-b border-slate-200 pb-3">
                <p className="text-sm text-slate-600">Rapid Deploy Login</p>
                <p className="font-medium text-slate-900">{accountConfig.rapid_deploy_login || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Phone Extension</p>
                <p className="font-medium text-slate-900">{accountConfig.phone_extension || '-'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="text-amber-600" size={24} />
          <h2 className="text-xl font-bold text-slate-900">Provisioning Checklist</h2>
          <span className="ml-auto text-sm text-slate-600">
            {completedTasks} of {totalTasks} completed
          </span>
        </div>

        <div className="mb-4">
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {provisioningTasks.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No provisioning tasks</p>
        ) : (
          <div className="space-y-2">
            {provisioningTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <button
                  onClick={() => toggleTaskCompletion(task.id, task.completed)}
                  className="flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : (
                    <Circle className="text-slate-400" size={24} />
                  )}
                </button>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      task.completed ? 'text-slate-500 line-through' : 'text-slate-900'
                    }`}
                  >
                    {task.task_name}
                  </p>
                  {task.completed && task.completed_at && (
                    <p className="text-xs text-slate-500">
                      Completed {new Date(task.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
