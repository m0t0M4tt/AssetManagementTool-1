import { useState } from 'react';
import { Search, CheckCircle2, Circle, AlertCircle, TrendingUp, X, RefreshCw } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { ProvisioningService } from '../lib/provisioningService';
import type { User, ProvisioningSteps } from '../lib/types';

type FilterStatus = 'all' | 'completed' | 'in-progress' | 'not-started';

export default function Provisioning() {
  const { users, usersLoading: loading, usersError: error, refreshData } = useData();
  const { accessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;

    const progress = calculateProgress(user.provisioningSteps);

    if (filterStatus === 'completed') return progress === 100;
    if (filterStatus === 'in-progress') return progress > 0 && progress < 100;
    if (filterStatus === 'not-started') return progress === 0;

    return true;
  });

  const calculateProgress = (steps: ProvisioningSteps | undefined): number => {
    if (!steps) return 0;
    if (!steps.apxNext || !steps.apxN70 || !steps.phoneApps || !steps.svxV700) return 0;

    const allSteps = [
      ...Object.values(steps.apxNext),
      ...Object.values(steps.apxN70),
      ...Object.values(steps.phoneApps),
      ...Object.values(steps.svxV700),
    ];

    const completed = allSteps.filter(Boolean).length;
    return Math.round((completed / allSteps.length) * 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-amber-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-slate-300';
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage === 100) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completed</span>;
    } else if (percentage > 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">In Progress</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">Not Started</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading provisioning data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Error loading provisioning data: {error}</div>
      </div>
    );
  }

  const totalUsers = users.length;
  const completedUsers = users.filter(u => calculateProgress(u.provisioningSteps) === 100).length;
  const inProgressUsers = users.filter(u => {
    const progress = calculateProgress(u.provisioningSteps);
    return progress > 0 && progress < 100;
  }).length;
  const notStartedUsers = totalUsers - completedUsers - inProgressUsers;
  const overallProgress = totalUsers > 0
    ? Math.round((users.reduce((sum, u) => sum + calculateProgress(u.provisioningSteps), 0) / totalUsers))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Provisioning Workflow</h1>
          <p className="text-slate-600 mt-1">Track and manage user provisioning progress</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isRefreshing
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilterStatus('all')}
          className={`text-left rounded-lg shadow-sm border p-6 transition-all ${
            filterStatus === 'all'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500'
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Users</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus('completed')}
          className={`text-left rounded-lg shadow-sm border p-6 transition-all ${
            filterStatus === 'completed'
              ? 'bg-green-50 border-green-300 ring-2 ring-green-500'
              : 'bg-white border-slate-200 hover:border-green-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{completedUsers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus('in-progress')}
          className={`text-left rounded-lg shadow-sm border p-6 transition-all ${
            filterStatus === 'in-progress'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{inProgressUsers}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-amber-600" size={24} />
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus('not-started')}
          className={`text-left rounded-lg shadow-sm border p-6 transition-all ${
            filterStatus === 'not-started'
              ? 'bg-slate-50 border-slate-300 ring-2 ring-slate-500'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Not Started</p>
              <p className="text-2xl font-bold text-slate-600 mt-1">{notStartedUsers}</p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Circle className="text-slate-600" size={24} />
            </div>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Overall Progress</h2>
          <span className="text-2xl font-bold text-slate-900">{overallProgress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${getProgressColor(overallProgress)}`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredUsers.map((user) => {
                const progress = calculateProgress(user.provisioningSteps);
                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {user.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(progress)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[120px]">
                          <div
                            className={`h-2 rounded-full transition-all ${getProgressColor(progress)}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700 min-w-[40px]">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <ProvisioningDetailModal
          user={selectedUser}
          accessToken={accessToken}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

interface ProvisioningDetailModalProps {
  user: User;
  accessToken: string | null;
  onClose: () => void;
}

function ProvisioningDetailModal({ user, accessToken, onClose }: ProvisioningDetailModalProps) {
  const [steps, setSteps] = useState<ProvisioningSteps>(user.provisioningSteps || {
    apxNext: {
      createNextUser: false,
      provisionP1UserRoles: false,
      provisionP1ConcurrentLogins: false,
      p1ProvisionUnitId: false,
      p1UnitPreassignment: false,
      placeUnitOnDutyPsap: false,
      awareAddDevice: false,
      p1AddDevice: false,
      awareDataSharing: false,
    },
    apxN70: {
      createNextUser: false,
      provisionP1UserRoles: false,
      provisionP1ConcurrentLogins: false,
      p1ProvisionUnitId: false,
      p1UnitPreassignment: false,
      placeUnitOnDutyPsap: false,
      awareAddDevice: false,
      p1AddDevice: false,
      awareDataSharing: false,
    },
    phoneApps: {
      responderCoreIdPhone: false,
      responderCoreIdPd: false,
      rapidDeployMapping: false,
      rapidDeployLightning: false,
    },
    svxV700: {
      setupInDeviceManagement: false,
      checkedOutToUser: false,
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleStepToggle = (
    section: 'apxNext' | 'apxN70' | 'phoneApps' | 'svxV700',
    stepKey: string,
    currentValue: boolean
  ) => {
    const newValue = !currentValue;

    setSteps(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [stepKey]: newValue
      }
    }));

    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!accessToken) {
      console.error('No access token available');
      return;
    }

    setIsSaving(true);

    try {
      // Collect all updates into a single batch
      const updates: Array<{
        section: 'apxNext' | 'apxN70' | 'phoneApps' | 'svxV700';
        stepKey: string;
        value: boolean;
      }> = [];

      const sections: Array<'apxNext' | 'apxN70' | 'phoneApps' | 'svxV700'> = ['apxNext', 'apxN70', 'phoneApps', 'svxV700'];

      for (const section of sections) {
        const sectionSteps = steps[section];
        for (const [stepKey, value] of Object.entries(sectionSteps)) {
          updates.push({ section, stepKey, value });
        }
      }

      // Send all updates in a single batch request
      const success = await ProvisioningService.batchUpdateProvisioningSteps(
        accessToken,
        user,
        updates
      );

      if (success) {
        setHasChanges(false);
        alert('Changes saved successfully!');
      } else {
        alert('Failed to save changes. Please try again.');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepSection = (
    title: string,
    stepsList: { key: string; label: string }[],
    sectionData: any,
    colorClass: string,
    sectionKey: 'apxNext' | 'apxN70' | 'phoneApps' | 'svxV700'
  ) => {
    const completed = stepsList.filter(s => sectionData[s.key]).length;
    const percentage = Math.round((completed / stepsList.length) * 100);

    return (
      <div className={`${colorClass} rounded-lg p-4 border`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-slate-900">{title}</h4>
          <span className="text-sm font-medium text-slate-600">{completed}/{stepsList.length}</span>
        </div>
        <div className="w-full bg-white rounded-full h-2 mb-4">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="space-y-2">
          {stepsList.map(step => {
            const isComplete = sectionData[step.key];
            return (
              <button
                key={step.key}
                onClick={() => handleStepToggle(sectionKey, step.key, isComplete)}
                className="w-full flex items-center gap-2 bg-white px-3 py-2 rounded border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isComplete ? (
                  <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                ) : (
                  <Circle size={16} className="text-slate-300 flex-shrink-0" />
                )}
                <span className={`text-sm text-left ${isComplete ? 'text-slate-900' : 'text-slate-500'}`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-slate-600">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderStepSection(
              'APX Next',
              [
                { key: 'createNextUser', label: 'Create Next User' },
                { key: 'provisionP1UserRoles', label: 'Provision P1 User Roles' },
                { key: 'provisionP1ConcurrentLogins', label: 'Provision P1 Concurrent Logins' },
                { key: 'p1ProvisionUnitId', label: 'P1 - Provision Unit ID' },
                { key: 'p1UnitPreassignment', label: 'P1 - Unit Preassignment' },
                { key: 'placeUnitOnDutyPsap', label: 'Place Unit on Duty PSAP' },
                { key: 'awareAddDevice', label: 'Aware - Add Device' },
                { key: 'p1AddDevice', label: 'P1 - Add Device' },
                { key: 'awareDataSharing', label: 'Aware - Data Sharing' }
              ],
              steps.apxNext,
              'bg-blue-50 border-blue-200',
              'apxNext'
            )}

            {renderStepSection(
              'APX N70',
              [
                { key: 'createNextUser', label: 'Create Next User' },
                { key: 'provisionP1UserRoles', label: 'Provision P1 User Roles' },
                { key: 'provisionP1ConcurrentLogins', label: 'Provision P1 Concurrent Logins' },
                { key: 'p1ProvisionUnitId', label: 'P1 - Provision Unit ID' },
                { key: 'p1UnitPreassignment', label: 'P1 - Unit Preassignment' },
                { key: 'placeUnitOnDutyPsap', label: 'Place Unit on Duty PSAP' },
                { key: 'awareAddDevice', label: 'Aware - Add Device' },
                { key: 'p1AddDevice', label: 'P1 - Add Device' },
                { key: 'awareDataSharing', label: 'Aware - Data Sharing' }
              ],
              steps.apxN70,
              'bg-purple-50 border-purple-200',
              'apxN70'
            )}

            {renderStepSection(
              'Phone Applications',
              [
                { key: 'responderCoreIdPhone', label: 'Responder <COREIDPHONE>' },
                { key: 'responderCoreIdPd', label: 'Responder <COREIDPD>' },
                { key: 'rapidDeployMapping', label: 'RapidDeploy Mapping' },
                { key: 'rapidDeployLightning', label: 'RapidDeploy Lightning' }
              ],
              steps.phoneApps,
              'bg-green-50 border-green-200',
              'phoneApps'
            )}

            {renderStepSection(
              'SVX/V700',
              [
                { key: 'setupInDeviceManagement', label: 'Setup in Device Management' },
                { key: 'checkedOutToUser', label: 'Checked out to User' }
              ],
              steps.svxV700,
              'bg-amber-50 border-amber-200',
              'svxV700'
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            {hasChanges && (
              <p className="text-sm text-amber-600 font-medium">You have unsaved changes</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                hasChanges && !isSaving
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
