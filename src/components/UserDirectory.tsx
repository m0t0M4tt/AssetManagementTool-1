import { useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, CheckCircle2, Circle, RefreshCw, Minus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { User } from '../lib/types';
import UserDetailModal from './UserDetailModal';

export default function UserDirectory() {
  const { users, devices, usersLoading: loading, usersError: error, addUser, updateUser, deleteUser, refreshData } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Get unique tabs for filter dropdown
  const uniqueTabs = ['all', ...Array.from(new Set(users.map(u => u.sourceTab)))].filter(Boolean);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      selectedTab === 'all' || user.sourceTab.includes(selectedTab);

    return matchesSearch && matchesTab;
  });

  const handleAddUser = async (formData: FormData) => {
    const newUser = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      department: formData.get('department') as string,
      status: formData.get('status') as string,
      hireDate: formData.get('hireDate') as string,
      sourceTab: formData.get('sourceTab') as string || 'Haas',
    };

    try {
      await addUser(newUser);
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add user:', err);
      alert('Failed to add user. Please try again.');
    }
  };

  const handleUpdateUser = async (formData: FormData) => {
    if (!editingUser) return;

    const updates = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      department: formData.get('department') as string,
      status: formData.get('status') as string,
      hireDate: formData.get('hireDate') as string,
    };

    try {
      await updateUser(editingUser.id, updates);
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update user:', err);
      alert('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(id);
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user. Please try again.');
    }
  };

  const getEquipmentProvisioningStatus = (user: User, equipmentType: 'apxNext' | 'apxN70' | 'phoneApps' | 'svxV700'): 'completed' | 'partial' | 'none' => {
    if (!user.provisioningSteps) return 'none';

    const steps = user.provisioningSteps[equipmentType];
    if (!steps) return 'none';

    const allSteps = Object.values(steps);
    const completedSteps = allSteps.filter(Boolean).length;

    if (completedSteps === 0) return 'none';
    if (completedSteps === allSteps.length) return 'completed';
    return 'partial';
  };

  const getOverallProvisioningStatus = (user: User): 'Not Started' | 'In Progress' | 'Completed' => {
    if (!user.provisioningSteps) return 'Not Started';

    const equipment = hasEquipment(user, devices);
    const relevantSteps = [];

    if (equipment.apxNext) relevantSteps.push(...Object.values(user.provisioningSteps.apxNext));
    if (equipment.apxN70) relevantSteps.push(...Object.values(user.provisioningSteps.apxN70));
    if (equipment.phone) relevantSteps.push(...Object.values(user.provisioningSteps.phoneApps || {}));
    if (equipment.svxV700) relevantSteps.push(...Object.values(user.provisioningSteps.svxV700 || {}));

    if (relevantSteps.length === 0) return 'Not Started';

    const completedSteps = relevantSteps.filter(Boolean).length;

    if (completedSteps === 0) return 'Not Started';
    if (completedSteps === relevantSteps.length) return 'Completed';
    return 'In Progress';
  };

  const hasEquipment = (user: User, devices: any[]): { apxNext: boolean; apxN70: boolean; phone: boolean; svxV700: boolean } => {
    const userDevices = devices.filter(d => d.assignedTo === user.name || d.owner === user.name);

    return {
      apxNext: userDevices.some(d => d.model === 'APX Next'),
      apxN70: userDevices.some(d => d.model === 'APX N70'),
      phone: !!(user.apxNextLogin || user.apxN70Login),
      svxV700: userDevices.some(d => d.model === 'V700' || d.model === 'SVX'),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">User Directory</h1>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isRefreshing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-600 text-white hover:bg-slate-700'
            }`}
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add User
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-64">
          <select
            value={selectedTab}
            onChange={(e) => setSelectedTab(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {uniqueTabs.map((tab) => (
              <option key={tab} value={tab}>
                {tab === 'all' ? 'All Regions' : `Region: ${tab}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Department</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Region</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Provisioning</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredUsers.map((user) => {
              const equipment = hasEquipment(user, devices);
              const provStatus = getOverallProvisioningStatus(user);

              return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td onClick={() => setViewingUser(user)} className="px-6 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                  <td onClick={() => setViewingUser(user)} className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td onClick={() => setViewingUser(user)} className="px-6 py-4 text-sm text-slate-600">{user.department}</td>
                  <td onClick={() => setViewingUser(user)} className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {user.sourceTab}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {equipment.apxNext && (
                        <div className="flex items-center gap-1">
                          {getEquipmentProvisioningStatus(user, 'apxNext') === 'completed' ? (
                            <CheckCircle2 size={18} className="text-green-600" title="APX Next - All steps completed" />
                          ) : getEquipmentProvisioningStatus(user, 'apxNext') === 'partial' ? (
                            <Minus size={18} className="text-amber-600" title="APX Next - In progress" />
                          ) : (
                            <Circle size={18} className="text-slate-300" title="APX Next - Not started" />
                          )}
                        </div>
                      )}
                      {equipment.apxN70 && (
                        <div className="flex items-center gap-1">
                          {getEquipmentProvisioningStatus(user, 'apxN70') === 'completed' ? (
                            <CheckCircle2 size={18} className="text-green-600" title="APX N70 - All steps completed" />
                          ) : getEquipmentProvisioningStatus(user, 'apxN70') === 'partial' ? (
                            <Minus size={18} className="text-amber-600" title="APX N70 - In progress" />
                          ) : (
                            <Circle size={18} className="text-slate-300" title="APX N70 - Not started" />
                          )}
                        </div>
                      )}
                      {equipment.phone && (
                        <div className="flex items-center gap-1">
                          {getEquipmentProvisioningStatus(user, 'phoneApps') === 'completed' ? (
                            <CheckCircle2 size={18} className="text-green-600" title="Phone Apps - All steps completed" />
                          ) : getEquipmentProvisioningStatus(user, 'phoneApps') === 'partial' ? (
                            <Minus size={18} className="text-amber-600" title="Phone Apps - In progress" />
                          ) : (
                            <Circle size={18} className="text-slate-300" title="Phone Apps - Not started" />
                          )}
                        </div>
                      )}
                      {equipment.svxV700 && (
                        <div className="flex items-center gap-1">
                          {getEquipmentProvisioningStatus(user, 'svxV700') === 'completed' ? (
                            <CheckCircle2 size={18} className="text-green-600" title="SVX/V700 - All steps completed" />
                          ) : getEquipmentProvisioningStatus(user, 'svxV700') === 'partial' ? (
                            <Minus size={18} className="text-amber-600" title="SVX/V700 - In progress" />
                          ) : (
                            <Circle size={18} className="text-slate-300" title="SVX/V700 - Not started" />
                          )}
                        </div>
                      )}
                      {!equipment.apxNext && !equipment.apxN70 && !equipment.phone && !equipment.svxV700 && (
                        <span className="text-xs text-slate-400">No equipment</span>
                      )}
                    </div>
                  </td>
                  <td onClick={() => setViewingUser(user)} className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        provStatus === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : provStatus === 'In Progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {provStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingUser(user);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(user.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            {searchTerm ? 'No users found matching your search.' : 'No users found.'}
          </div>
        )}
      </div>

      {showAddModal && (
        <UserFormModal
          title="Add New User"
          onSubmit={handleAddUser}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingUser && (
        <UserFormModal
          title="Edit User"
          user={editingUser}
          onSubmit={handleUpdateUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {viewingUser && (
        <UserDetailModal
          user={viewingUser}
          devices={devices}
          provisioningSteps={viewingUser.provisioningSteps || {
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
              svxInDeviceManagement: false,
              svxCheckedOutToUser: false,
              svxAssignedInAware: false,
              v700InDeviceManagement: false,
              v700CheckOutToUser: false,
              v700AssignedInAware: false,
            }
          }}
          onClose={() => setViewingUser(null)}
        />
      )}
    </div>
  );
}

interface UserFormModalProps {
  title: string;
  user?: User;
  onSubmit: (formData: FormData) => void;
  onClose: () => void;
}

function UserFormModal({ title, user, onSubmit, onClose }: UserFormModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              defaultValue={user?.name}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              defaultValue={user?.email}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <input
              type="text"
              name="department"
              defaultValue={user?.department}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={user?.status || 'active'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hire Date</label>
            <input
              type="date"
              name="hireDate"
              defaultValue={user?.hireDate}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
            <select
              name="sourceTab"
              defaultValue={user?.sourceTab || 'Haas'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Haas">Haas</option>
              <option value="Presales">Presales</option>
              <option value="Central">Central</option>
              <option value="Northeast">Northeast</option>
              <option value="Southeast">Southeast</option>
              <option value="West">West</option>
              <option value="Federal">Federal</option>
              <option value="Software">Software</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {user ? 'Update' : 'Add'} User
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
