import { useState, useMemo } from 'react';
import { Save, Search, Package } from 'lucide-react';
import { useProducts, useWarehouses } from '@/hooks/useApi';
import { stockCountApi } from '@/lib/api/endpoints';
import { formatCurrency } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import type { BulkOpeningBalanceRow } from '@/types/api.types';

export function OpeningBalancesTab() {
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: warehouses = [] } = useWarehouses();
  const { data: productsData } = useProducts({ pageSize: 500 });
  const products = productsData?.items ?? [];

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      p => p.name.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q)
    );
  }, [products, search]);

  function handleQtyChange(productId: number, value: string) {
    setQuantities(prev => ({ ...prev, [productId]: value }));
  }

  async function handleSave() {
    if (!warehouseId) {
      toast.error('اختر المخزن أولاً');
      return;
    }

    const items: BulkOpeningBalanceRow[] = Object.entries(quantities)
      .filter(([, v]) => v !== '' && Number(v) >= 0)
      .map(([pid, qty]) => ({
        productId: Number(pid),
        warehouseId: warehouseId as number,
        quantity: Number(qty),
      }));

    if (items.length === 0) {
      toast.error('أدخل كمية لصنف واحد على الأقل');
      return;
    }

    setSaving(true);
    try {
      const res = await stockCountApi.setOpeningBalances({ items, notes: 'رصيد افتتاحي' });
      toast.success(res.message ?? `تم تحديث ${items.length} صنف`);
      setQuantities({});
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] ?? 'فشل في حفظ الأرصدة');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">الأرصدة الافتتاحية</h3>
          <p className="text-sm text-gray-500">أدخل كمية المخزون الأولية لكل صنف عند بدء استخدام النظام</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !warehouseId || Object.keys(quantities).length === 0}
          className="btn-primary"
        >
          <Save size={16} />
          {saving ? 'جارٍ الحفظ...' : 'حفظ الأرصدة'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={warehouseId}
          onChange={e => setWarehouseId(e.target.value ? Number(e.target.value) : '')}
          className="input w-full sm:w-56"
        >
          <option value="">اختر المخزن...</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الباركود..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pr-10 w-full"
          />
        </div>
      </div>

      {!warehouseId ? (
        <div className="text-center py-12 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p>اختر المخزن لعرض الأصناف</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">الباركود</th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">الصنف</th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">الرصيد الحالي</th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">التكلفة</th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500 w-40">الرصيد الافتتاحي</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2 px-4 text-sm font-mono text-gray-500">{p.barcode || '—'}</td>
                  <td className="py-2 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                  <td className="py-2 px-4 text-sm text-gray-600">{p.currentStock}</td>
                  <td className="py-2 px-4 text-sm text-gray-600">{formatCurrency(p.costPrice)}</td>
                  <td className="py-2 px-4">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={quantities[p.id] ?? ''}
                      onChange={e => handleQtyChange(p.id, e.target.value)}
                      placeholder={String(p.currentStock)}
                      className="input w-full text-sm py-1 text-center"
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">لا توجد أصناف</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
