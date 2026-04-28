import { storageLocalGet, storageLocalRemove, storageLocalSet } from './webext.js';

export async function getStorage<T>(key: string): Promise<T | null> {
  return storageLocalGet<T>(key);
}

export async function setStorage<T>(key: string, value: T): Promise<void> {
  await storageLocalSet(key, value);
}

export async function clearStorage(key: string): Promise<void> {
  await storageLocalRemove(key);
}
