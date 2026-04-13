import { useState } from 'react';
import {
  Warehouse, ArrowLeftRight, Plus, X, Loader2, AlertCircle,
  MapPin, Package, Search, Trash2,
} from 'lucide-react';
import {
  useWarehouses, useCreateWarehouse, useTransferStock, useProducts,
} from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils/cn';
import type { WarehouseDto, ProductDto } from '@/types/api.types';

export function WarehousesScreen() {
  const { data: warehouses, isLoading, isError, refetch } = useWarehouses();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">المخازن</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة المخازن ونقل البضاعة</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTransferModal(true)} className="btn-secondary shrink-0">
            <ArrowLeftRight size={18} />
            نقل بين المخازن
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary shrink-0">
            <Plus size={18} />
            إضافة مخزن
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-12 text-red-500">
          <AlertCircle size={40} />
          <p className="font-semibold">حدث خطأ أثناء تحميل المخازن</p>
          <button onClick={() => refetch()} className="btn-secondary text-sm">إعادة المحاولة</button>
        </div>
      ) : (warehouses ?? []).length === 0 ? (
        <div className="card p-12 text-center">
          <Warehouse size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد مخازن بعد</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-4">
            <Plus size={18} />
            إنشاء أول مخزن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(warehouses ?? []).map((warehouse) => (
            <WarehouseCard key={warehouse.id} warehouse={warehouse} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateWarehouseModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferStockModal
          warehouses={warehouses ?? []}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  );
}

// ==================== Warehouse Card ====================

function WarehouseCard({ warehouse }: { warehouse: WarehouseDto }) {
  return (
    <div className="card p-5 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
          <Warehouse size={24} className="text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{warehouse.name}</p>
            {warehouse.isMain && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium">
                رئيسي
              </span>
            )}
          </div>
          {warehouse.location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={14} className="text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{warehouse.location}</p>
            </div>
          )}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <Package size={14} className="text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{warehouse.totalItems} صنف</span>
            </div>
            <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
              {formatCurrency(warehouse.totalValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Create Warehouse Modal ====================

function CreateWarehouseModal({ onClose }: { onClose: () => void }) {
  const createWarehouse = useCreateWarehouse();
  const [form, setForm] = useState({
    name: '',
    location: '',
    isMain: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createWarehouse.mutate(form, { onSuccess: () => onClose() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">إنشاء مخزن جديد</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              اسم المخزن <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
              placeholder="مثال: المخزن الرئيسي"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الموقع</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 outline-none text-sm"
              placeholder="مثال: الإسكندرية - سموحة"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isMain}
              onChange={(e) => setForm((p) => ({ ...p, isMain: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">مخزن رئيسي</span>
          </label>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              disabled={createWarehouse.isPending || !form.name.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {createWarehouse.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              إنشاء المخزن
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== Transfer Stock Modal ====================

interface TransferItem {
  productId: number;
  productName: string;
  quantity: number;
}

function TransferStockModal({
  warehouses,
  onClose,
}: {
  warehouses: WarehouseDto[];
  onClose: () => void;
}) {
  const transferStock = useTransferStock();
  const [fromWarehouseId, setFromWarehouseId] = useState<number>(warehouses[0]?.id ?? 0);
  const [toWarehouseId, setToWarehouseId] = useState<number>(warehouses[1]?.id ?? 0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);

  // Product search for adding items
  const [productSearch, setProductSearch] = useState('');
  const { data: productsData } = useProducts({
    searchTerm: productSearch || undefined,
    pageSize: 10,
  });
  const products = productsData?.items ?? [];

  const addItem = (product: ProductDto) => {
    if (items.some((it) => it.productId === product.id)) return;
    setItems((prev) => [...prev, { productId: product.id, productName: product.name, quantity: 1 }]);
    setProductSearch('');
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const updateItemQty = (productId: number, qty: number) => {
    setItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, quantity: Math.max(1, qty) } : it))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || fromWarehouseId === toWarehouseId) return;
    transferStock.mutate(
      {
        fromWarehouseId,
        toWarehouseId,
        notes: notes || undefined,
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">نقل بضاعة بين المخازن</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">من مخزن</label>
              <select
                value={fromWarehouseId}
                onChange={(e) => setFromWarehouseId(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 outline-none text-sm"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">إلى مخزن</label>
              <select
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 outline-none text-sm"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {fromWarehouseId === toWarehouseId && (
            <p className="text-sm text-red-500">يجب اختيار مخازن مختلفة</p>
          )}

          {/* Product Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">إضافة أصناف</label>
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 outline-none text-sm"
                placeholder="ابحث عن صنف..."
              />
            </div>
            {productSearch && products.length > 0 && (
              <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-xl max-h-40 overflow-y-auto bg-white dark:bg-gray-800 shadow-lg">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItem(p)}
                    disabled={items.some((it) => it.productId === p.id)}
                    className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0 disabled:opacity-40"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-gray-400 mr-2">({p.currentStock} متاح)</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Items */}
          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">الأصناف المختارة:</p>
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.productName}</span>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItemQty(item.productId, Number(e.target.value))}
                    className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 text-center text-sm focus:border-brand-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm resize-none"
              placeholder="ملاحظات اختيارية..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              disabled={transferStock.isPending || items.length === 0 || fromWarehouseId === toWarehouseId}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {transferStock.isPending ? <Loader2 size={18} className="animate-spin" /> : <ArrowLeftRight size={18} />}
              تنفيذ النقل
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
