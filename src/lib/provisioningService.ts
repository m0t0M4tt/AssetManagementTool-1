import { createClient } from '@supabase/supabase-js';
import type { ProvisioningSteps } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ProvisioningRecord {
  id: string;
  user_email: string;
  user_name: string;
  apx_next: Record<string, boolean>;
  apx_n70: Record<string, boolean>;
  phone_apps: Record<string, boolean>;
  svx_v700: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export class ProvisioningService {
  static async getProvisioningData(userEmail: string): Promise<ProvisioningSteps | null> {
    const { data, error } = await supabase
      .from('user_provisioning')
      .select('*')
      .eq('user_email', userEmail)
      .maybeSingle();

    if (error) {
      console.error('Error fetching provisioning data:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      apxNext: data.apx_next,
      apxN70: data.apx_n70,
      phoneApps: data.phone_apps,
      svxV700: data.svx_v700,
    };
  }

  static async getAllProvisioningData(): Promise<Map<string, ProvisioningSteps>> {
    const { data, error } = await supabase
      .from('user_provisioning')
      .select('*');

    if (error) {
      console.error('Error fetching all provisioning data:', error);
      return new Map();
    }

    const provisioningMap = new Map<string, ProvisioningSteps>();
    for (const record of data) {
      provisioningMap.set(record.user_email, {
        apxNext: record.apx_next,
        apxN70: record.apx_n70,
        phoneApps: record.phone_apps,
        svxV700: record.svx_v700,
      });
    }

    return provisioningMap;
  }

  static async updateProvisioningData(
    userEmail: string,
    userName: string,
    steps: ProvisioningSteps
  ): Promise<boolean> {
    const { error } = await supabase
      .from('user_provisioning')
      .upsert({
        user_email: userEmail,
        user_name: userName,
        apx_next: steps.apxNext,
        apx_n70: steps.apxN70,
        phone_apps: steps.phoneApps,
        svx_v700: steps.svxV700,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_email'
      });

    if (error) {
      console.error('Error updating provisioning data:', error);
      return false;
    }

    return true;
  }

  static async updateProvisioningStep(
    userEmail: string,
    userName: string,
    section: 'apxNext' | 'apxN70' | 'phoneApps' | 'svxV700',
    stepKey: string,
    value: boolean
  ): Promise<boolean> {
    const currentData = await this.getProvisioningData(userEmail);

    const steps: ProvisioningSteps = currentData || {
      apxNext: {
        createNextUser: false,
        provisionP1UserRoles: false,
        provisionP1ConcurrentLogins: false,
        p1ProvisionUnitId: false,
        p1UnitPreassignment: false,
        placeUnitOnDutyPsap: false,
        awareAddDevice: false,
        p1AddDevice: false,
        awareDataSharing: false,
      },
      apxN70: {
        createNextUser: false,
        provisionP1UserRoles: false,
        provisionP1ConcurrentLogins: false,
        p1ProvisionUnitId: false,
        p1UnitPreassignment: false,
        placeUnitOnDutyPsap: false,
        awareAddDevice: false,
        p1AddDevice: false,
        awareDataSharing: false,
      },
      phoneApps: {
        responderCoreIdPhone: false,
        responderCoreIdPd: false,
        rapidDeployMapping: false,
        rapidDeployLightning: false,
      },
      svxV700: {
        setupInDeviceManagement: false,
        checkedOutToUser: false,
      }
    };

    steps[section][stepKey as keyof typeof steps[typeof section]] = value;

    return await this.updateProvisioningData(userEmail, userName, steps);
  }
}
