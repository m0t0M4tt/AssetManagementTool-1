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
    const tabs = ['Presales', 'Central', 'Northeast', 'Southeast', 'West', 'Federal', 'Software'];

    console.log('Starting fetch for tabs:', tabs);

    this.extractedDevices = [];
    const allUsers: User[] = [];

    for (const tabName of tabs) {
      try {
        console.log(`Processing tab: ${tabName}`);
        const sheet = await this.getSheet(accessToken, tabName);
        const rows = await sheet.getRows();

        console.log(`Tab ${tabName}: Found ${rows.length} rows`);

        if (rows.length === 0) {
          console.warn(`Tab ${tabName} has 0 rows - empty or headers not set to Row 3`);
          continue;
        }

        for (const row of rows) {
          const owner = this.getValueByIndex(row, 1);
          const loginC = this.getValueByIndex(row, 2);
          const loginH = this.getValueByIndex(row, 7);
          const unit = this.getValueByIndex(row, 11);
          const alias = this.getValueByIndex(row, 12);

          const colW = this.getValueByIndex(row, 22);
          const colX = this.getValueByIndex(row, 23);
          const colY = this.getValueByIndex(row, 24);
          const colZ = this.getValueByIndex(row, 25);

          const radioIdAD = this.getValueByIndex(row, 29);
          const radioIdAE = this.getValueByIndex(row, 30);
          const radioIdAF = this.getValueByIndex(row, 31);
          const radioIdAG = this.getValueByIndex(row, 32);

          if (colW) {
            const combinedRadioId = [radioIdAD, radioIdAE].filter(Boolean).join(', ');
            const uniqueId = `${colW}-APXNext`;

            this.extractedDevices.push({
              id: uniqueId,
              serialNumber: colW,
              assetTag: colW,
              model: 'APX Next',
              category: 'Portable Radio',
              assignedTo: loginC,
              status: loginC ? 'assigned' : 'available',
              location: tabName,
              notes: '',
              radioId: combinedRadioId,
              owner: owner,
              unit: unit,
              alias: alias,
              sourceTab: tabName,
            });
          }

          if (colX) {
            const combinedRadioId = [radioIdAF, radioIdAG].filter(Boolean).join(', ');
            const uniqueId = `${colX}-APXN70`;

            this.extractedDevices.push({
              id: uniqueId,
              serialNumber: colX,
              assetTag: colX,
              model: 'APX N70',
              category: 'LTE Radio',
              assignedTo: loginH,
              status: loginH ? 'assigned' : 'available',
              location: tabName,
              notes: '',
              radioId: combinedRadioId,
              owner: owner,
              unit: unit,
              alias: alias,
              sourceTab: tabName,
            });
          }

          if (colY) {
            const uniqueId = `${colY}-V700`;

            this.extractedDevices.push({
              id: uniqueId,
              serialNumber: colY,
              assetTag: colY,
              model: 'V700',
              category: 'Body Worn Camera',
              assignedTo: owner,
              status: owner ? 'assigned' : 'available',
              location: tabName,
              notes: '',
              radioId: '',
              owner: owner,
              unit: unit,
              alias: alias,
              sourceTab: tabName,
            });
          }

          if (colZ) {
            const uniqueId = `${colZ}-SVX`;

            this.extractedDevices.push({
              id: uniqueId,
              serialNumber: colZ,
              assetTag: colZ,
              model: 'SVX',
              category: 'Body Worn Camera',
              assignedTo: owner,
              status: owner ? 'assigned' : 'available',
              location: tabName,
              notes: '',
              radioId: '',
              owner: owner,
              unit: unit,
              alias: alias,
              sourceTab: tabName,
            });
          }

          const primaryEmail = loginC || loginH;
          if (owner || primaryEmail) {
            allUsers.push({
              id: crypto.randomUUID(),
              name: owner,
              email: primaryEmail,
              department: tabName,
              status: 'active',
              hireDate: '',
              sourceTab: tabName,
            });
          }
        }

        console.log(`Tab ${tabName}: Successfully processed`);
      } catch (error) {
        if (tabName === 'Presales') {
          console.error(`ERROR: Presales tab not found or inaccessible:`, error);
        } else {
          console.error(`CRITICAL ERROR in tab ${tabName}:`, error);
        }
        if (error instanceof Error) {
          console.error(`Error message: ${error.message}`);
          console.error(`Error stack: ${error.stack}`);
        }
      }
    }

    const userMap = new Map<string, User>();
    const deduplicatedUsers: User[] = [];

    for (const user of allUsers) {
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

    console.log(`TOTAL USERS: ${deduplicatedUsers.length} (from ${allUsers.length} raw entries)`);
    console.log(`TOTAL DEVICES EXTRACTED: ${this.extractedDevices.length}`);
    return deduplicatedUsers;
  }

  static async fetchDevices(accessToken: string): Promise<Device[]> {
    console.log(`Returning ${this.extractedDevices.length} devices extracted from tabs`);
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
    const targetTabs = ['Presales', 'Central', 'Northeast', 'Southeast', 'West', 'Federal', 'Software'];

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
    const targetTabs = ['Presales', 'Central', 'Northeast', 'Southeast', 'West', 'Federal', 'Software'];

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
      category: device.category || 'Portable Radio',
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
