import { getSheetWithCustomHeader, getSheetDataConsolidated } from './googleSheets';
import type { User, Device, ProvisioningSteps } from './types';

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class DataService {
  private static async getSheet(accessToken: string, tabName: string) {
    return await getSheetWithCustomHeader(accessToken, tabName);
  }

  private static async getSheetData(accessToken: string, tabName: string) {
    return await getSheetDataConsolidated(accessToken, tabName);
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

  private static splitRadioIds(radioIds: string[]): { ecoId: string; chicagoId: string } {
    const ecoIds: string[] = [];
    const chicagoIds: string[] = [];

    for (const radioId of radioIds) {
      if (!radioId) continue;

      if (radioId.startsWith('15')) {
        ecoIds.push(radioId);
      } else if (radioId.startsWith('437')) {
        chicagoIds.push(radioId);
      }
    }

    return {
      ecoId: ecoIds.join(', '),
      chicagoId: chicagoIds.join(', '),
    };
  }

  private static extractedDevices: Device[] = [];

  static async fetchUsers(accessToken: string): Promise<User[]> {
    const tabs = ['Presales', 'Central', 'Northeast', 'Southeast', 'West', 'Federal', 'Software'];

    console.log('Starting CONSOLIDATED fetch for tabs:', tabs);

    this.extractedDevices = [];
    const allUsers: User[] = [];

    for (let i = 0; i < tabs.length; i++) {
      const tabName = tabs[i];

      // Add 300ms delay between tabs to avoid rate limiting (429 errors)
      if (i > 0) {
        await delay(300);
      }

      try {
        console.log(`[${i + 1}/${tabs.length}] Processing tab: ${tabName}`);

        // Use consolidated fetching - SINGLE API CALL per tab
        const { headers, rows } = await this.getSheetData(accessToken, tabName);

        console.log(`Tab ${tabName}: Found ${rows.length} data rows (consolidated fetch)`);

        if (rows.length === 0) {
          console.warn(`Tab ${tabName} has 0 rows - empty or headers not set to Row 3`);
          continue;
        }

        const deviceMap = new Map<string, Device>();

        for (const rowData of rows) {
          const owner = rowData[1]?.toString() || '';
          const loginC = rowData[2]?.toString() || '';
          const loginH = rowData[7]?.toString() || '';
          const responderDeviceId = rowData[10]?.toString() || ''; // Column K
          const unit = rowData[11]?.toString() || '';
          const alias = rowData[12]?.toString() || '';

          // Correct column mappings based on user specification:
          // Column N (index 13) = CAD UNIT (APX Next Unit ID)
          // Column O (index 14) = CAD Unit N70 (N70 Unit ID)
          const apxNextUnitId = rowData[13]?.toString() || '';
          const apxN70UnitId = rowData[14]?.toString() || '';

          // CommandCentral Responder Aliases:
          // Column AH (index 33) = APX Next Alias
          // Column AI (index 34) = APX N70 Alias
          const apxNextAlias = rowData[33]?.toString() || '';
          const apxN70Alias = rowData[34]?.toString() || '';

          const colW = rowData[22]?.toString() || '';
          const colX = rowData[23]?.toString() || '';
          const colY = rowData[24]?.toString() || '';
          const colZ = rowData[25]?.toString() || '';

          const radioIdAD = rowData[29]?.toString() || '';
          const radioIdAE = rowData[30]?.toString() || '';
          const radioIdAF = rowData[31]?.toString() || '';
          const radioIdAG = rowData[32]?.toString() || '';

          // Provisioning columns: AM to BJ (columns 38-61)
          // Column AM = index 38, AN = 39, etc.
          // APX Next steps: AM-AU (38-46)
          const apxNextSteps = {
            createNextUser: rowData[38]?.toString()?.toUpperCase() === 'TRUE',
            provisionP1UserRoles: rowData[39]?.toString()?.toUpperCase() === 'TRUE',
            provisionP1ConcurrentLogins: rowData[40]?.toString()?.toUpperCase() === 'TRUE',
            p1ProvisionUnitId: rowData[41]?.toString()?.toUpperCase() === 'TRUE',
            p1UnitPreassignment: rowData[42]?.toString()?.toUpperCase() === 'TRUE',
            placeUnitOnDutyPsap: rowData[43]?.toString()?.toUpperCase() === 'TRUE',
            awareAddDevice: rowData[44]?.toString()?.toUpperCase() === 'TRUE',
            p1AddDevice: rowData[45]?.toString()?.toUpperCase() === 'TRUE',
            awareDataSharing: rowData[46]?.toString()?.toUpperCase() === 'TRUE',
          };

          // APX N70 steps: AV-BD (47-55)
          const apxN70Steps = {
            createNextUser: rowData[47]?.toString()?.toUpperCase() === 'TRUE',
            provisionP1UserRoles: rowData[48]?.toString()?.toUpperCase() === 'TRUE',
            provisionP1ConcurrentLogins: rowData[49]?.toString()?.toUpperCase() === 'TRUE',
            p1ProvisionUnitId: rowData[50]?.toString()?.toUpperCase() === 'TRUE',
            p1UnitPreassignment: rowData[51]?.toString()?.toUpperCase() === 'TRUE',
            placeUnitOnDutyPsap: rowData[52]?.toString()?.toUpperCase() === 'TRUE',
            awareAddDevice: rowData[53]?.toString()?.toUpperCase() === 'TRUE',
            p1AddDevice: rowData[54]?.toString()?.toUpperCase() === 'TRUE',
            awareDataSharing: rowData[55]?.toString()?.toUpperCase() === 'TRUE',
          };

          // Phone Apps steps: BE-BH (56-59)
          const phoneAppsSteps = {
            responderCoreIdPhone: rowData[56]?.toString()?.toUpperCase() === 'TRUE',
            responderCoreIdPd: rowData[57]?.toString()?.toUpperCase() === 'TRUE',
            rapidDeployMapping: rowData[58]?.toString()?.toUpperCase() === 'TRUE',
            rapidDeployLightning: rowData[59]?.toString()?.toUpperCase() === 'TRUE',
          };

          // Body Worn Camera steps: BI-BN (60-65)
          const svxV700Steps = {
            svxInDeviceManagement: rowData[60]?.toString()?.toUpperCase() === 'TRUE',
            svxCheckedOutToUser: rowData[61]?.toString()?.toUpperCase() === 'TRUE',
            svxAssignedInAware: rowData[62]?.toString()?.toUpperCase() === 'TRUE',
            v700InDeviceManagement: rowData[63]?.toString()?.toUpperCase() === 'TRUE',
            v700CheckOutToUser: rowData[64]?.toString()?.toUpperCase() === 'TRUE',
            v700AssignedInAware: rowData[65]?.toString()?.toUpperCase() === 'TRUE',
          };

          // Debug logging for SVX/V700 data
          if (rowData[60] || rowData[61] || rowData[62] || rowData[63] || rowData[64] || rowData[65]) {
            console.log(`SVX/V700 data for ${owner}:`, {
              raw: [rowData[60], rowData[61], rowData[62], rowData[63], rowData[64], rowData[65]],
              parsed: svxV700Steps
            });
          }

          if (!colW?.trim() && !colX?.trim() && !colY?.trim() && !colZ?.trim()) {
            continue;
          }

          if (colW && colW.trim() && colW.trim().length >= 4 && !deviceMap.has(colW)) {
            const radioIdsArray = [radioIdAD, radioIdAE].filter(Boolean);
            const combinedRadioId = radioIdsArray.join(', ');
            const { ecoId, chicagoId } = this.splitRadioIds(radioIdsArray);
            const uniqueId = `${colW}-APXNext`;

            const device: Device = {
              id: uniqueId,
              serialNumber: colW,
              assetTag: '',
              model: 'APX Next',
              category: 'LTE Radio',
              assignedTo: loginC,
              status: loginC ? 'assigned' : 'available',
              location: tabName,
              notes: '',
              radioId: combinedRadioId,
              ecoId: ecoId,
              chicagoId: chicagoId,
              owner: owner,
              unit: unit,
              alias: alias,
              sourceTab: tabName,
            };
            deviceMap.set(colW, device);
            this.extractedDevices.push(device);
          }

          if (colX && colX.trim() && colX.trim().length >= 4 && !deviceMap.has(colX)) {
            const radioIdsArray = [radioIdAF, radioIdAG].filter(Boolean);
            const combinedRadioId = radioIdsArray.join(', ');
            const { ecoId, chicagoId } = this.splitRadioIds(radioIdsArray);
            const uniqueId = `${colX}-APXN70`;

            const device: Device = {
              id: uniqueId,
              serialNumber: colX,
              assetTag: '',
              model: 'APX N70',
              category: 'LTE Radio',
              assignedTo: loginH,
              status: loginH ? 'assigned' : 'available',
              location: tabName,
              notes: '',
              radioId: combinedRadioId,
              ecoId: ecoId,
              chicagoId: chicagoId,
              owner: owner,
              unit: unit,
              alias: alias,
              sourceTab: tabName,
            };
            deviceMap.set(colX, device);
            this.extractedDevices.push(device);
          }

          if (colY && colY.trim() && colY.trim().length >= 4 && !deviceMap.has(colY)) {
            const uniqueId = `${colY}-V700`;

            const device: Device = {
              id: uniqueId,
              serialNumber: colY,
              assetTag: '',
              model: 'V700',
              category: 'Body Worn Camera',
              assignedTo: owner,
              status: owner ? 'assigned' : 'available',
              location: tabName,
              notes: '',
              radioId: '',
              ecoId: '',
              chicagoId: '',
              owner: owner,
              unit: unit,
              alias: alias,
              sourceTab: tabName,
            };
            deviceMap.set(colY, device);
            this.extractedDevices.push(device);
          }

          if (colZ && colZ.trim() && colZ.trim().length >= 4 && !deviceMap.has(colZ)) {
            const uniqueId = `${colZ}-SVX`;

            const device: Device = {
              id: uniqueId,
              serialNumber: colZ,
              assetTag: '',
              model: 'SVX',
              category: 'Video RSM',
              assignedTo: owner,
              status: owner ? 'assigned' : 'available',
              location: tabName,
              notes: '',
              radioId: '',
              ecoId: '',
              chicagoId: '',
              owner: owner,
              unit: unit,
              alias: alias,
              sourceTab: tabName,
            };
            deviceMap.set(colZ, device);
            this.extractedDevices.push(device);
          }

          const primaryEmail = loginC || loginH;
          if (owner || primaryEmail) {
            // Calculate provisioning status
            const allSteps = [
              ...Object.values(apxNextSteps),
              ...Object.values(apxN70Steps),
              ...Object.values(phoneAppsSteps),
              ...Object.values(svxV700Steps),
            ];
            const completedSteps = allSteps.filter(Boolean).length;
            const provisioningStatus = completedSteps === 0
              ? 'Not Started'
              : completedSteps === allSteps.length
              ? 'Completed'
              : 'In Progress';

            // Debug logging for first user in each tab to verify data extraction
            if (allUsers.length === 0 && owner) {
              console.log(`[${tabName}] Sample data for ${owner}:`, {
                owner,
                loginC,
                loginH,
                unit,
                alias,
                apxNextUnitId: `col[13]="${apxNextUnitId}"`,
                apxN70UnitId: `col[14]="${apxN70UnitId}"`,
                apxNextSteps,
                apxN70Steps,
                phoneAppsSteps,
                svxV700Steps,
                completedSteps,
                totalSteps: allSteps.length,
                rawProvisioningValues: {
                  col38: rowData[38]?.toString(),
                  col39: rowData[39]?.toString(),
                  col40: rowData[40]?.toString(),
                }
              });
            }

            allUsers.push({
              id: crypto.randomUUID(),
              name: owner,
              email: primaryEmail,
              department: tabName,
              status: 'active',
              hireDate: '',
              sourceTab: tabName,
              unit: unit,
              alias: alias,
              provisioningStatus: provisioningStatus,
              provisioningSteps: {
                apxNext: apxNextSteps,
                apxN70: apxN70Steps,
                phoneApps: phoneAppsSteps,
                svxV700: svxV700Steps,
              },
              apxNextLogin: loginC,
              apxN70Login: loginH,
              apxNextUnitId: apxNextUnitId,
              apxN70UnitId: apxN70UnitId,
              apxNextAlias: apxNextAlias,
              apxN70Alias: apxN70Alias,
              responderDeviceId: responderDeviceId,
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
        if (!existingUser.unit && user.unit) existingUser.unit = user.unit;
        if (!existingUser.alias && user.alias) existingUser.alias = user.alias;
        if (!existingUser.apxNextLogin && user.apxNextLogin) existingUser.apxNextLogin = user.apxNextLogin;
        if (!existingUser.apxN70Login && user.apxN70Login) existingUser.apxN70Login = user.apxN70Login;
        if (!existingUser.apxNextUnitId && user.apxNextUnitId) existingUser.apxNextUnitId = user.apxNextUnitId;
        if (!existingUser.apxN70UnitId && user.apxN70UnitId) existingUser.apxN70UnitId = user.apxN70UnitId;
        if (!existingUser.responderDeviceId && user.responderDeviceId) existingUser.responderDeviceId = user.responderDeviceId;

        // Merge provisioning steps - take the one with more completed steps
        if (user.provisioningSteps) {
          if (!existingUser.provisioningSteps) {
            existingUser.provisioningSteps = user.provisioningSteps;
            existingUser.provisioningStatus = user.provisioningStatus;
          } else {
            // Merge by taking any TRUE values
            const mergeSteps = (existing: any, incoming: any) => {
              const merged = { ...existing };
              for (const [key, value] of Object.entries(incoming)) {
                if (value === true) merged[key] = true;
              }
              return merged;
            };

            existingUser.provisioningSteps = {
              apxNext: mergeSteps(existingUser.provisioningSteps.apxNext, user.provisioningSteps.apxNext),
              apxN70: mergeSteps(existingUser.provisioningSteps.apxN70, user.provisioningSteps.apxN70),
              phoneApps: mergeSteps(existingUser.provisioningSteps.phoneApps || {}, user.provisioningSteps.phoneApps || {}),
              svxV700: mergeSteps(existingUser.provisioningSteps.svxV700 || {}, user.provisioningSteps.svxV700 || {}),
            };

            // Recalculate status
            const allSteps = [
              ...Object.values(existingUser.provisioningSteps.apxNext),
              ...Object.values(existingUser.provisioningSteps.apxN70),
              ...Object.values(existingUser.provisioningSteps.phoneApps || {}),
              ...Object.values(existingUser.provisioningSteps.svxV700 || {}),
            ];
            const completedSteps = allSteps.filter(Boolean).length;
            existingUser.provisioningStatus = completedSteps === 0
              ? 'Not Started'
              : completedSteps === allSteps.length
              ? 'Completed'
              : 'In Progress';
          }
        }
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
    const tabs = ['Presales', 'Central', 'Northeast', 'Southeast', 'West', 'Federal', 'Software'];
    const allDevices: Device[] = [];

    console.log('Starting CONSOLIDATED device fetch for tabs:', tabs);

    for (let i = 0; i < tabs.length; i++) {
      const tabName = tabs[i];

      // Add 300ms delay between tabs to avoid rate limiting (429 errors)
      if (i > 0) {
        await delay(300);
      }

      try {
        console.log(`[${i + 1}/${tabs.length}] Fetching devices from tab: ${tabName}`);

        // Use consolidated fetching - SINGLE API CALL per tab
        const { headers, rows } = await this.getSheetData(accessToken, tabName);

        console.log(`Tab ${tabName}: Found ${rows.length} rows for device extraction (consolidated fetch)`);

        if (rows.length === 0) {
          console.warn(`Tab ${tabName} has 0 rows - empty or headers not set to Row 3`);
          continue;
        }

        const deviceMap = new Map<string, Device>();

        for (const rowData of rows) {
          const owner = rowData[1]?.toString() || '';
          const loginC = rowData[2]?.toString() || '';
          const loginH = rowData[7]?.toString() || '';
          const unit = rowData[11]?.toString() || '';
          const alias = rowData[12]?.toString() || '';

          const colW = rowData[22]?.toString() || '';
          const colX = rowData[23]?.toString() || '';
          const colY = rowData[24]?.toString() || '';
          const colZ = rowData[25]?.toString() || '';

          const radioIdAD = rowData[29]?.toString() || '';
          const radioIdAE = rowData[30]?.toString() || '';
          const radioIdAF = rowData[31]?.toString() || '';
          const radioIdAG = rowData[32]?.toString() || '';

          if (!colW?.trim() && !colX?.trim() && !colY?.trim() && !colZ?.trim()) {
            continue;
          }

          if (colW && colW.trim() && colW.trim().length >= 4 && !deviceMap.has(colW)) {
            const radioIdsArray = [radioIdAD, radioIdAE].filter(Boolean);
            const combinedRadioId = radioIdsArray.join(', ');
            const { ecoId, chicagoId } = this.splitRadioIds(radioIdsArray);
            const uniqueId = `${colW}-APXNext`;

            const device: Device = {
              id: uniqueId,
              serialNumber: colW,
              assetTag: '',
              model: 'APX Next',
              category: 'LTE Radio',
              assignedTo: loginC,
              status: loginC ? 'assigned' : 'available',
              location: tabName,
              notes: '',
              radioId: combinedRadioId,
              ecoId: ecoId,
              chicagoId: chicagoId,
              owner: owner,
              unit: unit,
              alias: alias,
              sourceTab: tabName,
            };
            deviceMap.set(colW, device);
            allDevices.push(device);
          }

          if (colX && colX.trim() && colX.trim().length >= 4 && !deviceMap.has(colX)) {
            const radioIdsArray = [radioIdAF, radioIdAG].filter(Boolean);
            const combinedRadioId = radioIdsArray.join(', ');
            const { ecoId, chicagoId } = this.splitRadioIds(radioIdsArray);
            const uniqueId = `${colX}-APXN70`;

            const device: Device = {
              id: uniqueId,
              serialNumber: colX,
              assetTag: '',
              model: 'APX N70',
              category: 'LTE Radio',
              assignedTo: loginH,
              status: loginH ? 'assigned' : 'available',
              location: tabName,
              notes: '',
              radioId: combinedRadioId,
              ecoId: ecoId,
              chicagoId: chicagoId,
              owner: owner,
              unit: unit,
              alias: alias,
              sourceTab: tabName,
            };
            deviceMap.set(colX, device);
            allDevices.push(device);
          }

          if (colY && colY.trim() && colY.trim().length >= 4 && !deviceMap.has(colY)) {
            const uniqueId = `${colY}-V700`;

            const device: Device = {
              id: uniqueId,
              serialNumber: colY,
              assetTag: '',
              model: 'V700',
              category: 'Body Worn Camera',
              assignedTo: owner,
              status: owner ? 'assigned' : 'available',
              location: tabName,
              notes: '',
              radioId: '',
              ecoId: '',
              chicagoId: '',
              owner: owner,
              unit: unit,
              alias: alias,
              sourceTab: tabName,
            };
            deviceMap.set(colY, device);
            allDevices.push(device);
          }

          if (colZ && colZ.trim() && colZ.trim().length >= 4 && !deviceMap.has(colZ)) {
            const uniqueId = `${colZ}-SVX`;

            const device: Device = {
              id: uniqueId,
              serialNumber: colZ,
              assetTag: '',
              model: 'SVX',
              category: 'Video RSM',
              assignedTo: owner,
              status: owner ? 'assigned' : 'available',
              location: tabName,
              notes: '',
              radioId: '',
              ecoId: '',
              chicagoId: '',
              owner: owner,
              unit: unit,
              alias: alias,
              sourceTab: tabName,
            };
            deviceMap.set(colZ, device);
            allDevices.push(device);
          }
        }

        console.log(`Tab ${tabName}: Successfully extracted devices`);
      } catch (error) {
        console.error(`Error fetching devices from tab ${tabName}:`, error);
      }
    }

    // Deduplicate devices by serial number
    const deviceMap = new Map<string, Device>();
    for (const device of allDevices) {
      if (!deviceMap.has(device.serialNumber)) {
        deviceMap.set(device.serialNumber, device);
      }
    }

    const deduplicatedDevices = Array.from(deviceMap.values());
    console.log(`TOTAL DEVICES: ${deduplicatedDevices.length} (from ${allDevices.length} raw entries)`);

    // Update the static cache for backward compatibility
    this.extractedDevices = deduplicatedDevices;

    return deduplicatedDevices;
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
