export type StoreName = 'backups' | 'archive' | 'photos';

const DB_NAME = 'panda-db';
const DB_VERSION = 1;
const STORES: StoreName[] = ['backups', 'archive', 'photos'];

let dbPromise: Promise<IDBDatabase> | undefined;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = undefined; // 暫時性失敗不要永久快取
        reject(req.error);
      };
      req.onblocked = () => {
        dbPromise = undefined;
        reject(new Error('idb blocked'));
      };
    });
  }
  return dbPromise;
}

function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  op: (s: IDBObjectStore) => IDBRequest,
  map: (result: unknown) => T,
): Promise<T> {
  return openDb().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = op(tx.objectStore(store));
        req.onsuccess = () => resolve(map(req.result));
        req.onerror = () => reject(req.error);
      }),
  );
}

export function idbGet<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  return run(store, 'readonly', s => s.get(key), r => r as T | undefined);
}

export function idbPut(store: StoreName, key: IDBValidKey, value: unknown): Promise<void> {
  return run(store, 'readwrite', s => s.put(value, key), () => undefined);
}

export function idbDelete(store: StoreName, key: IDBValidKey): Promise<void> {
  return run(store, 'readwrite', s => s.delete(key), () => undefined);
}

export function idbKeys(store: StoreName): Promise<IDBValidKey[]> {
  return run(store, 'readonly', s => s.getAllKeys(), r => r as IDBValidKey[]);
}
