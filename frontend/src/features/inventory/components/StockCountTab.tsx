import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Square, CheckCircle, XCircle, ClipboardCheck,
  ScanBarcode, AlertTriangle, ArrowDownUp, Search, Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import { useWarehouses } from '@/hooks/useApi';
import { stockCountApi } from '@/lib/api/endpoints';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { productsApi } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';
import type { StockCountDto, StockCountItemDto } from '@/types/api.types';

export function StockCountTab() {
  const [sessions, setSessions] = useState<StockCountDto[]>([]);
  const [activeSession, setActiveSession] = useState<StockCountDto | null>(null);
  const [items, setItems] = useState<StockCountItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const { data: warehouses = [] } = useWarehouses();

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const res = await stockCountApi.getAll();
      setSessions(res.data ?? []);
      // Auto-select active session
      const active = (res.data ?? []).find(s => s.status === 'InProgress');
      if (active) {
        setActiveSession(active);
        loadItems(active.id);
      }
    } catch {}
  }

  async function loadItems(sessionId: number) {
    setLoading(true);
    try {
      const res = await stockCountApi.getItems(sessionId);
      setItems(res.data ?? []);
    } catch {} finally { setLoading(false); }
  }

  // Barcode scanner handler
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!activeSession || activeSession.status !== 'InProgress') return;

    try {
      // Lookup product by barcode
      const prodRes = await productsApi.getByBarcode(barcode);
      const product = prodRes.data;
      if (!product) {
        toast.error(`الباركود ${barcode} غير موجود`);
        return;
      }

      // Scan (increment count)
      const res = await stockCountApi.scan(activeSession.id, { productId: product.id });
      toast.success(res.message ?? `تم تسجيل ${product.name}`);

      // Update items list
      setItems(prev => {
        const idx = prev.findIndex(i => i.productId === product.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = res.data!;
          return updated;
        }
        return [...prev, res.data!];
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] ?? 'خطأ في التسجيل');
    }
  }, [activeSession]);

  useBarcodeScanner({ onScan: handleBarcodeScan, enabled: !!activeSession && activeSession.status === 'InProgress' });

  async function handleManualScan() {
    const barcode = scanInputRef.current?.value?.trim();
    if (!barcode) return;
    await handleBarcodeScan(barcode);
    if (scanInputRef.current) scanInputRef.current.value = '';
    scanInputRef.current?.focus();
  }

  async function handleSettle(item: StockCountItemDto) {
    if (!activeSession) return;
    try {
      const res = await stockCountApi.settleItem(activeSession.id, item.id, {});
      toast.success('تمت التسوية');
      setItems(prev => prev.map(i => i.id === item.id ? res.data! : i));
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] ?? 'فشل التسوية');
    }
  }

  async function handleComplete() {
    if (!activeSession) return;
    if (!confirm('هل تريد إكمال جلسة الجرد؟ لن يمكنك إضافة عمليات سكان بعدها.')) return;
    try {
      await stockCountApi.complete(activeSession.id);
      toast.success('تم إكمال الجرد');
      setActiveSession(null);
      setItems([]);
      loadSessions();
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] ?? 'فشل الإكمال');
    }
  }

  async function handleCancel() {
    if (!activeSession) return;
    if (!confirm('هل تريد إلغاء جلسة الجرد؟')) return;
    try {
      await stockCountApi.cancel(activeSession.id);
      toast.success('تم إلغاء الجرد');
      setActiveSession(null);
      setItems([]);
      loadSessions();
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] ?? 'فشل الإلغاء');
    }
  }

  function openSession(session: StockCountDto) {
    setActiveSession(session);
    loadItems(session.id);
  }

  const filteredItems = search
    ? items.filter(i => i.productName.toLowerCase().includes(search.toLowerCase()) || i.barcode?.includes(search))
    : items;

  const stats = {
    matched: items.filter(i => i.status === 'Matched').length,
    shortage: items.filter(i => i.status === 'Shortage').length,
    surplus: items.filter(i => i.status === 'Surplus').length,
    pending: items.filter(i => i.status === 'Pending').length,
    settled: items.filter(i => i.isSettled).length,
  };

  // ---- No active session: show list + start button ----
  if (!activeSession) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">جلسات الجرد</h3>
          <button onClick={() => setShowStartModal(true)} className="btn-primary">
            <Play size={16} /> بدء جلسة جرد
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ClipboardCheck size={48} className="mx-auto mb-3 opacity-50" />
            <p>لا توجد جلسات جرد سابقة</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => openSession(s)}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{s.warehouseName}</span>
                  <span className="text-sm text-gray-500 mr-3">
                    {new Date(s.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{s.countedItems}/{s.totalItems} صنف</span>
                  <Badge variant={s.status === 'InProgress' ? 'warning' : s.status === 'Completed' ? 'success' : 'danger'}>
                    {s.status === 'InProgress' ? 'جارٍ' : s.status === 'Completed' ? 'مكتمل' : 'ملغى'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {showStartModal && (
          <StartCountModal
            open={showStartModal}
            onClose={() => setShowStartModal(false)}
            warehouses={warehouses}
            onStarted={(sc) => {
              setShowStartModal(false);
              setActiveSession(sc);
              loadItems(sc.id);
              loadSessions();
            }}
          />
        )}
      </div>
    );
  }

  // ---- Active session: scanning + items table ----
  const isActive = activeSession.status === 'InProgress';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            جرد: {activeSession.warehouseName}
          </h3>
          <p className="text-sm text-gray-500">
            {new Date(activeSession.createdAt).toLocaleDateString('ar-SA')} —
            <Badge variant={isActive ? 'warning' : 'success'} className="mr-2">
              {isActive ? 'جارٍ' : 'مكتمل'}
            </Badge>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setActiveSession(null); setItems([]); }} className="btn-secondary text-sm">
            ← رجوع
          </button>
          {isActive && (
            <>
              <button onClick={handleComplete} className="btn-primary text-sm">
                <CheckCircle size={16} /> إكمال الجرد
              </button>
              <button onClick={handleCancel} className="btn-secondary text-sm text-red-600">
                <XCircle size={16} /> إلغاء
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'مطابق', value: stats.matched, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
          { label: 'ناقص', value: stats.shortage, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
          { label: 'زائد', value: stats.surplus, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'لم يُعد', value: stats.pending, color: 'text-gray-600 bg-gray-50 dark:bg-gray-800' },
          { label: 'تمت تسويته', value: stats.settled, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-lg p-3 text-center', s.color)}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Scanner input */}
      {isActive && (
        <div className="flex gap-2 items-center bg-brand-50 dark:bg-brand-900/20 p-3 rounded-lg border border-brand-200 dark:border-brand-800">
          <ScanBarcode size={20} className="text-brand-600 shrink-0" />
          <input
            ref={scanInputRef}
            type="text"
            placeholder="امسح الباركود أو اكتبه واضغط Enter..."
            onKeyDown={e => e.key === 'Enter' && handleManualScan()}
            className="input flex-1 text-sm"
            data-barcode-input="true"
            autoFocus
          />
          <button onClick={handleManualScan} className="btn-primary text-sm px-4">
            سجّل
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="بحث في الأصناف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pr-10 w-full"
        />
      </div>

      {/* Items table */}
      {loading ? (
        <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-gray-400" /></div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500">الباركود</th>
                <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500">الصنف</th>
                <th className="py-2 px-3 text-center text-xs font-semibold text-gray-500">رصيد النظام</th>
                <th className="py-2 px-3 text-center text-xs font-semibold text-gray-500">الرصيد الفعلي</th>
                <th className="py-2 px-3 text-center text-xs font-semibold text-gray-500">الفرق</th>
                <th className="py-2 px-3 text-center text-xs font-semibold text-gray-500">الحالة</th>
                <th className="py-2 px-3 text-center text-xs font-semibold text-gray-500">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr
                  key={item.id}
                  className={cn(
                    'border-b border-gray-100 dark:border-gray-800 transition-colors',
                    item.isSettled && 'bg-green-50/50 dark:bg-green-900/10'
                  )}
                >
                  <td className="py-2 px-3 text-sm font-mono text-gray-500">{item.barcode || '—'}</td>
                  <td className="py-2 px-3 text-sm font-medium text-gray-900 dark:text-gray-100">{item.productName}</td>
                  <td className="py-2 px-3 text-sm text-center text-gray-600">{item.systemQty}</td>
                  <td className="py-2 px-3 text-sm text-center font-semibold text-gray-900 dark:text-gray-100">
                    {item.countedQty}
                  </td>
                  <td className={cn(
                    'py-2 px-3 text-sm text-center font-semibold',
                    item.variance === 0 ? 'text-green-600' : item.variance < 0 ? 'text-red-600' : 'text-blue-600'
                  )}>
                    {item.variance > 0 ? `+${item.variance}` : item.variance}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <StatusBadge status={item.status} isSettled={item.isSettled} />
                  </td>
                  <td className="py-2 px-3 text-center">
                    {isActive && !item.isSettled && item.status !== 'Pending' && (
                      <button
                        onClick={() => handleSettle(item)}
                        className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                      >
                        <ArrowDownUp size={14} className="inline ml-1" />
                        تسوية
                      </button>
                    )}
                    {item.isSettled && (
                      <span className="text-xs text-green-600">✓ تمت</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    {items.length === 0 ? 'ابدأ بمسح الأصناف بالسكانر' : 'لا نتائج'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, isSettled }: { status: string; isSettled: boolean }) {
  if (isSettled) return <Badge variant="success">تمت التسوية</Badge>;
  switch (status) {
    case 'Matched':  return <Badge variant="success">مطابق</Badge>;
    case 'Shortage': return <Badge variant="danger">ناقص</Badge>;
    case 'Surplus':  return <Badge variant="info">زائد</Badge>;
    default:         return <Badge variant="default">لم يُعد</Badge>;
  }
}

function StartCountModal({
  open, onClose, warehouses, onStarted,
}: {
  open: boolean;
  onClose: () => void;
  warehouses: { id: number; name: string }[];
  onStarted: (sc: StockCountDto) => void;
}) {
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    if (!warehouseId) return;
    setStarting(true);
    try {
      const res = await stockCountApi.start({ warehouseId: warehouseId as number, notes: notes || undefined });
      onStarted(res.data!);
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] ?? 'فشل بدء الجرد');
    } finally { setStarting(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="بدء جلسة جرد جديدة" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المخزن</label>
          <select
            value={warehouseId}
            onChange={e => setWarehouseId(e.target.value ? Number(e.target.value) : '')}
            className="input w-full"
          >
            <option value="">اختر المخزن...</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات (اختياري)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="مثال: جرد نهاية الشهر"
            className="input w-full"
          />
        </div>
        <p className="text-xs text-gray-500">
          <AlertTriangle size={14} className="inline ml-1" />
          سيتم تحميل جميع أصناف المخزن مع أرصدتها الحالية. ابدأ بمسح الأصناف بالسكانر.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button onClick={handleStart} disabled={!warehouseId || starting} className="btn-primary">
            <Play size={16} />
            {starting ? 'جارٍ البدء...' : 'بدء الجرد'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
