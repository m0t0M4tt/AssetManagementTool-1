import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Search, Filter, Plus, X } from 'lucide-react';
import type { Database, DeviceType, DeviceStatus } from '../lib/database.types';

type DeviceRow = Database['public']['Tables']['devices']['Row'];

interface DeviceWithUser extends DeviceRow {
  user_name?: string;
}

export default function Devices() {
  const [devices, setDevices] = useState<DeviceWithUser[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<DeviceWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_type: 'APX_NEXT' as DeviceType,
    serial_number: '',
    device_id: '',
    status: 'available' as DeviceStatus,
    notes: '',
  });

  const deviceTypes: DeviceType[] = ['APX_NEXT', 'N70', 'V700', 'SVX'];
  const deviceStatuses: DeviceStatus[] = ['available', 'assigned', 'retired', 'maintenance'];

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterType, filterStatus, devices]);

  async function loadDevices() {
    try {
      const { data: devicesData, error } = await supabase
        .from('devices')
        .select('*')
        .order('device_type');

      if (error) throw error;

      const devicesWithUsers = await Promise.all(
        (devicesData || []).map(async (device) => {
          if (device.user_id) {
            const { data: userData } = await supabase
              .from('users_directory')
              .select('name')
              .eq('id', device.user_id)
              .maybeSingle();

            return { ...device, user_name: userData?.name };
          }
          return device;
        })
      );

      setDevices(devicesWithUsers);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...devices];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (device) =>
          device.serial_number.toLowerCase().includes(term) ||
          device.device_id.toLowerCase().includes(term) ||
          device.device_type.toLowerCase().includes(term) ||
          device.user_name?.toLowerCase().includes(term)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((device) => device.device_type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((device) => device.status === filterStatus);
    }

    setFilteredDevices(filtered);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'assigned':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'available':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'retired':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'APX_NEXT':
        return 'bg-purple-100 text-purple-800';
      case 'N70':
        return 'bg-cyan-100 text-cyan-800';
      case 'V700':
        return 'bg-emerald-100 text-emerald-800';
      case 'SVX':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }

  async function handleAddDevice() {
    if (!newDevice.serial_number) {
      alert('Serial number is required');
      return;
    }

    try {
      const { error } = await supabase.from('devices').insert({
        device_type: newDevice.device_type,
        serial_number: newDevice.serial_number,
        device_id: newDevice.device_id,
        status: newDevice.status,
        notes: newDevice.notes,
      });

      if (error) throw error;

      setShowAddModal(false);
      setNewDevice({
        device_type: 'APX_NEXT',
        serial_number: '',
        device_id: '',
        status: 'available',
        notes: '',
      });
      loadDevices();
    } catch (error) {
      console.error('Error adding device:', error);
      alert('Failed to add device: ' + (error as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading devices...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Device Inventory</h1>
          <p className="text-slate-600 mt-1">Manage and track all devices across territories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Device
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by serial, device ID, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Types</option>
              {deviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Statuses</option>
              {deviceStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Device ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No devices found. Try adjusting your filters or add a new device.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(device.device_type)}`}>
                        {device.device_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{device.serial_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {device.device_id || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {device.user_name || <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          device.status
                        )}`}
                      >
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {device.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-600">
        Showing {filteredDevices.length} of {devices.length} devices
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Add New Device</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Device Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newDevice.device_type}
                  onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value as DeviceType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {deviceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Serial Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDevice.serial_number}
                  onChange={(e) => setNewDevice({ ...newDevice, serial_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter serial number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Device ID</label>
                <input
                  type="text"
                  value={newDevice.device_id}
                  onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter device ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={newDevice.status}
                  onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value as DeviceStatus })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {deviceStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={newDevice.notes}
                  onChange={(e) => setNewDevice({ ...newDevice, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add any notes about this device"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDevice}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
