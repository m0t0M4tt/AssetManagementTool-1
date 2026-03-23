import { getGoogleSheetDoc } from './googleSheets';
import type { User, Device } from './types';

export class DataService {
  private static async getSheet(tabName: string) {
    const doc = await getGoogleSheetDoc();
    const sheet = doc.sheetsByTitle[tabName];

    if (!sheet) {
      throw new Error(`Sheet tab "${tabName}" not found`);
    }

    return sheet;
  }

  static async fetchUsers(): Promise<User[]> {
    try {
      const sheet = await this.getSheet('Directory');
      const rows = await sheet.getRows();

      return rows.map(row => ({
        id: row.get('id') || crypto.randomUUID(),
        name: row.get('name') || '',
        email: row.get('email') || '',
        department: row.get('department') || '',
        status: row.get('status') || 'active',
        hireDate: row.get('hireDate') || '',
      }));
    } catch (error) {
      console.error('Error fetching users from Directory tab:', error);
      throw error;
    }
  }

  static async fetchDevices(): Promise<Device[]> {
    try {
      const allDevices: Device[] = [];

      const presalesSheet = await this.getSheet('Presales').catch(() => null);
      if (presalesSheet) {
        const rows = await presalesSheet.getRows();
        const devices = rows.map(row => ({
          id: row.get('id') || crypto.randomUUID(),
          serialNumber: row.get('serialNumber') || '',
          assetTag: row.get('assetTag') || '',
          model: row.get('model') || '',
          assignedTo: row.get('assignedTo') || '',
          status: row.get('status') || 'available',
          location: row.get('location') || '',
          notes: row.get('notes') || '',
        }));
        allDevices.push(...devices);
      }

      const formResponsesSheet = await this.getSheet('Form Responses').catch(() => null);
      if (formResponsesSheet) {
        const rows = await formResponsesSheet.getRows();
        const devices = rows.map(row => ({
          id: row.get('id') || crypto.randomUUID(),
          serialNumber: row.get('serialNumber') || '',
          assetTag: row.get('assetTag') || '',
          model: row.get('model') || '',
          assignedTo: row.get('assignedTo') || '',
          status: row.get('status') || 'available',
          location: row.get('location') || '',
          notes: row.get('notes') || '',
        }));
        allDevices.push(...devices);
      }

      return allDevices;
    } catch (error) {
      console.error('Error fetching devices from Presales and Form Responses tabs:', error);
      throw error;
    }
  }

  static async addUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      const sheet = await this.getSheet('Directory');

      const newUser: User = {
        id: crypto.randomUUID(),
        ...user,
      };

      await sheet.addRow({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        department: newUser.department,
        status: newUser.status,
        hireDate: newUser.hireDate,
      });

      return newUser;
    } catch (error) {
      console.error('Error adding user to Directory tab:', error);
      throw error;
    }
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<void> {
    try {
      const sheet = await this.getSheet('Directory');
      const rows = await sheet.getRows();
      const row = rows.find(r => r.get('id') === id);

      if (!row) {
        throw new Error(`User with id ${id} not found`);
      }

      Object.keys(updates).forEach(key => {
        if (key !== 'id') {
          row.set(key, updates[key as keyof User] as string);
        }
      });

      await row.save();
    } catch (error) {
      console.error('Error updating user in Directory tab:', error);
      throw error;
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      const sheet = await this.getSheet('Directory');
      const rows = await sheet.getRows();
      const row = rows.find(r => r.get('id') === id);

      if (!row) {
        throw new Error(`User with id ${id} not found`);
      }

      await row.delete();
    } catch (error) {
      console.error('Error deleting user from Directory tab:', error);
      throw error;
    }
  }

  static async addDevice(device: Omit<Device, 'id'>, targetTab: 'Presales' | 'Form Responses' = 'Presales'): Promise<Device> {
    try {
      const sheet = await this.getSheet(targetTab);

      const newDevice: Device = {
        id: crypto.randomUUID(),
        ...device,
      };

      await sheet.addRow({
        id: newDevice.id,
        serialNumber: newDevice.serialNumber,
        assetTag: newDevice.assetTag,
        model: newDevice.model,
        assignedTo: newDevice.assignedTo,
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

  static async updateDevice(id: string, updates: Partial<Device>): Promise<void> {
    try {
      for (const tabName of ['Presales', 'Form Responses']) {
        const sheet = await this.getSheet(tabName).catch(() => null);
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

  static async deleteDevice(id: string): Promise<void> {
    try {
      for (const tabName of ['Presales', 'Form Responses']) {
        const sheet = await this.getSheet(tabName).catch(() => null);
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
