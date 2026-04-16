import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowRightLeft, FolderTree, Package, Check, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils/cn';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useProducts,
  useMoveProducts,
} from '@/hooks/useApi';
import type { CategoryDto, ProductDto } from '@/types/api.types';
import toast from 'react-hot-toast';

export function CategoryManagement({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categories = [] } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const moveProducts = useMoveProducts();

  const { data: productsData } = useProducts(
    selectedCategory ? { categoryId: selectedCategory.id, pageSize: 200 } : { pageSize: 0 }
  );
  const products = selectedCategory ? (productsData?.items ?? []) : [];

  function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    createCategory.mutate({ name }, {
      onSuccess: () => setNewCategoryName(''),
    });
  }

  function handleUpdateCategory() {
    if (!editingCategory) return;
    const name = editingCategory.name.trim();
    if (!name) return;
    updateCategory.mutate(
      { id: editingCategory.id, data: { name } },
      { onSuccess: () => setEditingCategory(null) }
    );
  }

  function handleDeleteCategory(cat: CategoryDto) {
    if (cat.productCount > 0) {
      toast.error(`لا يمكن حذف "${cat.name}" — يحتوي على ${cat.productCount} صنف. انقل الأصناف أولاً.`);
      return;
    }
    if (!confirm(`حذف التصنيف "${cat.name}"؟`)) return;
    deleteCategory.mutate(cat.id, {
      onSuccess: () => {
        if (selectedCategory?.id === cat.id) setSelectedCategory(null);
      },
    });
  }

  function toggleProductSelection(id: number) {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedProductIds.size === products.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(products.map(p => p.id)));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="إدارة التصنيفات والأصناف" size="xl">
      <div className="flex flex-col lg:flex-row gap-4 min-h-[500px]">

        {/* Sidebar: Categories */}
        <div className="w-full lg:w-72 shrink-0 border-l border-gray-200 dark:border-gray-700 lg:pl-4">
          <div className="flex items-center gap-2 mb-3">
            <FolderTree size={18} className="text-brand-600" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">التصنيفات</h3>
          </div>

          {/* Add Category */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="تصنيف جديد..."
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
              className="input flex-1 text-sm"
            />
            <button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || createCategory.isPending}
              className="btn-primary px-3"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Category List */}
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {categories.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">لا توجد تصنيفات</p>
            )}
            {categories.map(cat => (
              <div key={cat.id}>
                {editingCategory?.id === cat.id ? (
                  <div className="flex gap-1 items-center">
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()}
                      className="input flex-1 text-sm py-1"
                      autoFocus
                    />
                    <button onClick={handleUpdateCategory} className="p-1 text-green-600 hover:bg-green-50 rounded">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingCategory(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => { setSelectedCategory(cat); setSelectedProductIds(new Set()); }}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group',
                      selectedCategory?.id === cat.id
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <span className="text-sm font-medium truncate">{cat.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400 ml-2">{cat.productCount}</span>
                      <button
                        onClick={e => { e.stopPropagation(); setEditingCategory({ id: cat.id, name: cat.name }); }}
                        className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600 rounded transition-opacity"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteCategory(cat); }}
                        className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 rounded transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main: Products in selected category */}
        <div className="flex-1">
          {!selectedCategory ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Package size={48} className="mx-auto mb-3 opacity-50" />
                <p>اختر تصنيفاً لعرض أصنافه</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  أصناف "{selectedCategory.name}" ({products.length})
                </h3>
                {selectedProductIds.size > 0 && (
                  <button
                    onClick={() => setShowMoveModal(true)}
                    className="btn-secondary text-sm"
                  >
                    <ArrowRightLeft size={16} />
                    نقل {selectedProductIds.size} صنف
                  </button>
                )}
              </div>

              {products.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">لا توجد أصناف في هذا التصنيف</p>
              ) : (
                <div className="overflow-y-auto max-h-[420px] border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full">
                    <thead className="sticky top-0">
                      <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <th className="py-2 px-3 text-right">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.size === products.length && products.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500">الباركود</th>
                        <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500">الاسم</th>
                        <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500">المخزون</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr
                          key={product.id}
                          className={cn(
                            'border-b border-gray-100 dark:border-gray-800 transition-colors cursor-pointer',
                            selectedProductIds.has(product.id)
                              ? 'bg-brand-50/50 dark:bg-brand-900/10'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          )}
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.has(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              onClick={e => e.stopPropagation()}
                              className="rounded"
                            />
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-500 font-mono">{product.barcode || '—'}</td>
                          <td className="py-2 px-3 text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</td>
                          <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">{product.currentStock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Move Products Modal */}
      {showMoveModal && selectedCategory && (
        <MoveProductsModal
          open={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          sourceCategoryId={selectedCategory.id}
          sourceCategoryName={selectedCategory.name}
          productIds={Array.from(selectedProductIds)}
          categories={categories.filter(c => c.id !== selectedCategory.id)}
          onMoved={() => {
            setSelectedProductIds(new Set());
            setShowMoveModal(false);
          }}
        />
      )}
    </Modal>
  );
}

function MoveProductsModal({
  open, onClose, sourceCategoryId, sourceCategoryName, productIds, categories, onMoved,
}: {
  open: boolean;
  onClose: () => void;
  sourceCategoryId: number;
  sourceCategoryName: string;
  productIds: number[];
  categories: CategoryDto[];
  onMoved: () => void;
}) {
  const [targetId, setTargetId] = useState<number | ''>('');
  const moveProducts = useMoveProducts();

  function handleMove() {
    if (!targetId) return;
    moveProducts.mutate(
      { sourceCategoryId, data: { targetCategoryId: targetId as number, productIds } },
      { onSuccess: () => onMoved() }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="نقل أصناف" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          نقل <strong>{productIds.length}</strong> صنف من "{sourceCategoryName}" إلى:
        </p>
        <select
          value={targetId}
          onChange={e => setTargetId(e.target.value ? Number(e.target.value) : '')}
          className="input w-full"
        >
          <option value="">اختر التصنيف المستهدف...</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.productCount} صنف)</option>
          ))}
        </select>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ملاحظة: الصنف يكون في تصنيف واحد فقط — النقل يزيله من التصنيف الحالي.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
          <button
            onClick={handleMove}
            disabled={!targetId || moveProducts.isPending}
            className="btn-primary"
          >
            <ArrowRightLeft size={16} />
            {moveProducts.isPending ? 'جارٍ النقل...' : 'نقل'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
