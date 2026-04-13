import { useState, useMemo, useEffect } from 'react';
import { ArrowLeftRight, ClipboardList, BarChart3, Sliders, Warehouse, Package, AlertTriangle, Search, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useWarehouses } from '@/hooks/useApi';
import { inventoryApi } from '@/lib/api/endpoints';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDateTime } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

type Tab = 'dashboard' | 'movements' | 'adjust' | 'transfer';

export function StockManagementTabs() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {[
          { id: 'dashboard' as Tab, label: 'نظرة عامة', icon: BarChart3 },
          { id: 'movements' as Tab, label: 'حركات المخزون', icon: ClipboardList },
          { id: 'adjust' as Tab, label: 'تسوية يدوية', icon: Sliders },
          { id: 'transfer' as Tab, label: 'تحويل بين المخازن', icon: ArrowLeftRight },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white dark:bg-gray-900 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'movements' && <MovementsTab />}
      {tab === 'adjust' && <AdjustTab />}
      {tab === 'transfer' && <TransferTab />}
    </div>
  );
}

// ─── Dashboard Tab ───────────────────────────────
function DashboardTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.getDashboard().then(res => {
      if (res.success) setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="card p-8 text-center text-gray-400">جارٍ التحميل...</div>;
  if (!data) return <div className="card p-8 text-center text-red-400">فشل تحميل البيانات</div>;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card p-4 bg-gradient-to-l from-brand-50 to-white dark:from-brand-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الأصناف</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{data.totalProducts}</p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-indigo-50 to-white dark:from-indigo-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">المخازن</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{data.totalWarehouses}</p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">قيمة المخزون</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(data.totalStockValue)}</p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">منخفض</p>
          <p className="text-xl font-bold text-amber-600">{data.lowStockCount}</p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-red-50 to-white dark:from-red-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">نافد</p>
          <p className="text-xl font-bold text-red-600">{data.outOfStockCount}</p>
        </div>
      </div>

      {/* Per-Warehouse Breakdown */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Warehouse size={20} className="text-brand-600" /> ملخص المخازن
        </h3>
        {data.warehouseSummaries.length === 0 ? (
          <p className="text-gray-400 text-center py-6">لا توجد مخازن</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.warehouseSummaries.map((w: any) => (
              <div key={w.warehouseId} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <Warehouse size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{w.warehouseName}</p>
                    <p className="text-xs text-gray-400">{w.productCount} صنف</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">الكمية</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{w.totalQuantity}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500 dark:text-gray-400">القيمة</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(w.totalValue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Movements Tab ───────────────────────────────
function MovementsTab() {
  const [productId, setProductId] = useState('');
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0] ?? ''; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0] ?? '');
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const TXN_LABELS: Record<number, { label: string; color: string }> = {
    1: { label: 'إدخال', color: 'text-emerald-600' },
    2: { label: 'إخراج', color: 'text-red-600' },
    3: { label: 'تحويل', color: 'text-blue-600' },
    4: { label: 'تسوية', color: 'text-amber-600' },
    5: { label: 'مرتجع', color: 'text-violet-600' },
  };

  const search = async () => {
    if (!productId) return toast.error('أدخل رقم الصنف');
    setLoading(true);
    try {
      const res = await inventoryApi.getMovements(Number(productId), dateFrom, dateTo);
      if (res.success) setMovements(res.data?.items ?? []);
      else toast.error(res.errors?.join(', ') || 'خطأ');
    } catch { toast.error('فشل الاتصال'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">رقم الصنف</label>
          <input value={productId} onChange={e => setProductId(e.target.value)} placeholder="ID" type="number"
            className="w-28 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" dir="ltr" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">من</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">إلى</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" />
        </div>
        <button onClick={search} disabled={loading}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50">
          {loading ? 'جارٍ...' : 'بحث'}
        </button>
      </div>

      {movements.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead><tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">التاريخ</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">النوع</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الكمية</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">قبل</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">بعد</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">المرجع</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">ملاحظات</th>
              </tr></thead>
              <tbody>
                {movements.map((m: any, i: number) => {
                  const txn = TXN_LABELS[m.transactionType] ?? { label: '?', color: 'text-gray-500' };
                  return (
                    <tr key={m.id ?? i} className="border-b border-gray-50 dark:border-gray-800">
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">{formatDateTime(m.createdAt)}</td>
                      <td className="py-3 px-4"><span className={`text-xs font-bold ${txn.color}`}>{txn.label}</span></td>
                      <td className="py-3 px-4 text-sm font-mono font-bold text-gray-900 dark:text-gray-100">{m.quantity}</td>
                      <td className="py-3 px-4 text-xs text-gray-400 font-mono">{m.previousQty}</td>
                      <td className="py-3 px-4 text-xs text-gray-400 font-mono">{m.newQty}</td>
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">{m.referenceType} #{m.referenceId}</td>
                      <td className="py-3 px-4 text-xs text-gray-400">{m.notes ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Adjust Tab ──────────────────────────────────
function AdjustTab() {
  const { data: warehouses } = useWarehouses();
  const [warehouseId, setWarehouseId] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjusting, setAdjusting] = useState<{ productId: number; name: string } | null>(null);
  const [newQty, setNewQty] = useState('');
  const [notes, setNotes] = useState('');

  const loadProducts = async () => {
    if (!warehouseId) return;
    setLoading(true);
    try {
      const res = await inventoryApi.getByWarehouse(Number(warehouseId));
      if (res.success) setProducts(res.data ?? []);
    } catch { toast.error('فشل التحميل'); }
    finally { setLoading(false); }
  };

  const doAdjust = async () => {
    if (!adjusting || !newQty) return;
    try {
      const res = await inventoryApi.adjust({ productId: adjusting.productId, warehouseId: Number(warehouseId), newQuantity: Number(newQty), notes: notes || undefined });
      if (res.success) { toast.success('تم التسوية'); setAdjusting(null); setNewQty(''); setNotes(''); loadProducts(); }
      else toast.error(res.errors?.join(', ') || 'خطأ');
    } catch { toast.error('فشل'); }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">المخزن</label>
          <select value={warehouseId} onChange={e => { setWarehouseId(e.target.value); setProducts([]); }}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500">
            <option value="">اختر المخزن</option>
            {(warehouses ?? []).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <button onClick={loadProducts} disabled={loading || !warehouseId}
          className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50">
          {loading ? 'جارٍ...' : 'عرض الأصناف'}
        </button>
      </div>

      {products.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead><tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الصنف</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الباركود</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الرصيد الحالي</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">إجراء</th>
              </tr></thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                    <td className="py-3 px-4 text-xs text-gray-400 font-mono">{p.barcode ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-bold ${p.currentStock <= p.minStock ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                        {p.currentStock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => { setAdjusting({ productId: p.id, name: p.name }); setNewQty(String(p.currentStock)); }}
                        className="px-3 py-1.5 text-xs bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900 transition font-medium">
                        <Sliders size={12} className="inline ml-1" /> تسوية
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjusting && (
        <Modal open onClose={() => setAdjusting(null)} title={`تسوية: ${adjusting.name}`}>
          <div className="space-y-4 p-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الكمية الجديدة</label>
              <input type="number" value={newQty} onChange={e => setNewQty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ملاحظات (اختياري)</label>
              <input value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
                placeholder="مثال: تسوية جرد فعلي" />
            </div>
            <div className="flex gap-3">
              <button onClick={doAdjust} className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition">تسوية</button>
              <button onClick={() => setAdjusting(null)} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Transfer Tab ────────────────────────────────
function TransferTab() {
  const { data: warehouses } = useWarehouses();
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<{ productId: number; name: string; qty: number; available: number }[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const loadFromProducts = async () => {
    if (!fromId) return;
    setLoading(true);
    try {
      const res = await inventoryApi.getByWarehouse(Number(fromId));
      if (res.success) setProducts((res.data ?? []).filter((p: any) => p.currentStock > 0));
    } catch { toast.error('فشل التحميل'); }
    finally { setLoading(false); }
  };

  const addItem = (p: any) => {
    if (items.some(i => i.productId === p.id)) return toast.error('الصنف مضاف بالفعل');
    setItems(prev => [...prev, { productId: p.id, name: p.name, qty: 1, available: p.currentStock }]);
  };

  const removeItem = (productId: number) => setItems(prev => prev.filter(i => i.productId !== productId));
  const updateQty = (productId: number, qty: number) => setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));

  const doTransfer = async () => {
    if (!fromId || !toId || items.length === 0) return toast.error('أكمل البيانات');
    if (fromId === toId) return toast.error('لا يمكن التحويل لنفس المخزن');
    for (const item of items) {
      if (item.qty <= 0 || item.qty > item.available) return toast.error(`كمية ${item.name} غير صالحة`);
    }
    setTransferring(true);
    try {
      const res = await (await import('@/lib/api/client')).apiClient.post('/warehouses/transfer', {
        fromWarehouseId: Number(fromId),
        toWarehouseId: Number(toId),
        notes: notes || undefined,
        items: items.map(i => ({ productId: i.productId, quantity: i.qty })),
      }).then(r => r.data);
      if (res.success) { toast.success('تم التحويل بنجاح'); setItems([]); setNotes(''); loadFromProducts(); }
      else toast.error(res.errors?.join(', ') || 'خطأ');
    } catch { toast.error('فشل التحويل'); }
    finally { setTransferring(false); }
  };

  return (
    <div className="space-y-4">
      {/* From/To Selection */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">من مخزن</label>
            <select value={fromId} onChange={e => { setFromId(e.target.value); setProducts([]); setItems([]); }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500">
              <option value="">اختر المخزن المصدر</option>
              {(warehouses ?? []).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">إلى مخزن</label>
            <select value={toId} onChange={e => setToId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500">
              <option value="">اختر المخزن الوجهة</option>
              {(warehouses ?? []).filter((w: any) => String(w.id) !== fromId).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>
        {fromId && (
          <button onClick={loadFromProducts} disabled={loading} className="mt-3 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50">
            {loading ? 'جارٍ...' : 'عرض أصناف المخزن المصدر'}
          </button>
        )}
      </div>

      {/* Available Products */}
      {products.length > 0 && (
        <div className="card p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">اختر الأصناف للتحويل</h4>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {products.map((p: any) => (
              <button key={p.id} onClick={() => addItem(p)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                  items.some(i => i.productId === p.id) ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                {p.name} <span className="text-gray-400 mr-1">({p.currentStock})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Items */}
      {items.length > 0 && (
        <div className="card p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">أصناف التحويل</h4>
          {items.map(item => (
            <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
              <span className="text-xs text-gray-400">متاح: {item.available}</span>
              <input type="number" min="1" max={item.available} value={item.qty}
                onChange={e => updateQty(item.productId, Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm text-center outline-none" dir="ltr" />
              <button onClick={() => removeItem(item.productId)} className="p-1 text-red-400 hover:text-red-600"><X size={16} /></button>
            </div>
          ))}
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات (اختياري)"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" />
          <button onClick={doTransfer} disabled={transferring || !toId}
            className="w-full py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition disabled:opacity-50">
            {transferring ? 'جارٍ التحويل...' : `تحويل ${items.length} صنف`}
          </button>
        </div>
      )}
    </div>
  );
}
