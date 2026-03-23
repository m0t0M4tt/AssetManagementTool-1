import { getSheetWithCustomHeader } from './googleSheets';
import type { User, Device } from './types';

export class DataService {
  private static async getSheet(accessToken: string, tabName: string) {
    return await getSheetWithCustomHeader(accessToken, tabName);
  }

  static async fetchUsers(accessToken: string): Promise<User[]> {
    const targetTabs = [
      'Haas',
      'Presales',
      'Central',
      'Northeast',
      'Southeast',
      'West',
      'Federal',
      'Software'
    ];

    const allUsers: User[] = [];
    const userMap = new Map<string, User>();

    for (const tabName of targetTabs) {
      try {
        const sheet = await this.getSheet(accessToken, tabName);
        const rows = await sheet.getRows();

        for (const row of rows) {
          const email = row.get('Login Email') || '';
          const name = row.get('Owner') || '';
          const group = row.get('Group') || tabName;
          const cadUnit = row.get('CAD UNIT') || '';

          // Skip empty rows
          if (!email && !name) continue;

          const userKey = email || name;

          // Check for duplicates
          if (userMap.has(userKey)) {
            const existingUser = userMap.get(userKey)!;
            // Merge: prefer non-empty values
            existingUser.sourceTab = `${existingUser.sourceTab}, ${tabName}`;
            if (!existingUser.id && cadUnit) existingUser.id = cadUnit;
            if (!existingUser.name && name) existingUser.name = name;
            if (!existingUser.email && email) existingUser.email = email;
            if (!existingUser.department && group) existingUser.department = group;
          } else {
            // Add new user
            const newUser: User = {
              id: cadUnit || crypto.randomUUID(),
              name: name,
              email: email,
              department: group,
              status: 'active',
              hireDate: '',
              sourceTab: tabName,
            };
            userMap.set(userKey, newUser);
            allUsers.push(newUser);
          }
        }

        console.log(`Successfully loaded ${rows.length} rows from ${tabName} tab`);
      } catch (error) {
        console.warn(`Failed to load ${tabName} tab, skipping:`, error);
      }
    }

    console.log(`Total users loaded: ${allUsers.length}`);
    return allUsers;
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
      // Default to adding to the sourceTab if provided, otherwise Haas
      const targetTab = user.sourceTab || 'Haas';
      const sheet = await this.getSheet(accessToken, targetTab);

      const newUser: User = {
        id: crypto.randomUUID(),
        ...user,
        sourceTab: targetTab,
      };

      await sheet.addRow({
        'CAD UNIT': newUser.id,
        'Owner': newUser.name,
        'Login Email': newUser.email,
        'Group': newUser.department,
      });

      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  static async updateUser(accessToken: string, id: string, updates: Partial<User>): Promise<void> {
    const targetTabs = [
      'Haas',
      'Presales',
      'Central',
      'Northeast',
      'Southeast',
      'West',
      'Federal',
      'Software'
    ];

    // Try to find the user across all tabs
    for (const tabName of targetTabs) {
      try {
        const sheet = await this.getSheet(accessToken, tabName);
        const rows = await sheet.getRows();
        const row = rows.find(r => r.get('CAD UNIT') === id);

        if (row) {
          if (updates.name) row.set('Owner', updates.name);
          if (updates.email) row.set('Login Email', updates.email);
          if (updates.department) row.set('Group', updates.department);

          await row.save();
          console.log(`User ${id} updated in ${tabName} tab`);
          return;
        }
      } catch (error) {
        console.warn(`Error checking ${tabName} tab:`, error);
      }
    }

    throw new Error(`User with id ${id} not found in any tab`);
  }

  static async deleteUser(accessToken: string, id: string): Promise<void> {
    const targetTabs = [
      'Haas',
      'Presales',
      'Central',
      'Northeast',
      'Southeast',
      'West',
      'Federal',
      'Software'
    ];

    // Try to find and delete the user across all tabs
    for (const tabName of targetTabs) {
      try {
        const sheet = await this.getSheet(accessToken, tabName);
        const rows = await sheet.getRows();
        const row = rows.find(r => r.get('CAD UNIT') === id);

        if (row) {
          await row.delete();
          console.log(`User ${id} deleted from ${tabName} tab`);
          return;
        }
      } catch (error) {
        console.warn(`Error checking ${tabName} tab:`, error);
      }
    }

    throw new Error(`User with id ${id} not found in any tab`);
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
