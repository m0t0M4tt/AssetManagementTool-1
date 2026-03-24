export interface ProvisioningSteps {
  apxNext: {
    createNextUser: boolean;
    provisionP1UserRoles: boolean;
    provisionP1ConcurrentLogins: boolean;
    p1ProvisionUnitId: boolean;
    p1UnitPreassignment: boolean;
    placeUnitOnDutyPsap: boolean;
    awareAddDevice: boolean;
    p1AddDevice: boolean;
    awareDataSharing: boolean;
  };
  apxN70: {
    createNextUser: boolean;
    provisionP1UserRoles: boolean;
    provisionP1ConcurrentLogins: boolean;
    p1ProvisionUnitId: boolean;
    p1UnitPreassignment: boolean;
    placeUnitOnDutyPsap: boolean;
    awareAddDevice: boolean;
    p1AddDevice: boolean;
    awareDataSharing: boolean;
  };
  phoneApps: {
    responderCoreIdPhone: boolean;
    responderCoreIdPd: boolean;
    rapidDeployMapping: boolean;
    rapidDeployLightning: boolean;
  };
  svxV700: {
    setupInDeviceManagement: boolean;
    checkedOutToUser: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  status: string;
  hireDate: string;
  sourceTab: string;
  unit?: string;
  alias?: string;
  provisioningStatus?: 'Not Started' | 'In Progress' | 'Completed';
  provisioningSteps?: ProvisioningSteps;
  apxNextLogin?: string;
  apxN70Login?: string;
  apxNextUnitId?: string;
  apxN70UnitId?: string;
  apxNextAlias?: string;
  apxN70Alias?: string;
  responderDeviceId?: string;
}

export interface Device {
  id: string;
  serialNumber: string;
  assetTag: string;
  model: string;
  category: string;
  assignedTo: string;
  status: string;
  location: string;
  notes: string;
  radioId?: string;
  ecoId?: string;
  chicagoId?: string;
  owner?: string;
  unit?: string;
  alias?: string;
  sourceTab?: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDevices: number;
  availableDevices: number;
  assignedDevices: number;
}
