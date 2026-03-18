import { useState, useEffect, useCallback } from 'react';
import { getGoogleSheetDoc } from '../lib/googleSheets';
import type { User, Device } from '../lib/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 30000;
const cache = new Map<string, CacheEntry<unknown>>();

function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCachedData<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    const cacheKey = 'users';
    const cached = getCachedData<User[]>(cacheKey);

    if (cached) {
      setUsers(cached);
      setLoading(false);
      return cached;
    }

    try {
      setLoading(true);
      setError(null);

      const doc = await getGoogleSheetDoc();
      const sheet = doc.sheetsByTitle['Directory'];

      if (!sheet) {
        throw new Error('Directory sheet not found');
      }

      const rows = await sheet.getRows();
      const userData: User[] = rows.map(row => ({
        id: row.get('id') || crypto.randomUUID(),
        name: row.get('name') || '',
        email: row.get('email') || '',
        department: row.get('department') || '',
        status: row.get('status') || '',
        hireDate: row.get('hireDate') || '',
      }));

      setCachedData(cacheKey, userData);
      setUsers(userData);
      return userData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      console.error('Error loading users:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addUser = useCallback(async (user: Omit<User, 'id'>) => {
    try {
      const doc = await getGoogleSheetDoc();
      const sheet = doc.sheetsByTitle['Directory'];

      if (!sheet) {
        throw new Error('Directory sheet not found');
      }

      const newUser = {
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

      cache.delete('users');
      await loadUsers();
      return newUser;
    } catch (err) {
      console.error('Error adding user:', err);
      throw err;
    }
  }, [loadUsers]);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      const doc = await getGoogleSheetDoc();
      const sheet = doc.sheetsByTitle['Directory'];

      if (!sheet) {
        throw new Error('Directory sheet not found');
      }

      const rows = await sheet.getRows();
      const row = rows.find(r => r.get('id') === id);

      if (!row) {
        throw new Error('User not found');
      }

      Object.keys(updates).forEach(key => {
        if (key !== 'id') {
          row.set(key, updates[key as keyof User] as string);
        }
      });

      await row.save();
      cache.delete('users');
      await loadUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  }, [loadUsers]);

  const deleteUser = useCallback(async (id: string) => {
    try {
      const doc = await getGoogleSheetDoc();
      const sheet = doc.sheetsByTitle['Directory'];

      if (!sheet) {
        throw new Error('Directory sheet not found');
      }

      const rows = await sheet.getRows();
      const row = rows.find(r => r.get('id') === id);

      if (!row) {
        throw new Error('User not found');
      }

      await row.delete();
      cache.delete('users');
      await loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  }, [loadUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return { users, loading, error, loadUsers, addUser, updateUser, deleteUser };
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    const cacheKey = 'devices';
    const cached = getCachedData<Device[]>(cacheKey);

    if (cached) {
      setDevices(cached);
      setLoading(false);
      return cached;
    }

    try {
      setLoading(true);
      setError(null);

      const doc = await getGoogleSheetDoc();
      const presalesSheet = doc.sheetsByTitle['Presales'];
      const formResponsesSheet = doc.sheetsByTitle['Form Responses'];

      const allDevices: Device[] = [];

      if (presalesSheet) {
        const rows = await presalesSheet.getRows();
        const presalesDevices = rows.map(row => ({
          id: row.get('id') || crypto.randomUUID(),
          serialNumber: row.get('serialNumber') || '',
          assetTag: row.get('assetTag') || '',
          model: row.get('model') || '',
          assignedTo: row.get('assignedTo') || '',
          status: row.get('status') || '',
          location: row.get('location') || '',
          notes: row.get('notes') || '',
        }));
        allDevices.push(...presalesDevices);
      }

      if (formResponsesSheet) {
        const rows = await formResponsesSheet.getRows();
        const formDevices = rows.map(row => ({
          id: row.get('id') || crypto.randomUUID(),
          serialNumber: row.get('serialNumber') || '',
          assetTag: row.get('assetTag') || '',
          model: row.get('model') || '',
          assignedTo: row.get('assignedTo') || '',
          status: row.get('status') || '',
          location: row.get('location') || '',
          notes: row.get('notes') || '',
        }));
        allDevices.push(...formDevices);
      }

      setCachedData(cacheKey, allDevices);
      setDevices(allDevices);
      return allDevices;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load devices';
      setError(errorMessage);
      console.error('Error loading devices:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addDevice = useCallback(async (device: Omit<Device, 'id'>, sheetName: 'Presales' | 'Form Responses' = 'Presales') => {
    try {
      const doc = await getGoogleSheetDoc();
      const sheet = doc.sheetsByTitle[sheetName];

      if (!sheet) {
        throw new Error(`${sheetName} sheet not found`);
      }

      const newDevice = {
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

      cache.delete('devices');
      await loadDevices();
      return newDevice;
    } catch (err) {
      console.error('Error adding device:', err);
      throw err;
    }
  }, [loadDevices]);

  const updateDevice = useCallback(async (id: string, updates: Partial<Device>) => {
    try {
      const doc = await getGoogleSheetDoc();

      for (const sheetName of ['Presales', 'Form Responses']) {
        const sheet = doc.sheetsByTitle[sheetName];
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
          cache.delete('devices');
          await loadDevices();
          return;
        }
      }

      throw new Error('Device not found');
    } catch (err) {
      console.error('Error updating device:', err);
      throw err;
    }
  }, [loadDevices]);

  const deleteDevice = useCallback(async (id: string) => {
    try {
      const doc = await getGoogleSheetDoc();

      for (const sheetName of ['Presales', 'Form Responses']) {
        const sheet = doc.sheetsByTitle[sheetName];
        if (!sheet) continue;

        const rows = await sheet.getRows();
        const row = rows.find(r => r.get('id') === id);

        if (row) {
          await row.delete();
          cache.delete('devices');
          await loadDevices();
          return;
        }
      }

      throw new Error('Device not found');
    } catch (err) {
      console.error('Error deleting device:', err);
      throw err;
    }
  }, [loadDevices]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  return { devices, loading, error, loadDevices, addDevice, updateDevice, deleteDevice };
}
