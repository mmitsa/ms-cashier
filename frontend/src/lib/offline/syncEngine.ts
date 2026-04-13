/**
 * Sync Engine — automatically syncs offline data when back online
 * Also syncs invoices with ZATCA after successful sync
 */

import { apiClient } from '@/lib/api/client';
import {
  getUnsyncedInvoices, markInvoiceSynced, markInvoiceSyncError,
  getPendingSyncItems, updateSyncItem, clearSyncedInvoices, clearCompletedSync,
  cacheProducts, cacheCustomers, cacheCategories, cacheSettings,
  addToSyncQueue,
  type SyncQueueItem,
} from './offlineDb';

type SyncCallback = (status: SyncStatus) => void;

export type SyncStatus = {
  isSyncing: boolean;
  isOnline: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  currentItem?: string;
  errors: string[];
  syncedCount: number;
};

let listeners: SyncCallback[] = [];
let syncInProgress = false;
let lastSyncAt: string | null = null;
let periodicTimer: ReturnType<typeof setInterval> | null = null;

const status: SyncStatus = {
  isSyncing: false,
  isOnline: navigator.onLine,
  pendingCount: 0,
  lastSyncAt: null,
  errors: [],
  syncedCount: 0,
};

function notify() {
  listeners.forEach((cb) => cb({ ...status }));
}

export function onSyncStatusChange(cb: SyncCallback) {
  listeners.push(cb);
  cb({ ...status });
  return () => { listeners = listeners.filter((l) => l !== cb); };
}

// ─── Online/Offline detection ────────────────────────────

function handleOnline() {
  status.isOnline = true;
  notify();
  syncAll();
}

function handleOffline() {
  status.isOnline = false;
  notify();
}

export function initSyncEngine() {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  status.isOnline = navigator.onLine;

  // Periodic sync every 2 minutes when online
  periodicTimer = setInterval(() => {
    if (navigator.onLine && !syncInProgress) syncAll();
  }, 120_000);

  // Initial sync
  if (navigator.onLine) {
    setTimeout(() => syncAll(), 3000);
  }

  notify();
}

export function destroySyncEngine() {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  if (periodicTimer) clearInterval(periodicTimer);
  periodicTimer = null;
  listeners = [];
}

// ─── Cache data for offline use ──────────────────────────

export async function cacheDataForOffline() {
  if (!navigator.onLine) return;

  try {
    // Cache products
    const prodRes = await apiClient.get('/products/search', { params: { pageSize: 9999 } });
    if (prodRes.data?.data?.items) {
      await cacheProducts(prodRes.data.data.items);
    }

    // Cache customers
    const custRes = await apiClient.get('/contacts/search', { params: { pageSize: 9999 } });
    if (custRes.data?.data?.items) {
      await cacheCustomers(custRes.data.data.items);
    }

    // Cache categories
    try {
      const catRes = await apiClient.get('/categories');
      if (catRes.data?.data) {
        await cacheCategories(Array.isArray(catRes.data.data) ? catRes.data.data : []);
      }
    } catch {
      // Categories endpoint may not exist yet
    }

    // Cache store settings
    try {
      const settingsRes = await apiClient.get('/store-settings');
      if (settingsRes.data?.data) {
        await cacheSettings(settingsRes.data.data);
      }
    } catch {
      // Settings endpoint may not exist yet
    }
  } catch {
    // Silent fail for cache
  }
}

// ─── Main Sync Function ─────────────────────────────────

export async function syncAll(): Promise<void> {
  if (syncInProgress || !navigator.onLine) return;
  syncInProgress = true;
  status.isSyncing = true;
  status.errors = [];
  status.syncedCount = 0;
  notify();

  try {
    // 1. Sync pending invoices
    await syncPendingInvoices();

    // 2. Sync generic queue items
    await syncQueueItems();

    // 3. Refresh cache
    await cacheDataForOffline();

    // 4. Clean up
    await clearSyncedInvoices();
    await clearCompletedSync();

    lastSyncAt = new Date().toISOString();
    status.lastSyncAt = lastSyncAt;
  } catch (err: any) {
    status.errors.push(err.message || 'خطأ في المزامنة');
  } finally {
    syncInProgress = false;
    status.isSyncing = false;
    status.pendingCount = (await getUnsyncedInvoices()).length + (await getPendingSyncItems()).length;
    notify();
  }
}

// ─── Sync Invoices ───────────────────────────────────────

async function syncPendingInvoices() {
  const invoices = await getUnsyncedInvoices();
  status.pendingCount = invoices.length;
  notify();

  for (const inv of invoices) {
    if (!navigator.onLine) break;
    status.currentItem = `فاتورة أوفلاين #${inv.offlineId}`;
    notify();

    try {
      const res = await apiClient.post('/invoices/sale', inv.data);
      if (res.data?.success && res.data?.data?.id) {
        const serverId = res.data.data.id;
        await markInvoiceSynced(inv.offlineId!, serverId);
        status.syncedCount++;

        // Queue ZATCA reporting for the synced invoice
        await addToSyncQueue({
          type: 'zatca_report',
          payload: { invoiceId: serverId },
          createdAt: new Date().toISOString(),
          status: 'pending',
          retries: 0,
        });
      } else {
        await markInvoiceSyncError(inv.offlineId!, res.data?.errors?.[0] || 'فشل المزامنة');
        status.errors.push(`فاتورة #${inv.offlineId}: ${res.data?.errors?.[0] || 'فشل'}`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0] || err.message || 'خطأ';
      await markInvoiceSyncError(inv.offlineId!, msg);
      status.errors.push(`فاتورة #${inv.offlineId}: ${msg}`);
    }

    status.pendingCount--;
    notify();
  }
}

// ─── Sync Queue Items (ZATCA etc) ────────────────────────

async function syncQueueItems() {
  const items = await getPendingSyncItems();

  for (const item of items) {
    if (!navigator.onLine) break;
    if (item.retries >= 3) continue;

    status.currentItem = getItemDescription(item);
    notify();

    try {
      await updateSyncItem(item.id!, { status: 'syncing' });

      switch (item.type) {
        case 'zatca_report':
          await apiClient.post(`/zatca/report/${item.payload.invoiceId}`);
          break;
        case 'stock_adjustment':
          await apiClient.post('/inventory/adjust', item.payload);
          break;
        case 'contact_create':
          await apiClient.post('/contacts', item.payload);
          break;
      }

      await updateSyncItem(item.id!, { status: 'synced' });
      status.syncedCount++;
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0] || err.message || 'خطأ';
      await updateSyncItem(item.id!, {
        status: 'failed',
        error: msg,
        retries: item.retries + 1,
      });
      if (item.type !== 'zatca_report') {
        status.errors.push(`${getItemDescription(item)}: ${msg}`);
      }
    }
    notify();
  }
}

function getItemDescription(item: SyncQueueItem): string {
  switch (item.type) {
    case 'zatca_report': return `تقرير زاتكا #${item.payload.invoiceId}`;
    case 'stock_adjustment': return 'تعديل مخزون';
    case 'contact_create': return 'إنشاء عميل';
    default: return item.type;
  }
}
