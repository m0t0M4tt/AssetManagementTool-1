export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  status: string;
  hireDate: string;
  sourceTab: string;
  provisioningStatus?: 'Not Started' | 'In Progress' | 'Completed';
  provisioningSteps?: {
    stage: boolean;
    enroll: boolean;
    test: boolean;
  };
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
  systemName?: string;
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
