import { X, User as UserIcon, Mail, MapPin, Package, Radio, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { User, Device, ProvisioningSteps } from '../lib/types';

interface UserDetailModalProps {
  user: User;
  devices: Device[];
  provisioningSteps: ProvisioningSteps;
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

  const apxNextSteps = Object.values(provisioningSteps.apxNext);
  const apxN70Steps = Object.values(provisioningSteps.apxN70);
  const phoneAppsSteps = Object.values(provisioningSteps.phoneApps || {});
  const svxV700Steps = Object.values(provisioningSteps.svxV700 || {});
  const allSteps = [...apxNextSteps, ...apxN70Steps, ...phoneAppsSteps, ...svxV700Steps];
  const completedSteps = allSteps.filter(Boolean).length;
  const provisioningStatus = completedSteps === 0 ? 'Not Started' : completedSteps === allSteps.length ? 'Completed' : 'In Progress';

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

          {(user.apxNextUnitId || user.apxN70UnitId || user.apxNextAlias || user.apxN70Alias) && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">CommandCentral Responder</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user.apxNextUnitId || user.apxNextAlias) && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2">APX Next</p>
                    {user.apxNextUnitId && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-slate-500">Device ID (Column N)</p>
                        <p className="text-slate-900 font-mono text-sm mt-0.5">{user.apxNextUnitId}</p>
                      </div>
                    )}
                    {user.apxNextAlias && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Alias (Column AH)</p>
                        <p className="text-slate-900 font-mono text-sm mt-0.5">{user.apxNextAlias}</p>
                      </div>
                    )}
                  </div>
                )}
                {(user.apxN70UnitId || user.apxN70Alias) && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2">APX N70</p>
                    {user.apxN70UnitId && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-slate-500">Device ID (Column O)</p>
                        <p className="text-slate-900 font-mono text-sm mt-0.5">{user.apxN70UnitId}</p>
                      </div>
                    )}
                    {user.apxN70Alias && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Alias (Column AI)</p>
                        <p className="text-slate-900 font-mono text-sm mt-0.5">{user.apxN70Alias}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {(user.apxNextLogin || user.apxN70Login) && (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Radio size={20} className="text-emerald-600" />
                CommandCentral Login Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.apxNextLogin && (
                  <div className="bg-white rounded-lg p-3 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-700 uppercase mb-2">APX Next</p>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Login (Column C)</p>
                      <p className="text-slate-900 font-mono text-sm mt-0.5">{user.apxNextLogin}</p>
                    </div>
                  </div>
                )}
                {user.apxN70Login && (
                  <div className="bg-white rounded-lg p-3 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-700 uppercase mb-2">APX N70</p>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Login (Column H)</p>
                      <p className="text-slate-900 font-mono text-sm mt-0.5">{user.apxN70Login}</p>
                    </div>
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
                          {device.location && (
                            <div className="col-span-2">
                              <span className="text-slate-500">Location:</span>
                              <span className="ml-2 font-medium text-slate-900">{device.location}</span>
                            </div>
                          )}
                          {device.radioId && (
                            <div className="col-span-2 mt-2 pt-2 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 px-4 py-2 rounded-b-lg">
                              <p className="text-xs font-semibold text-slate-600 uppercase mb-1">
                                Radio IDs {device.model === 'APX Next' ? '(Columns AD-AE)' : device.model === 'APX N70' ? '(Columns AF-AG)' : ''}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {device.ecoId && (
                                  <div className="bg-green-100 px-2 py-1 rounded border border-green-200">
                                    <span className="text-xs text-green-700 font-medium">ECO (1C1):</span>
                                    <span className="ml-1 font-mono text-sm text-green-900">{device.ecoId}</span>
                                  </div>
                                )}
                                {device.chicagoId && (
                                  <div className="bg-blue-100 px-2 py-1 rounded border border-blue-200">
                                    <span className="text-xs text-blue-700 font-medium">Chicago (040):</span>
                                    <span className="ml-1 font-mono text-sm text-blue-900">{device.chicagoId}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
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
              Provisioning Progress (SET Checklist - Columns AM-BJ)
            </h3>
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Radio size={18} className="text-blue-600" />
                    APX Next Provisioning
                  </h4>
                  <div className="space-y-2">
                    {[
                      { key: 'createNextUser', label: 'Create Next User' },
                      { key: 'provisionP1UserRoles', label: 'Provision P1 User Roles' },
                      { key: 'provisionP1ConcurrentLogins', label: 'Provision P1 Concurrent Logins' },
                      { key: 'p1ProvisionUnitId', label: 'P1 - Provision Unit ID' },
                      { key: 'p1UnitPreassignment', label: 'P1 - Unit Preassignment' },
                      { key: 'placeUnitOnDutyPsap', label: 'Place Unit on Duty PSAP' },
                      { key: 'awareAddDevice', label: 'Aware - Add Device' },
                      { key: 'p1AddDevice', label: 'P1 - Add Device' },
                      { key: 'awareDataSharing', label: 'Aware - Data Sharing' }
                    ].map(step => {
                      const isComplete = provisioningSteps.apxNext[step.key as keyof typeof provisioningSteps.apxNext];
                      return (
                        <div key={step.key} className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-slate-200">
                          {isComplete ? (
                            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                          ) : (
                            <Circle size={16} className="text-slate-300 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${isComplete ? 'text-slate-900' : 'text-slate-500'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Radio size={18} className="text-purple-600" />
                    APX N70 Provisioning
                  </h4>
                  <div className="space-y-2">
                    {[
                      { key: 'createNextUser', label: 'Create Next User' },
                      { key: 'provisionP1UserRoles', label: 'Provision P1 User Roles' },
                      { key: 'provisionP1ConcurrentLogins', label: 'Provision P1 Concurrent Logins' },
                      { key: 'p1ProvisionUnitId', label: 'P1 - Provision Unit ID' },
                      { key: 'p1UnitPreassignment', label: 'P1 - Unit Preassignment' },
                      { key: 'placeUnitOnDutyPsap', label: 'Place Unit on Duty PSAP' },
                      { key: 'awareAddDevice', label: 'Aware - Add Device' },
                      { key: 'p1AddDevice', label: 'P1 - Add Device' },
                      { key: 'awareDataSharing', label: 'Aware - Data Sharing' }
                    ].map(step => {
                      const isComplete = provisioningSteps.apxN70[step.key as keyof typeof provisioningSteps.apxN70];
                      return (
                        <div key={step.key} className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-slate-200">
                          {isComplete ? (
                            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                          ) : (
                            <Circle size={16} className="text-slate-300 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${isComplete ? 'text-slate-900' : 'text-slate-500'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Radio size={18} className="text-green-600" />
                    Phone Applications
                  </h4>
                  <div className="space-y-2">
                    {[
                      { key: 'responderCoreIdPhone', label: 'Responder <COREIDPHONE>' },
                      { key: 'responderCoreIdPd', label: 'Responder <COREIDPD>' },
                      { key: 'rapidDeployMapping', label: 'RapidDeploy Mapping' },
                      { key: 'rapidDeployLightning', label: 'RapidDeploy Lightning' }
                    ].map(step => {
                      const isComplete = provisioningSteps.phoneApps?.[step.key as keyof typeof provisioningSteps.phoneApps];
                      return (
                        <div key={step.key} className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-slate-200">
                          {isComplete ? (
                            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                          ) : (
                            <Circle size={16} className="text-slate-300 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${isComplete ? 'text-slate-900' : 'text-slate-500'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <Radio size={18} className="text-amber-600" />
                    SVX/V700
                  </h4>
                  <div className="space-y-2">
                    {[
                      { key: 'setupInDeviceManagement', label: 'Setup in Device Management' },
                      { key: 'checkedOutToUser', label: 'Checked out to User' }
                    ].map(step => {
                      const isComplete = provisioningSteps.svxV700?.[step.key as keyof typeof provisioningSteps.svxV700];
                      return (
                        <div key={step.key} className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-slate-200">
                          {isComplete ? (
                            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                          ) : (
                            <Circle size={16} className="text-slate-300 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${isComplete ? 'text-slate-900' : 'text-slate-500'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
