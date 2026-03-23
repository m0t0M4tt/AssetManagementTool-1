import { getSheetWithCustomHeader } from './googleSheets';
import type { User, Device } from './types';

export class DataService {
  private static async getSheet(accessToken: string, tabName: string) {
    return await getSheetWithCustomHeader(accessToken, tabName);
  }

  static async fetchUsers(accessToken: string): Promise<User[]> {
    try {
      const sheet = await this.getSheet(accessToken, 'Haas');
      const rows = await sheet.getRows();

      return rows.map(row => ({
        id: row.get('CAD UNIT') || crypto.randomUUID(),
        name: row.get('Owner') || '',
        email: row.get('Login Email') || '',
        department: row.get('Group') || '',
        status: 'active',
        hireDate: '',
      }));
    } catch (error) {
      console.error('Error fetching users from Haas tab:', error);
      throw error;
    }
  }

  static async fetchDevices(accessToken: string): Promise<Device[]> {
    try {
      const allDevices: Device[] = [];

      // Try Presales tab with Row 3 headers
      try {
        const presalesSheet = await this.getSheet(accessToken, 'Presales');
        const rows = await presalesSheet.getRows();
        const devices = rows.map(row => ({
          id: row.get('id') || crypto.randomUUID(),
          serialNumber: row.get('Serial Number') || '',
          assetTag: row.get('assetTag') || '',
          model: row.get('Model') || '',
          assignedTo: row.get('Assigned To') || '',
          status: row.get('status') || 'available',
          location: row.get('location') || '',
          notes: row.get('notes') || '',
        }));
        allDevices.push(...devices);
      } catch (presalesError) {
        console.warn('Presales tab not found or missing Row 3 headers, skipping:', presalesError);
      }

      // Try Form Responses tab with Row 3 headers
      try {
        const formResponsesSheet = await this.getSheet(accessToken, 'Form Responses');
        const rows = await formResponsesSheet.getRows();
        const devices = rows.map(row => ({
          id: row.get('id') || crypto.randomUUID(),
          serialNumber: row.get('Serial Number') || '',
          assetTag: row.get('assetTag') || '',
          model: row.get('Model') || '',
          assignedTo: row.get('Assigned To') || '',
          status: row.get('status') || 'available',
          location: row.get('location') || '',
          notes: row.get('notes') || '',
        }));
        allDevices.push(...devices);
      } catch (formError) {
        console.warn('Form Responses tab not found or missing Row 3 headers, skipping:', formError);
      }

      return allDevices;
    } catch (error) {
      console.error('Error fetching devices from Presales and Form Responses tabs:', error);
      throw error;
    }
  }

  static async addUser(accessToken: string, user: Omit<User, 'id'>): Promise<User> {
    try {
      const sheet = await this.getSheet(accessToken, 'Haas');

      const newUser: User = {
        id: crypto.randomUUID(),
        ...user,
      };

      await sheet.addRow({
        'CAD UNIT': newUser.id,
        'Owner': newUser.name,
        'Login Email': newUser.email,
        'Group': newUser.department,
      });

      return newUser;
    } catch (error) {
      console.error('Error adding user to Haas tab:', error);
      throw error;
    }
  }

  static async updateUser(accessToken: string, id: string, updates: Partial<User>): Promise<void> {
    try {
      const sheet = await this.getSheet(accessToken, 'Haas');
      const rows = await sheet.getRows();
      const row = rows.find(r => r.get('CAD UNIT') === id);

      if (!row) {
        throw new Error(`User with id ${id} not found`);
      }

      if (updates.name) row.set('Owner', updates.name);
      if (updates.email) row.set('Login Email', updates.email);
      if (updates.department) row.set('Group', updates.department);

      await row.save();
    } catch (error) {
      console.error('Error updating user in Haas tab:', error);
      throw error;
    }
  }

  static async deleteUser(accessToken: string, id: string): Promise<void> {
    try {
      const sheet = await this.getSheet(accessToken, 'Haas');
      const rows = await sheet.getRows();
      const row = rows.find(r => r.get('CAD UNIT') === id);

      if (!row) {
        throw new Error(`User with id ${id} not found`);
      }

      await row.delete();
    } catch (error) {
      console.error('Error deleting user from Haas tab:', error);
      throw error;
    }
  }

  static async addDevice(accessToken: string, device: Omit<Device, 'id'>, targetTab: 'Presales' | 'Form Responses' = 'Presales'): Promise<Device> {
    try {
      const sheet = await this.getSheet(accessToken, targetTab);

      const newDevice: Device = {
        id: crypto.randomUUID(),
        ...device,
      };

      await sheet.addRow({
        id: newDevice.id,
        'Serial Number': newDevice.serialNumber,
        assetTag: newDevice.assetTag,
        Model: newDevice.model,
        'Assigned To': newDevice.assignedTo,
        status: newDevice.status,
        location: newDevice.location,
        notes: newDevice.notes,
      });

      return newDevice;
    } catch (error) {
      console.error(`Error adding device to ${targetTab} tab:`, error);
      throw error;
    }
  }

  static async updateDevice(accessToken: string, id: string, updates: Partial<Device>): Promise<void> {
    try {
      for (const tabName of ['Presales', 'Form Responses']) {
        const sheet = await this.getSheet(accessToken, tabName).catch(() => null);
        if (!sheet) continue;

        const rows = await sheet.getRows();
        const row = rows.find(r => r.get('id') === id);

        if (row) {
          Object.keys(updates).forEach(key => {
            if (key !== 'id') {
              row.set(key, updates[key as keyof Device] as string);
            }
          });

          await row.save();
          return;
        }
      }

      throw new Error(`Device with id ${id} not found in any tab`);
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  }

  static async deleteDevice(accessToken: string, id: string): Promise<void> {
    try {
      for (const tabName of ['Presales', 'Form Responses']) {
        const sheet = await this.getSheet(accessToken, tabName).catch(() => null);
        if (!sheet) continue;

        const rows = await sheet.getRows();
        const row = rows.find(r => r.get('id') === id);

        if (row) {
          await row.delete();
          return;
        }
      }

      throw new Error(`Device with id ${id} not found in any tab`);
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  }
}
