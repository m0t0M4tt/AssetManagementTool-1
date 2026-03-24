import { getGoogleSheetDoc } from './googleSheets';
import type { User } from './types';

export class ProvisioningService {
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static getColumnIndexForStep(
    section: 'apxNext' | 'apxN70' | 'phoneApps' | 'svxV700',
    stepKey: string
  ): number {
    // APX Next: AM-AU (38-46)
    const apxNextMap: Record<string, number> = {
      createNextUser: 38,
      provisionP1UserRoles: 39,
      provisionP1ConcurrentLogins: 40,
      p1ProvisionUnitId: 41,
      p1UnitPreassignment: 42,
      placeUnitOnDutyPsap: 43,
      awareAddDevice: 44,
      p1AddDevice: 45,
      awareDataSharing: 46,
    };

    // APX N70: AV-BD (47-55)
    const apxN70Map: Record<string, number> = {
      createNextUser: 47,
      provisionP1UserRoles: 48,
      provisionP1ConcurrentLogins: 49,
      p1ProvisionUnitId: 50,
      p1UnitPreassignment: 51,
      placeUnitOnDutyPsap: 52,
      awareAddDevice: 53,
      p1AddDevice: 54,
      awareDataSharing: 55,
    };

    // Phone Apps: BE-BH (56-59)
    const phoneAppsMap: Record<string, number> = {
      responderCoreIdPhone: 56,
      responderCoreIdPd: 57,
      rapidDeployMapping: 58,
      rapidDeployLightning: 59,
    };

    // Body Worn Camera: BI-BN (60-65)
    const svxV700Map: Record<string, number> = {
      svxInDeviceManagement: 60,
      svxCheckedOutToUser: 61,
      svxAssignedInAware: 62,
      v700InDeviceManagement: 63,
      v700CheckOutToUser: 64,
      v700AssignedInAware: 65,
    };

    switch (section) {
      case 'apxNext':
        return apxNextMap[stepKey];
      case 'apxN70':
        return apxN70Map[stepKey];
      case 'phoneApps':
        return phoneAppsMap[stepKey];
      case 'svxV700':
        return svxV700Map[stepKey];
      default:
        throw new Error(`Unknown section: ${section}`);
    }
  }

  static async updateProvisioningStep(
    accessToken: string,
    user: User,
    section: 'apxNext' | 'apxN70' | 'phoneApps' | 'svxV700',
    stepKey: string,
    value: boolean
  ): Promise<boolean> {
    try {
      const doc = await getGoogleSheetDoc(accessToken);
      const sourceTab = user.sourceTab?.split(',')[0].trim() || 'Software';
      const sheet = doc.sheetsByTitle[sourceTab];

      if (!sheet) {
        console.error(`Sheet "${sourceTab}" not found`);
        return false;
      }

      // Load cells including provisioning columns (A-BN, columns 0-65)
      await sheet.loadCells('A1:BN500');
      const rows = await sheet.getRows();

      // Find the user's row by matching email (column C) or name (column B)
      let userRowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowEmail = row.get('Login Email - CAD/Responder User');
        const rowName = row.get('Owner');

        if (
          (user.email && rowEmail === user.email) ||
          (user.name && rowName === user.name)
        ) {
          userRowIndex = row.rowNumber - 1;
          break;
        }
      }

      if (userRowIndex === -1) {
        console.error(`User not found in sheet: ${user.email || user.name}`);
        return false;
      }

      const columnIndex = this.getColumnIndexForStep(section, stepKey);
      const cell = sheet.getCell(userRowIndex, columnIndex);
      cell.value = value ? true : false;

      await sheet.saveUpdatedCells();
      console.log(`Updated ${section}.${stepKey} to ${value} for user ${user.email || user.name}`);

      // Add delay to avoid hitting rate limits
      await this.delay(100);

      return true;
    } catch (error) {
      console.error('Error updating provisioning step:', error);
      return false;
    }
  }

  static async batchUpdateProvisioningSteps(
    accessToken: string,
    user: User,
    updates: Array<{
      section: 'apxNext' | 'apxN70' | 'phoneApps' | 'svxV700';
      stepKey: string;
      value: boolean;
    }>
  ): Promise<boolean> {
    try {
      const doc = await getGoogleSheetDoc(accessToken);
      const sourceTab = user.sourceTab?.split(',')[0].trim() || 'Software';
      const sheet = doc.sheetsByTitle[sourceTab];

      if (!sheet) {
        console.error(`Sheet "${sourceTab}" not found`);
        return false;
      }

      // Load cells including provisioning columns (A-BN, columns 0-65)
      await sheet.loadCells('A1:BN500');
      const rows = await sheet.getRows();

      // Find the user's row by matching email (column C) or name (column B)
      let userRowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowEmail = row.get('Login Email - CAD/Responder User');
        const rowName = row.get('Owner');

        if (
          (user.email && rowEmail === user.email) ||
          (user.name && rowName === user.name)
        ) {
          userRowIndex = row.rowNumber - 1;
          break;
        }
      }

      if (userRowIndex === -1) {
        console.error(`User not found in sheet: ${user.email || user.name}`);
        return false;
      }

      // Update all cells in memory
      for (const update of updates) {
        const columnIndex = this.getColumnIndexForStep(update.section, update.stepKey);
        const cell = sheet.getCell(userRowIndex, columnIndex);
        cell.value = update.value ? true : false;
      }

      // Save all updates in a single batch request
      await sheet.saveUpdatedCells();
      console.log(`Batch updated ${updates.length} provisioning steps for user ${user.email || user.name}`);

      return true;
    } catch (error) {
      console.error('Error batch updating provisioning steps:', error);
      return false;
    }
  }
}
