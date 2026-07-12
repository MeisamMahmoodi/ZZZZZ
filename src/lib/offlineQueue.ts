// Lightweight IndexedDB-backed queue for check-in/check-out actions that
// couldn't be uploaded immediately (e.g. no network on-site). Entries survive
// app/browser restarts and are retried automatically by useOfflineSync.

const DB_NAME = 'meizo-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'pending_actions';

export interface PendingCheckIn {
  id: string;
  type: 'checkin';
  assignmentId: string;
  photoBlob: Blob;
  lat: number | null;
  lng: number | null;
  createdAt: string;
}

export interface PendingCheckOut {
  id: string;
  type: 'checkout';
  assignmentId: string;
  photoBlob: Blob;
  lat: number | null;
  lng: number | null;
  createdAt: string;
}

export type PendingAction = PendingCheckIn | PendingCheckOut;

function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addPendingAction(action: PendingAction): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(action);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingActions(): Promise<PendingAction[]> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve((req.result as PendingAction[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function removePendingAction(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Heuristic: only queue actions that failed because of a network problem.
// Real errors (validation, permissions, etc.) should surface to the user
// immediately instead of silently retrying forever.
export function isLikelyNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return message.includes('fetch') || message.includes('network') || message.includes('failed to fetch');
}
