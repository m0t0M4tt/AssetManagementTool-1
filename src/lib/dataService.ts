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

  private static getValueByIndex(row: any, index: number): string {
    try {
      const values = row._rawData || [];
      return values[index] || '';
    } catch {
      return '';
    }
  }

  private static extractedDevices: Device[] = [];

  static async fetchUsers(accessToken: string): Promise<User[]> {
    const tabs = ['Central', 'Northeast', 'Southeast', 'West', 'Federal', 'Software'];

    console.log('Starting parallel fetch for regional tabs...');

    this.extractedDevices = [];

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
            const name = this.getFlexibleValue(row, ['Owner']) || this.getValueByIndex(row, 1);
            const apxEmail = this.getValueByIndex(row, 2);
            const n70Email = this.getValueByIndex(row, 7);

            if (!name && !apxEmail && !n70Email) continue;

            const primaryEmail = apxEmail || n70Email;
            const userId = crypto.randomUUID();

            users.push({
              id: userId,
              name: name,
              email: primaryEmail,
              department: tabName,
              status: 'active',
              hireDate: '',
              sourceTab: tabName,
            });

            const apxSerial = this.getValueByIndex(row, 22);
            const apxAsset = this.getValueByIndex(row, 23);
            const n70Serial = this.getValueByIndex(row, 24);
            const n70Asset = this.getValueByIndex(row, 25);
            const radioId1 = this.getValueByIndex(row, 29);
            const radioId2 = this.getValueByIndex(row, 30);
            const radioId3 = this.getValueByIndex(row, 31);
            const radioId4 = this.getValueByIndex(row, 32);

            if (apxSerial || apxAsset) {
              this.extractedDevices.push({
                id: crypto.randomUUID(),
                serialNumber: apxSerial,
                assetTag: apxAsset,
                model: 'APX Next',
                assignedTo: apxEmail,
                status: apxEmail ? 'assigned' : 'available',
                location: tabName,
                notes: '',
                radioId: [radioId1, radioId2].filter(Boolean).join(', '),
                sourceTab: tabName,
              });
            }

            if (n70Serial || n70Asset) {
              this.extractedDevices.push({
                id: crypto.randomUUID(),
                serialNumber: n70Serial,
                assetTag: n70Asset,
                model: 'N70',
                assignedTo: n70Email,
                status: n70Email ? 'assigned' : 'available',
                location: tabName,
                notes: '',
                radioId: [radioId3, radioId4].filter(Boolean).join(', '),
                sourceTab: tabName,
              });
            }
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
    console.log(`Total devices extracted: ${this.extractedDevices.length}`);
    return deduplicatedUsers;
  }

  static async fetchDevices(accessToken: string): Promise<Device[]> {
    console.log(`Returning ${this.extractedDevices.length} devices extracted from regional tabs`);
    return [...this.extractedDevices];
  }

  static async addUser(accessToken: string, user: Omit<User, 'id'>): Promise<User> {
    try {
      const targetTab = user.sourceTab || 'Central';
      const sheet = await this.getSheet(accessToken, targetTab);

      const newUser: User = {
        id: crypto.randomUUID(),
        ...user,
        sourceTab: targetTab,
      };

      await sheet.addRow({
        'Owner': newUser.name,
        'APX Email': newUser.email,
      });

      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  static async updateUser(accessToken: string, id: string, updates: Partial<User>): Promise<void> {
    const targetTabs = ['Central', 'Northeast', 'Southeast', 'West', 'Federal', 'Software'];

    for (const tabName of targetTabs) {
      try {
        const sheet = await this.getSheet(accessToken, tabName);
        const rows = await sheet.getRows();
        const row = rows.find(r => {
          const apxEmail = this.getValueByIndex(r, 2);
          const n70Email = this.getValueByIndex(r, 7);
          return apxEmail === updates.email || n70Email === updates.email;
        });

        if (row) {
          if (updates.name) row.set('Owner', updates.name);
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
    const targetTabs = ['Central', 'Northeast', 'Southeast', 'West', 'Federal', 'Software'];

    for (const tabName of targetTabs) {
      try {
        const sheet = await this.getSheet(accessToken, tabName);
        const rows = await sheet.getRows();

        for (const row of rows) {
          const apxEmail = this.getValueByIndex(row, 2);
          const n70Email = this.getValueByIndex(row, 7);

          if (row._rawData && (apxEmail || n70Email)) {
            await row.delete();
            console.log(`User ${id} deleted from ${tabName} tab`);
            return;
          }
        }
      } catch (error) {
        console.warn(`Error checking ${tabName} tab:`, error);
      }
    }

    throw new Error(`User with id ${id} not found in any tab`);
  }

  static async addDevice(accessToken: string, device: Omit<Device, 'id'>): Promise<Device> {
    const newDevice: Device = {
      id: crypto.randomUUID(),
      ...device,
    };

    this.extractedDevices.push(newDevice);
    console.log('Device added to extracted devices cache');
    return newDevice;
  }

  static async updateDevice(accessToken: string, id: string, updates: Partial<Device>): Promise<void> {
    const deviceIndex = this.extractedDevices.findIndex(d => d.id === id);

    if (deviceIndex !== -1) {
      this.extractedDevices[deviceIndex] = {
        ...this.extractedDevices[deviceIndex],
        ...updates,
      };
      console.log('Device updated in extracted devices cache');
      return;
    }

    throw new Error(`Device with id ${id} not found`);
  }

  static async deleteDevice(accessToken: string, id: string): Promise<void> {
    const deviceIndex = this.extractedDevices.findIndex(d => d.id === id);

    if (deviceIndex !== -1) {
      this.extractedDevices.splice(deviceIndex, 1);
      console.log('Device deleted from extracted devices cache');
      return;
    }

    throw new Error(`Device with id ${id} not found`);
  }
}
