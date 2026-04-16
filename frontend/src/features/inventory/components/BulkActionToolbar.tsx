import { useState } from 'react';
import { Trash2, Tags, ToggleLeft, DollarSign, Download, X, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { CategoryDto, ProductDto } from '@/types/api.types';
import { cn } from '@/lib/utils/cn';

type BulkActionToolbarProps = {
  selectedCount: number;
  categories: CategoryDto[];
  products: ProductDto[];
  selectedIds: Set<number>;
  onClearSelection: () => void;
  onBulkDelete: (ids: number[]) => void;
  onBulkChangeCategory: (ids: number[], categoryId: number) => void;
  onBulkToggleActive: (ids: number[], isActive: boolean) => void;
  onBulkUpdatePrices: (ids: number[], costPrice?: number, retailPrice?: number) => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
};

export function BulkActionToolbar({
  selectedCount,
  categories,
  products,
  selectedIds,
  onClearSelection,
  onBulkDelete,
  onBulkChangeCategory,
  onBulkToggleActive,
  onBulkUpdatePrices,
  isDeleting,
  isUpdating,
}: BulkActionToolbarProps) {
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [bulkCostPrice, setBulkCostPrice] = useState('');
  const [bulkRetailPrice, setBulkRetailPrice] = useState('');

  if (selectedCount === 0) return null;

  const ids = Array.from(selectedIds);

  const handleExportCsv = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    const headers = ['ID', 'الباركود', 'الاسم', 'التصنيف', 'التكلفة', 'سعر البيع', 'الكمية', 'الحالة'];
    const rows = selected.map((p) => [
      p.id,
      p.barcode || '',
      p.name,
      p.categoryName || '',
      p.costPrice,
      p.retailPrice,
      p.currentStock,
      p.isActive ? 'نشط' : 'معطل',
    ]);

    const bom = '\uFEFF';
    const csv = bom + [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePriceSubmit = () => {
    const cost = bulkCostPrice ? Number(bulkCostPrice) : undefined;
    const retail = bulkRetailPrice ? Number(bulkRetailPrice) : undefined;
    if (cost === undefined && retail === undefined) return;
    onBulkUpdatePrices(ids, cost, retail);
    setShowPriceModal(false);
    setBulkCostPrice('');
    setBulkRetailPrice('');
  };

  return (
    <>
      <div
        className={cn(
          'sticky top-0 z-20 flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl',
          'bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800',
          'shadow-lg animate-in slide-in-from-top-2 duration-300',
        )}
        dir="rtl"
      >
        <span className="text-sm font-semibold text-brand-800 dark:text-brand-200">
          تم اختيار {selectedCount} منتج
        </span>

        <div className="flex flex-wrap items-center gap-2 mr-auto">
          <button
            onClick={() => onBulkDelete(ids)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            حذف ({selectedCount})
          </button>

          <div className="relative">
            <button
              onClick={() => setShowCategoryPicker(!showCategoryPicker)}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Tags size={14} />}
              تغيير الفئة
            </button>
            {showCategoryPicker && (
              <div className="absolute top-full mt-1 right-0 w-48 max-h-48 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onBulkChangeCategory(ids, c.id);
                      setShowCategoryPicker(false);
                    }}
                    className="w-full text-right px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onBulkToggleActive(ids, true)}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <ToggleLeft size={14} />
            تفعيل
          </button>

          <button
            onClick={() => onBulkToggleActive(ids, false)}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-500 text-white hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <ToggleLeft size={14} />
            تعطيل
          </button>

          <button
            onClick={() => setShowPriceModal(true)}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            <DollarSign size={14} />
            تحديث الأسعار
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Download size={14} />
            تصدير CSV ({selectedCount})
          </button>
        </div>

        <button
          onClick={onClearSelection}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="إلغاء الاختيار"
        >
          <X size={16} />
        </button>
      </div>

      <Modal
        open={showPriceModal}
        onClose={() => {
          setShowPriceModal(false);
          setBulkCostPrice('');
          setBulkRetailPrice('');
        }}
        title="تحديث الأسعار"
        size="sm"
      >
        <div className="space-y-4" dir="rtl">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            تحديث الأسعار لـ {selectedCount} منتج. اترك الحقل فارغا لعدم التغيير.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              سعر التكلفة
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={bulkCostPrice}
              onChange={(e) => setBulkCostPrice(e.target.value)}
              placeholder="اتركه فارغا لعدم التغيير"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              سعر البيع
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={bulkRetailPrice}
              onChange={(e) => setBulkRetailPrice(e.target.value)}
              placeholder="اتركه فارغا لعدم التغيير"
              className="input"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setShowPriceModal(false);
                setBulkCostPrice('');
                setBulkRetailPrice('');
              }}
              className="btn-secondary"
            >
              إلغاء
            </button>
            <button
              onClick={handlePriceSubmit}
              disabled={!bulkCostPrice && !bulkRetailPrice}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              تحديث
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
