import { X, User as UserIcon, Mail, MapPin, Package, Radio, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { User, Device } from '../lib/types';

interface UserDetailModalProps {
  user: User;
  devices: Device[];
  provisioningSteps: {
    stage: boolean;
    enroll: boolean;
    test: boolean;
  };
  onClose: () => void;
}

export default function UserDetailModal({ user, devices, provisioningSteps, onClose }: UserDetailModalProps) {
  const assignedDevices = devices.filter(d => d.assignedTo === user.name || d.owner === user.name);

  const ecoIds = assignedDevices
    .map(d => d.ecoId)
    .filter((id): id is string => Boolean(id));

  const chicagoIds = assignedDevices
    .map(d => d.chicagoId)
    .filter((id): id is string => Boolean(id));

  const completedSteps = Object.values(provisioningSteps).filter(Boolean).length;
  const provisioningStatus = completedSteps === 0 ? 'Not Started' : completedSteps === 3 ? 'Completed' : 'In Progress';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{user.sourceTab}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <UserIcon size={20} className="text-blue-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Department</p>
                <p className="text-slate-900 mt-1">{user.department}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <p className="text-slate-900 mt-1 capitalize">{user.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Hire Date</p>
                <p className="text-slate-900 mt-1">{user.hireDate || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Region</p>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mt-1">
                  {user.sourceTab}
                </span>
              </div>
            </div>
          </div>

          {(user.unit || user.alias) && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Assignment Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                {user.unit && (
                  <div>
                    <p className="text-sm font-medium text-slate-600">Unit ID</p>
                    <p className="text-lg font-bold text-blue-900 mt-1">{user.unit}</p>
                  </div>
                )}
                {user.alias && (
                  <div>
                    <p className="text-sm font-medium text-slate-600">Alias</p>
                    <p className="text-lg font-bold text-blue-900 mt-1">{user.alias}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Package size={20} className="text-green-600" />
              Assigned Devices ({assignedDevices.length})
            </h3>
            {assignedDevices.length > 0 ? (
              <div className="space-y-3">
                {assignedDevices.map((device) => (
                  <div
                    key={device.id}
                    className="bg-white rounded-lg p-4 border border-slate-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900">{device.model}</h4>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                            {device.category}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <span className="text-slate-500">Serial Number:</span>
                            <span className="ml-2 font-medium text-slate-900">{device.serialNumber}</span>
                          </div>
                          {device.assetTag && (
                            <div>
                              <span className="text-slate-500">Asset Tag:</span>
                              <span className="ml-2 font-medium text-slate-900">{device.assetTag}</span>
                            </div>
                          )}
                          {device.location && (
                            <div>
                              <span className="text-slate-500">Location:</span>
                              <span className="ml-2 font-medium text-slate-900">{device.location}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-500">Status:</span>
                            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                              device.status === 'available'
                                ? 'bg-green-100 text-green-800'
                                : device.status === 'assigned'
                                ? 'bg-blue-100 text-blue-800'
                                : device.status === 'maintenance'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {device.status}
                            </span>
                          </div>
                        </div>
                        {device.notes && (
                          <div className="mt-2 text-sm text-slate-600 italic">
                            <span className="font-medium">Notes:</span> {device.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center border border-slate-200">
                <AlertCircle size={40} className="mx-auto text-slate-400 mb-2" />
                <p className="text-slate-600">No devices currently assigned to this user.</p>
              </div>
            )}
          </div>

          {(ecoIds.length > 0 || chicagoIds.length > 0) && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Radio size={20} className="text-amber-600" />
                System IDs
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {ecoIds.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">ECO ID (1C1)</p>
                    <div className="space-y-1">
                      {ecoIds.map((id, idx) => (
                        <div key={idx} className="bg-white px-3 py-2 rounded border border-slate-200">
                          <span className="font-mono text-sm text-slate-900">{id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {chicagoIds.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">Chicago ID (040)</p>
                    <div className="space-y-1">
                      {chicagoIds.map((id, idx) => (
                        <div key={idx} className="bg-white px-3 py-2 rounded border border-slate-200">
                          <span className="font-mono text-sm text-slate-900">{id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-600" />
              Provisioning Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-700">Overall Status</span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    provisioningStatus === 'Completed'
                      ? 'bg-green-100 text-green-800'
                      : provisioningStatus === 'In Progress'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {provisioningStatus}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className={`bg-white p-4 rounded-lg border-2 ${
                  provisioningSteps.stage ? 'border-green-300 bg-green-50' : 'border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700">Stage</span>
                    {provisioningSteps.stage ? (
                      <CheckCircle2 size={20} className="text-green-600" />
                    ) : (
                      <Circle size={20} className="text-slate-300" />
                    )}
                  </div>
                  <p className={`text-xs ${provisioningSteps.stage ? 'text-green-700' : 'text-slate-500'}`}>
                    {provisioningSteps.stage ? 'Complete' : 'Pending'}
                  </p>
                </div>
                <div className={`bg-white p-4 rounded-lg border-2 ${
                  provisioningSteps.enroll ? 'border-green-300 bg-green-50' : 'border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700">Enroll</span>
                    {provisioningSteps.enroll ? (
                      <CheckCircle2 size={20} className="text-green-600" />
                    ) : (
                      <Circle size={20} className="text-slate-300" />
                    )}
                  </div>
                  <p className={`text-xs ${provisioningSteps.enroll ? 'text-green-700' : 'text-slate-500'}`}>
                    {provisioningSteps.enroll ? 'Complete' : 'Pending'}
                  </p>
                </div>
                <div className={`bg-white p-4 rounded-lg border-2 ${
                  provisioningSteps.test ? 'border-green-300 bg-green-50' : 'border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700">Test</span>
                    {provisioningSteps.test ? (
                      <CheckCircle2 size={20} className="text-green-600" />
                    ) : (
                      <Circle size={20} className="text-slate-300" />
                    )}
                  </div>
                  <p className={`text-xs ${provisioningSteps.test ? 'text-green-700' : 'text-slate-500'}`}>
                    {provisioningSteps.test ? 'Complete' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
