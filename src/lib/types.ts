export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  status: string;
  hireDate: string;
}

export interface Device {
  id: string;
  serialNumber: string;
  assetTag: string;
  model: string;
  assignedTo: string;
  status: string;
  location: string;
  notes: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDevices: number;
  availableDevices: number;
  assignedDevices: number;
}
