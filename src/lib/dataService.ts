import { getSheetWithCustomHeader } from './googleSheets';
import type { User, Device } from './types';

export class DataService {
  private static async getSheet(accessToken: string, tabName: string) {
    return await getSheetWithCustomHeader(accessToken, tabName);
  }

  private static getFlexibleValue(row: any, possibleHeaders: string[]): string {
    for (const header of possibleHeaders) {
      const value = row.get(header);
      if (value) return value;
    }
    return '';
  }

  static async fetchUsers(accessToken: string): Promise<User[]> {
    const tabs = [
      'Haas',
      'Presales',
      'Central',
      'Northeast',
      'Southeast',
      'West',
      'Federal',
      'Software'
    ];

    console.log('Starting parallel fetch for all tabs...');

    const results = await Promise.allSettled(
      tabs.map(async (tabName) => {
        try {
          console.log(`Processing tab: ${tabName}`);
          const sheet = await this.getSheet(accessToken, tabName);
          const rows = await sheet.getRows();

          console.log(`Processing tab: ${tabName}, Rows found: ${rows.length}`);

          if (rows.length === 0) {
            console.warn(`Tab ${tabName} has 0 rows - empty or headers not set to Row 3`);
            return [];
          }

          const users: User[] = [];

          for (const row of rows) {
            const email = this.getFlexibleValue(row, ['Login Email', 'Email', 'email']);
            const name = this.getFlexibleValue(row, ['Owner', 'Name', 'User', 'name']);
            const group = this.getFlexibleValue(row, ['Group', 'Territory', 'Department', 'group']) || tabName;
            const cadUnit = this.getFlexibleValue(row, ['CAD UNIT', 'ID', 'id']);

            if (!email && !name) continue;

            users.push({
              id: cadUnit || crypto.randomUUID(),
              name: name,
              email: email,
              department: group,
              status: 'active',
              hireDate: '',
              sourceTab: tabName,
            });
          }

          console.log(`Successfully processed ${users.length} users from ${tabName} tab`);
          return users;
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes('not found')) {
              console.error(`Tab ${tabName} not found in spreadsheet`);
            } else if (error.message.includes('header')) {
              console.error(`Tab ${tabName} missing headers - ensure Row 3 has headers`);
            } else {
              console.error(`Tab ${tabName} error:`, error.message);
            }
          }
          return [];
        }
      })
    );

    const allUserArrays = results.map((result) =>
      result.status === 'fulfilled' ? result.value : []
    );

    const flatUsers = allUserArrays.flat();

    const userMap = new Map<string, User>();
    const deduplicatedUsers: User[] = [];

    for (const user of flatUsers) {
      const userKey = user.email || user.name;

      if (userMap.has(userKey)) {
        const existingUser = userMap.get(userKey)!;
        existingUser.sourceTab = `${existingUser.sourceTab}, ${user.sourceTab}`;
        if (!existingUser.id && user.id) existingUser.id = user.id;
        if (!existingUser.name && user.name) existingUser.name = user.name;
        if (!existingUser.email && user.email) existingUser.email = user.email;
        if (!existingUser.department && user.department) existingUser.department = user.department;
      } else {
        userMap.set(userKey, user);
        deduplicatedUsers.push(user);
      }
    }

    console.log(`Total users loaded: ${deduplicatedUsers.length} (from ${flatUsers.length} raw entries)`);
    return deduplicatedUsers;
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
