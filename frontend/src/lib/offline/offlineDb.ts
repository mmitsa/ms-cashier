/**
 * IndexedDB Offline Storage Engine
 * Stores: products cache, pending invoices, sync queue, customers cache,
 *         categories cache, settings cache
 */

const DB_NAME = 'mpos-offline';
const DB_VERSION = 2;

const STORES = {
  products: 'products',
  customers: 'customers',
  categories: 'categories',
  settings: 'settings',
  pendingInvoices: 'pending_invoices',
  syncQueue: 'sync_queue',
  meta: 'meta',
} as const;

let dbInstance: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.products))
        db.createObjectStore(STORES.products, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.customers))
        db.createObjectStore(STORES.customers, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.categories))
        db.createObjectStore(STORES.categories, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.settings))
        db.createObjectStore(STORES.settings, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(STORES.pendingInvoices))
        db.createObjectStore(STORES.pendingInvoices, { keyPath: 'offlineId', autoIncrement: true });
      if (!db.objectStoreNames.contains(STORES.syncQueue))
        db.createObjectStore(STORES.syncQueue, { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains(STORES.meta))
        db.createObjectStore(STORES.meta, { keyPath: 'key' });
    };

    req.onsuccess = () => {
      dbInstance = req.result;
      dbInstance.onclose = () => { dbInstance = null; };
      resolve(dbInstance);
    };

    req.onerror = () => reject(req.error);
  });
}

async function getStore(name: string, mode: IDBTransactionMode = 'readonly') {
  const db = await openDb();
  return db.transaction(name, mode).objectStore(name);
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Products Cache ──────────────────────────────────────

export async function cacheProducts(products: any[]) {
  const store = await getStore(STORES.products, 'readwrite');
  for (const p of products) store.put(p);
  const meta = await getStore(STORES.meta, 'readwrite');
  meta.put({ key: 'products_cached_at', value: Date.now() });
}

export async function getCachedProducts(): Promise<any[]> {
  const store = await getStore(STORES.products);
  return promisify(store.getAll());
}

export async function getCachedProductByBarcode(barcode: string): Promise<any | null> {
  const all = await getCachedProducts();
  return all.find((p) => p.barcode === barcode) || null;
}

// ─── Customers Cache ─────────────────────────────────────

export async function cacheCustomers(customers: any[]) {
  const store = await getStore(STORES.customers, 'readwrite');
  for (const c of customers) store.put(c);
}

export async function getCachedCustomers(): Promise<any[]> {
  const store = await getStore(STORES.customers);
  return promisify(store.getAll());
}

// ─── Categories Cache ────────────────────────────────────

export async function cacheCategories(categories: any[]) {
  const store = await getStore(STORES.categories, 'readwrite');
  for (const c of categories) store.put(c);
  const meta = await getStore(STORES.meta, 'readwrite');
  meta.put({ key: 'categories_cached_at', value: Date.now() });
}

export async function getCachedCategories(): Promise<any[]> {
  const store = await getStore(STORES.categories);
  return promisify(store.getAll());
}

// ─── Settings Cache ──────────────────────────────────────

export async function cacheSettings(settings: any) {
  const store = await getStore(STORES.settings, 'readwrite');
  store.put({ key: 'store_settings', value: settings });
}

export async function getCachedSettings(): Promise<any | null> {
  const store = await getStore(STORES.settings);
  const result = await promisify(store.get('store_settings'));
  return result?.value ?? null;
}

// ─── Pending Invoices (offline sales) ────────────────────

export type PendingInvoice = {
  offlineId?: number;
  data: any;
  createdAt: string;
  synced: boolean;
  syncError?: string;
  serverId?: number;
};

export async function savePendingInvoice(invoice: PendingInvoice): Promise<number> {
  const store = await getStore(STORES.pendingInvoices, 'readwrite');
  const id = await promisify(store.add(invoice));
  return id as number;
}

export async function getPendingInvoices(): Promise<PendingInvoice[]> {
  const store = await getStore(STORES.pendingInvoices);
  return promisify(store.getAll());
}

export async function markInvoiceSynced(offlineId: number, serverId: number) {
  const store = await getStore(STORES.pendingInvoices, 'readwrite');
  const inv = await promisify(store.get(offlineId));
  if (inv) {
    inv.synced = true;
    inv.serverId = serverId;
    store.put(inv);
  }
}

export async function markInvoiceSyncError(offlineId: number, error: string) {
  const store = await getStore(STORES.pendingInvoices, 'readwrite');
  const inv = await promisify(store.get(offlineId));
  if (inv) {
    inv.syncError = error;
    store.put(inv);
  }
}

export async function getUnsyncedInvoices(): Promise<PendingInvoice[]> {
  const all = await getPendingInvoices();
  return all.filter((i) => !i.synced);
}

export async function clearSyncedInvoices() {
  const store = await getStore(STORES.pendingInvoices, 'readwrite');
  const all: PendingInvoice[] = await promisify(store.getAll());
  for (const inv of all) {
    if (inv.synced && inv.offlineId) store.delete(inv.offlineId);
  }
}

// ─── Sync Queue (generic operations) ─────────────────────

export type SyncQueueItem = {
  id?: number;
  type: 'invoice' | 'zatca_report' | 'stock_adjustment' | 'contact_create';
  payload: any;
  createdAt: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
  retries: number;
};

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id'>) {
  const store = await getStore(STORES.syncQueue, 'readwrite');
  return promisify(store.add(item));
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const store = await getStore(STORES.syncQueue);
  return promisify(store.getAll());
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const all = await getSyncQueue();
  return all.filter((i) => i.status === 'pending' || i.status === 'failed');
}

export async function updateSyncItem(id: number, update: Partial<SyncQueueItem>) {
  const store = await getStore(STORES.syncQueue, 'readwrite');
  const item = await promisify(store.get(id));
  if (item) {
    Object.assign(item, update);
    store.put(item);
  }
}

export async function clearCompletedSync() {
  const store = await getStore(STORES.syncQueue, 'readwrite');
  const all: SyncQueueItem[] = await promisify(store.getAll());
  for (const item of all) {
    if (item.status === 'synced' && item.id) store.delete(item.id);
  }
}

// ─── Meta / Stats ────────────────────────────────────────

export async function getOfflineStats() {
  const pending = await getUnsyncedInvoices();
  const queue = await getPendingSyncItems();
  const products = await getCachedProducts();
  return {
    pendingInvoices: pending.length,
    pendingSyncItems: queue.length,
    cachedProducts: products.length,
    lastCachedAt: await getMetaValue('products_cached_at'),
  };
}

async function getMetaValue(key: string): Promise<any> {
  const store = await getStore(STORES.meta);
  const r = await promisify(store.get(key));
  return r?.value;
}
