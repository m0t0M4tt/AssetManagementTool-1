import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ClipboardCheck, User, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import type { Database } from '../lib/database.types';

type UserRow = Database['public']['Tables']['users_directory']['Row'];
type ProvisioningTaskRow = Database['public']['Tables']['provisioning_tasks']['Row'];

interface UserWithTasks extends UserRow {
  tasks: ProvisioningTaskRow[];
  completedCount: number;
  totalCount: number;
}

export default function Provisioning() {
  const [usersWithTasks, setUsersWithTasks] = useState<UserWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    loadProvisioningData();
  }, []);

  async function loadProvisioningData() {
    try {
      const [usersRes, tasksRes] = await Promise.all([
        supabase
          .from('users_directory')
          .select('*')
          .order('name'),
        supabase.from('provisioning_tasks').select('*').order('task_order'),
      ]);

      const users = usersRes.data || [];
      const tasks = tasksRes.data || [];

      const usersWithTasksData: UserWithTasks[] = users
        .map((user) => {
          const userTasks = tasks.filter((task) => task.user_id === user.id);
          const completedCount = userTasks.filter((task) => task.completed).length;

          return {
            ...user,
            tasks: userTasks,
            completedCount,
            totalCount: userTasks.length,
          };
        })
        .filter((user) => user.totalCount > 0);

      setUsersWithTasks(usersWithTasksData);
    } catch (error) {
      console.error('Error loading provisioning data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTaskCompletion(taskId: string, currentStatus: boolean) {
    const newStatus = !currentStatus;
    const newCompletedAt = newStatus ? new Date().toISOString() : null;

    setUsersWithTasks((prev) =>
      prev.map((user) => {
        const updatedTasks = user.tasks.map((task) =>
          task.id === taskId
            ? { ...task, completed: newStatus, completed_at: newCompletedAt }
            : task
        );
        const completedCount = updatedTasks.filter((task) => task.completed).length;

        return {
          ...user,
          tasks: updatedTasks,
          completedCount,
        };
      })
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
      loadProvisioningData();
    }
  }

  const filteredUsers = usersWithTasks.filter((user) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return user.completedCount === 0;
    if (filter === 'in-progress') return user.completedCount > 0 && user.completedCount < user.totalCount;
    if (filter === 'completed') return user.completedCount === user.totalCount && user.totalCount > 0;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading provisioning data...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Provisioning Workflow</h1>
        <p className="text-slate-600 mt-1">Track SET checklist progress for users in provisioning</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({usersWithTasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Not Started ({usersWithTasks.filter((u) => u.completedCount === 0).length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'in-progress'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            In Progress (
            {
              usersWithTasks.filter((u) => u.completedCount > 0 && u.completedCount < u.totalCount)
                .length
            }
            )
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Completed (
            {
              usersWithTasks.filter((u) => u.completedCount === u.totalCount && u.totalCount > 0)
                .length
            }
            )
          </button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="mx-auto text-slate-400 mb-4" size={48} />
          <p className="text-slate-500">No users found in provisioning workflow</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredUsers.map((user) => {
            const progressPercentage =
              user.totalCount > 0 ? (user.completedCount / user.totalCount) * 100 : 0;

            return (
              <div key={user.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{user.name}</h3>
                        <p className="text-sm text-slate-600">
                          {user.department} • {user.territory}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">
                        {user.completedCount} of {user.totalCount} completed
                      </p>
                      <div className="w-48 bg-slate-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-2">
                    {user.tasks.map((task) => (
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
