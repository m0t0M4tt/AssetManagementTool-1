import { useState, useEffect, useCallback } from 'react';
import { DataService } from '../lib/dataService';
import { useAuth } from '../contexts/AuthContext';
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
  const { accessToken, logout } = useAuth();

  const handleTokenExpired = useCallback(() => {
    logout();
    window.location.href = '/';
  }, [logout]);

  const loadUsers = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return [];
    }

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

      const userData = await DataService.fetchUsers(accessToken);

      setCachedData(cacheKey, userData);
      setUsers(userData);
      return userData;
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        handleTokenExpired();
        return [];
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to load users from Directory tab';
      setError(errorMessage);
      console.error('Error loading users:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [accessToken, handleTokenExpired]);

  const addUser = useCallback(async (user: Omit<User, 'id'>) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const newUser = await DataService.addUser(accessToken, user);
      cache.delete('users');
      await loadUsers();
      return newUser;
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        handleTokenExpired();
      }
      console.error('Error adding user:', err);
      throw err;
    }
  }, [accessToken, loadUsers, handleTokenExpired]);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      await DataService.updateUser(accessToken, id, updates);
      cache.delete('users');
      await loadUsers();
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        handleTokenExpired();
      }
      console.error('Error updating user:', err);
      throw err;
    }
  }, [accessToken, loadUsers, handleTokenExpired]);

  const deleteUser = useCallback(async (id: string) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      await DataService.deleteUser(accessToken, id);
      cache.delete('users');
      await loadUsers();
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        handleTokenExpired();
      }
      console.error('Error deleting user:', err);
      throw err;
    }
  }, [accessToken, loadUsers, handleTokenExpired]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return { users, loading, error, loadUsers, addUser, updateUser, deleteUser };
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, logout } = useAuth();

  const handleTokenExpired = useCallback(() => {
    logout();
    window.location.href = '/';
  }, [logout]);

  const loadDevices = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return [];
    }

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

      const deviceData = await DataService.fetchDevices(accessToken);

      setCachedData(cacheKey, deviceData);
      setDevices(deviceData);
      return deviceData;
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        handleTokenExpired();
        return [];
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to load devices from Presales and Form Responses tabs';
      setError(errorMessage);
      console.error('Error loading devices:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [accessToken, handleTokenExpired]);

  const addDevice = useCallback(async (device: Omit<Device, 'id'>, sheetName: 'Presales' | 'Form Responses' = 'Presales') => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const newDevice = await DataService.addDevice(accessToken, device, sheetName);
      cache.delete('devices');
      await loadDevices();
      return newDevice;
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        handleTokenExpired();
      }
      console.error('Error adding device:', err);
      throw err;
    }
  }, [accessToken, loadDevices, handleTokenExpired]);

  const updateDevice = useCallback(async (id: string, updates: Partial<Device>) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      await DataService.updateDevice(accessToken, id, updates);
      cache.delete('devices');
      await loadDevices();
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        handleTokenExpired();
      }
      console.error('Error updating device:', err);
      throw err;
    }
  }, [accessToken, loadDevices, handleTokenExpired]);

  const deleteDevice = useCallback(async (id: string) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      await DataService.deleteDevice(accessToken, id);
      cache.delete('devices');
      await loadDevices();
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        handleTokenExpired();
      }
      console.error('Error deleting device:', err);
      throw err;
    }
  }, [accessToken, loadDevices, handleTokenExpired]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  return { devices, loading, error, loadDevices, addDevice, updateDevice, deleteDevice };
}
