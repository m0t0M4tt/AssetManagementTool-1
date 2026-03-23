import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../lib/dataService';
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

      const userData = await DataService.fetchUsers();

      setCachedData(cacheKey, userData);
      setUsers(userData);
      return userData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users from Directory tab';
      setError(errorMessage);
      console.error('Error loading users:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addUser = useCallback(async (user: Omit<User, 'id'>) => {
    try {
      const newUser = await DataService.addUser(user);
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
      await DataService.updateUser(id, updates);
      cache.delete('users');
      await loadUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  }, [loadUsers]);

  const deleteUser = useCallback(async (id: string) => {
    try {
      await DataService.deleteUser(id);
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

      const deviceData = await DataService.fetchDevices();

      setCachedData(cacheKey, deviceData);
      setDevices(deviceData);
      return deviceData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load devices from Presales and Form Responses tabs';
      setError(errorMessage);
      console.error('Error loading devices:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addDevice = useCallback(async (device: Omit<Device, 'id'>, sheetName: 'Presales' | 'Form Responses' = 'Presales') => {
    try {
      const newDevice = await DataService.addDevice(device, sheetName);
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
      await DataService.updateDevice(id, updates);
      cache.delete('devices');
      await loadDevices();
    } catch (err) {
      console.error('Error updating device:', err);
      throw err;
    }
  }, [loadDevices]);

  const deleteDevice = useCallback(async (id: string) => {
    try {
      await DataService.deleteDevice(id);
      cache.delete('devices');
      await loadDevices();
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
