import { openDB } from 'idb';

const DB_NAME = 'cpf-offline';
const STORE = 'pending-requests';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function queueRequest(payload: Record<string, unknown>) {
  const db = await getDB();
  await db.add(STORE, { payload, ts: Date.now() });
}

export async function getPendingRequests() {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function removePendingRequest(id: number) {
  const db = await getDB();
  await db.delete(STORE, id);
}

export async function retryPendingRequests(submitFn: (payload: Record<string, unknown>) => Promise<boolean>) {
  if (!navigator.onLine) return;
  const pending = await getPendingRequests();
  for (const item of pending) {
    const success = await submitFn(item.payload);
    if (success) await removePendingRequest(item.id);
  }
}
