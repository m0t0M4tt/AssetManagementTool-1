import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { DataService } from '../lib/dataService';
import { useAuth } from './AuthContext';
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

interface DataContextType {
  users: User[];
  devices: Device[];
  usersLoading: boolean;
  devicesLoading: boolean;
  usersError: string | null;
  devicesError: string | null;
  loadUsers: () => Promise<User[]>;
  loadDevices: () => Promise<Device[]>;
  addUser: (user: Omit<User, 'id'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addDevice: (device: Omit<Device, 'id'>, sheetName?: 'Presales' | 'Form Responses') => Promise<Device>;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const { accessToken, logout, isAuthenticated } = useAuth();

  const handleTokenExpired = useCallback(() => {
    logout();
    window.location.href = '/';
  }, [logout]);

  const loadUsers = useCallback(async () => {
    if (!accessToken) {
      setUsersLoading(false);
      return [];
    }

    const cacheKey = 'users';
    const cached = getCachedData<User[]>(cacheKey);

    if (cached) {
      setUsers(cached);
      setUsersLoading(false);
      return cached;
    }

    try {
      setUsersLoading(true);
      setUsersError(null);

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
      setUsersError(errorMessage);
      console.error('Error loading users:', err);
      return [];
    } finally {
      setUsersLoading(false);
    }
  }, [accessToken, handleTokenExpired]);

  const loadDevices = useCallback(async () => {
    if (!accessToken) {
      setDevicesLoading(false);
      return [];
    }

    const cacheKey = 'devices';
    const cached = getCachedData<Device[]>(cacheKey);

    if (cached) {
      setDevices(cached);
      setDevicesLoading(false);
      return cached;
    }

    try {
      setDevicesLoading(true);
      setDevicesError(null);

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
      setDevicesError(errorMessage);
      console.error('Error loading devices:', err);
      return [];
    } finally {
      setDevicesLoading(false);
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
    if (isAuthenticated && accessToken && !hasFetched) {
      console.log('DataProvider: Initial fetch triggered');
      setHasFetched(true);
      // Load users first, then devices (devices depend on users being loaded)
      loadUsers().then(() => {
        loadDevices();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken, hasFetched]);

  const value: DataContextType = {
    users,
    devices,
    usersLoading,
    devicesLoading,
    usersError,
    devicesError,
    loadUsers,
    loadDevices,
    addUser,
    updateUser,
    deleteUser,
    addDevice,
    updateDevice,
    deleteDevice,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
