'use client';

import { useState, useEffect } from 'react';
import {
  writeData,
  readData,
  updateData,
  deleteData,
  pushData,
  subscribeToData,
} from '@/lib/firebase/database';

/**
 * Hook to read data from a specific path (one-time read)
 */
export const useReadData = (path: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await readData(path);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to read data');
      } finally {
        setLoading(false);
      }
    };

    if (path) {
      fetchData();
    }
  }, [path]);

  return { data, loading, error };
};

/**
 * Hook to subscribe to real-time updates at a specific path
 */
export const useRealtimeData = (path: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToData(path, (newData) => {
        setData(newData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe to data');
      setLoading(false);
    }
  }, [path]);

  return { data, loading, error };
};

/**
 * Hook for database write operations
 */
export const useDatabaseWrite = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const write = async (path: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      await writeData(path, data);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to write data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const update = async (path: string, updates: any) => {
    setLoading(true);
    setError(null);
    try {
      await updateData(path, updates);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteData(path);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const push = async (path: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const key = await pushData(path, data);
      return key;
    } catch (err: any) {
      setError(err.message || 'Failed to push data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    write,
    update,
    remove,
    push,
  };
};
