import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useDevices } from '../hooks/useGoogleSheets';
import type { Device } from '../lib/types';

export default function Devices() {
  const { devices, loading, error, addDevice, updateDevice, deleteDevice } = useDevices();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get('filter');
    if (filterParam && ['available', 'assigned', 'maintenance', 'retired'].includes(filterParam)) {
      setFilterStatus(filterParam);
    }
  }, []);

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.radioId && device.radioId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.ecoId && device.ecoId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.chicagoId && device.chicagoId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.alias && device.alias.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || device.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleAddDevice = async (formData: FormData) => {
    const newDevice = {
      serialNumber: formData.get('serialNumber') as string,
      assetTag: '',
      model: formData.get('model') as string,
      category: formData.get('category') as string,
      assignedTo: formData.get('assignedTo') as string,
      status: formData.get('status') as string,
      location: formData.get('location') as string,
      notes: formData.get('notes') as string,
      radioId: formData.get('radioId') as string,
    };

    try {
      await addDevice(newDevice);
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add device:', err);
      alert('Failed to add device. Please try again.');
    }
  };

  const handleUpdateDevice = async (formData: FormData) => {
    if (!editingDevice) return;

    const updates = {
      serialNumber: formData.get('serialNumber') as string,
      assetTag: '',
      model: formData.get('model') as string,
      category: formData.get('category') as string,
      assignedTo: formData.get('assignedTo') as string,
      status: formData.get('status') as string,
      location: formData.get('location') as string,
      notes: formData.get('notes') as string,
      radioId: formData.get('radioId') as string,
    };

    try {
      await updateDevice(editingDevice.id, updates);
      setEditingDevice(null);
    } catch (err) {
      console.error('Failed to update device:', err);
      alert('Failed to update device. Please try again.');
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    try {
      await deleteDevice(id);
    } catch (err) {
      console.error('Failed to delete device:', err);
      alert('Failed to delete device. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Loading devices...</div>
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
        <h1 className="text-3xl font-bold text-slate-900">Device Inventory</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Device
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="LTE Radio">LTE Radio</option>
          <option value="Body Worn Camera">Body Worn Camera</option>
          <option value="Video RSM">Video RSM</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            filterStatus !== 'all'
              ? 'border-blue-500 bg-blue-50 font-medium text-blue-900'
              : 'border-slate-300'
          }`}
        >
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Serial Number</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Model</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">ECO ID (1C1)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Chicago ID (040)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Assigned To</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Location</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredDevices.map((device) => (
              <tr key={device.serialNumber} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{device.serialNumber}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{device.model}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{device.category}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{device.ecoId || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{device.chicagoId || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{device.assignedTo || '-'}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
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
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{device.location}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingDevice(device)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredDevices.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            {searchTerm || filterStatus !== 'all' ? 'No devices found matching your filters.' : 'No devices found.'}
          </div>
        )}
      </div>

      {showAddModal && (
        <DeviceFormModal
          title="Add New Device"
          onSubmit={handleAddDevice}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingDevice && (
        <DeviceFormModal
          title="Edit Device"
          device={editingDevice}
          onSubmit={handleUpdateDevice}
          onClose={() => setEditingDevice(null)}
        />
      )}
    </div>
  );
}

interface DeviceFormModalProps {
  title: string;
  device?: Device;
  onSubmit: (formData: FormData) => void;
  onClose: () => void;
}

function DeviceFormModal({ title, device, onSubmit, onClose }: DeviceFormModalProps) {
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
            <input
              type="text"
              name="serialNumber"
              defaultValue={device?.serialNumber}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
            <input
              type="text"
              name="model"
              defaultValue={device?.model}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              name="category"
              defaultValue={device?.category || 'LTE Radio'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LTE Radio">LTE Radio</option>
              <option value="Body Worn Camera">Body Worn Camera</option>
              <option value="Video RSM">Video RSM</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
            <input
              type="text"
              name="assignedTo"
              defaultValue={device?.assignedTo}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={device?.status || 'available'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              defaultValue={device?.location}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Radio ID</label>
            <input
              type="text"
              name="radioId"
              defaultValue={device?.radioId}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              name="notes"
              defaultValue={device?.notes}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {device ? 'Update' : 'Add'} Device
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
