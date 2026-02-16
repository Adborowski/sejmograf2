import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
  off,
  DatabaseReference,
  DataSnapshot,
} from 'firebase/database';
import { database } from './config';

/**
 * Write data to a specific path in the database
 */
export const writeData = async (path: string, data: any): Promise<void> => {
  try {
    const dbRef = ref(database, path);
    await set(dbRef, data);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to write data');
  }
};

/**
 * Read data from a specific path in the database (one-time read)
 */
export const readData = async (path: string): Promise<any> => {
  try {
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to read data');
  }
};

/**
 * Update specific fields in the database
 */
export const updateData = async (path: string, updates: any): Promise<void> => {
  try {
    const dbRef = ref(database, path);
    await update(dbRef, updates);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update data');
  }
};

/**
 * Delete data at a specific path
 */
export const deleteData = async (path: string): Promise<void> => {
  try {
    const dbRef = ref(database, path);
    await remove(dbRef);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete data');
  }
};

/**
 * Push a new child to a list at the specified path
 * Returns the key of the new child
 */
export const pushData = async (path: string, data: any): Promise<string> => {
  try {
    const dbRef = ref(database, path);
    const newRef = push(dbRef);
    await set(newRef, data);
    return newRef.key as string;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to push data');
  }
};

/**
 * Subscribe to real-time updates at a specific path
 * Returns an unsubscribe function
 */
export const subscribeToData = (
  path: string,
  callback: (data: any) => void
): (() => void) => {
  const dbRef = ref(database, path);

  const listener = (snapshot: DataSnapshot) => {
    callback(snapshot.val());
  };

  onValue(dbRef, listener);

  // Return unsubscribe function
  return () => off(dbRef, 'value', listener);
};

/**
 * Get a database reference for a specific path
 */
export const getRef = (path: string): DatabaseReference => {
  return ref(database, path);
};
