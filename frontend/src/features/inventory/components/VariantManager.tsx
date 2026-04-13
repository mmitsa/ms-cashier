import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, Save, Loader2, X, Settings2, Table2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import { productVariantsApi } from '@/lib/api/endpoints';
import type {
  ProductDto, ProductWithVariantsDto, ProductVariantDto,
  UpdateVariantRequest,
} from '@/types/api.types';

// ── Types ───────────────────────────────────────────────────────────────────

type OptionDraft = {
  name: string;
  values: string[];
};

type VariantEdit = {
  id: number;
  sku: string;
  barcode: string;
  costPrice: string;
  retailPrice: string;
  halfWholesalePrice: string;
  wholesalePrice: string;
  isActive: boolean;
  dirty: boolean;
};

type Tab = 'options' | 'variants';

// ── Props ───────────────────────────────────────────────────────────────────

interface VariantManagerProps {
  open: boolean;
  onClose: () => void;
  product: ProductDto;
}

// ── Component ───────────────────────────────────────────────────────────────

export function VariantManager({ open, onClose, product }: VariantManagerProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('options');

  // ── Fetch existing variants ───────────────────────────────────────────────
  const {
    data: variantData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product-variants', product.id],
    queryFn: () => productVariantsApi.getProductVariants(product.id),
    enabled: open,
    select: (res) => res.data,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['product-variants', product.id] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, [queryClient, product.id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`متغيرات المنتج: ${product.name}`}
      size="xl"
      className="!max-w-4xl"
    >
      <div dir="rtl" className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          <button
            onClick={() => setTab('options')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              tab === 'options'
                ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
            )}
          >
            <Settings2 size={16} />
            خيارات المتغيرات
          </button>
          <button
            onClick={() => setTab('variants')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              tab === 'variants'
                ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
            )}
          >
            <Table2 size={16} />
            جدول المتغيرات
            {variantData?.variants && variantData.variants.length > 0 && (
              <Badge variant="info">{variantData.variants.length}</Badge>
            )}
          </button>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-brand-500" size={32} />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-12 text-red-400">
            <AlertCircle size={40} />
            <p className="mt-2 text-sm">خطأ في تحميل بيانات المتغيرات</p>
          </div>
        )}

        {!isLoading && !isError && tab === 'options' && (
          <OptionsEditor
            product={product}
            variantData={variantData ?? null}
            onSaved={() => {
              invalidate();
              setTab('variants');
            }}
          />
        )}

        {!isLoading && !isError && tab === 'variants' && (
          <VariantsTable
            product={product}
            variantData={variantData ?? null}
            onUpdated={invalidate}
          />
        )}
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Options Editor
// ═══════════════════════════════════════════════════════════════════════════

function OptionsEditor({
  product,
  variantData,
  onSaved,
}: {
  product: ProductDto;
  variantData: ProductWithVariantsDto | null;
  onSaved: () => void;
}) {
  const [options, setOptions] = useState<OptionDraft[]>(() => {
    if (variantData?.options && variantData.options.length > 0) {
      return variantData.options.map((o) => ({
        name: o.name,
        values: o.values.map((v) => v.value),
      }));
    }
    return [{ name: '', values: [''] }];
  });

  const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({});
  const [defaultCostPrice, setDefaultCostPrice] = useState(String(product.costPrice));
  const [defaultRetailPrice, setDefaultRetailPrice] = useState(String(product.retailPrice));

  const setOptionsMutation = useMutation({
    mutationFn: () =>
      productVariantsApi.setOptions({
        productId: product.id,
        options: options
          .filter((o) => o.name.trim() && o.values.some((v) => v.trim()))
          .map((o) => ({
            name: o.name.trim(),
            values: o.values.filter((v) => v.trim()),
          })),
      }),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      productVariantsApi.generate({
        productId: product.id,
        defaultCostPrice: Number(defaultCostPrice) || 0,
        defaultRetailPrice: Number(defaultRetailPrice) || 0,
      }),
  });

  const handleSave = async () => {
    const validOptions = options.filter(
      (o) => o.name.trim() && o.values.some((v) => v.trim()),
    );
    if (validOptions.length === 0) {
      toast.error('أضف خيار واحد على الأقل مع قيم');
      return;
    }

    try {
      await setOptionsMutation.mutateAsync();
      await generateMutation.mutateAsync();
      toast.success('تم حفظ الخيارات وتوليد المتغيرات بنجاح');
      onSaved();
    } catch {
      toast.error('حدث خطأ أثناء حفظ الخيارات');
    }
  };

  const addOption = () => {
    setOptions((prev) => [...prev, { name: '', values: [''] }]);
  };

  const removeOption = (idx: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateOptionName = (idx: number, name: string) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, name } : o)));
  };

  const addValue = (optIdx: number) => {
    const val = (newValueInputs[optIdx] ?? '').trim();
    if (!val) return;
    setOptions((prev) =>
      prev.map((o, i) =>
        i === optIdx ? { ...o, values: [...o.values, val] } : o,
      ),
    );
    setNewValueInputs((prev) => ({ ...prev, [optIdx]: '' }));
  };

  const removeValue = (optIdx: number, valIdx: number) => {
    setOptions((prev) =>
      prev.map((o, i) =>
        i === optIdx
          ? { ...o, values: o.values.filter((_, vi) => vi !== valIdx) }
          : o,
      ),
    );
  };

  const isSaving = setOptionsMutation.isPending || generateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Option rows */}
      {options.map((option, optIdx) => (
        <div
          key={optIdx}
          className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3"
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="اسم الخيار (مثال: الحجم، اللون)"
              value={option.name}
              onChange={(e) => updateOptionName(optIdx, e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {options.length > 1 && (
              <button
                onClick={() => removeOption(optIdx)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Values chips */}
          <div className="flex flex-wrap gap-2">
            {option.values
              .filter((v) => v.trim())
              .map((val, valIdx) => (
                <span
                  key={valIdx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium border border-brand-200 dark:border-brand-800"
                >
                  {val}
                  <button
                    onClick={() => removeValue(optIdx, valIdx)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
          </div>

          {/* Add value input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="أضف قيمة جديدة..."
              value={newValueInputs[optIdx] ?? ''}
              onChange={(e) =>
                setNewValueInputs((prev) => ({
                  ...prev,
                  [optIdx]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addValue(optIdx);
                }
              }}
              className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={() => addValue(optIdx)}
              className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 rounded-lg transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      ))}

      {/* Add option */}
      <button
        onClick={addOption}
        className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
      >
        <Plus size={16} />
        إضافة خيار جديد
      </button>

      {/* Default prices */}
      <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            سعر التكلفة الافتراضي
          </label>
          <input
            type="number"
            value={defaultCostPrice}
            onChange={(e) => setDefaultCostPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            سعر البيع الافتراضي
          </label>
          <input
            type="number"
            value={defaultRetailPrice}
            onChange={(e) => setDefaultRetailPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          حفظ وتوليد المتغيرات
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Variants Table
// ═══════════════════════════════════════════════════════════════════════════

function VariantsTable({
  variantData,
  onUpdated,
}: {
  product: ProductDto;
  variantData: ProductWithVariantsDto | null;
  onUpdated: () => void;
}) {
  const variants = variantData?.variants ?? [];
  const [edits, setEdits] = useState<Record<number, VariantEdit>>({});

  const initEdit = (v: ProductVariantDto): VariantEdit => ({
    id: v.id,
    sku: v.sku ?? '',
    barcode: v.barcode ?? '',
    costPrice: String(v.costPrice),
    retailPrice: String(v.retailPrice),
    halfWholesalePrice: String(v.halfWholesalePrice ?? ''),
    wholesalePrice: String(v.wholesalePrice ?? ''),
    isActive: v.isActive,
    dirty: false,
  });

  const getEdit = (v: ProductVariantDto): VariantEdit =>
    edits[v.id] ?? initEdit(v);

  const setField = (
    variantId: number,
    field: keyof VariantEdit,
    value: string | boolean,
  ) => {
    setEdits((prev) => {
      const current = prev[variantId] ?? initEdit(variants.find((v) => v.id === variantId)!);
      return {
        ...prev,
        [variantId]: { ...current, [field]: value, dirty: true },
      };
    });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVariantRequest }) =>
      productVariantsApi.update(id, data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productVariantsApi.delete(id),
    onSuccess: () => {
      toast.success('تم حذف المتغير');
      onUpdated();
    },
    onError: () => toast.error('فشل حذف المتغير'),
  });

  const handleSaveAll = async () => {
    const dirtyEdits = Object.values(edits).filter((e) => e.dirty);
    if (dirtyEdits.length === 0) {
      toast('لا توجد تعديلات لحفظها');
      return;
    }

    try {
      await Promise.all(
        dirtyEdits.map((e) =>
          updateMutation.mutateAsync({
            id: e.id,
            data: {
              sku: e.sku || undefined,
              barcode: e.barcode || undefined,
              costPrice: Number(e.costPrice) || 0,
              retailPrice: Number(e.retailPrice) || 0,
              halfWholesalePrice: e.halfWholesalePrice ? Number(e.halfWholesalePrice) : undefined,
              wholesalePrice: e.wholesalePrice ? Number(e.wholesalePrice) : undefined,
              isActive: e.isActive,
            },
          }),
        ),
      );
      toast.success(`تم تحديث ${dirtyEdits.length} متغير بنجاح`);
      setEdits({});
      onUpdated();
    } catch {
      toast.error('حدث خطأ أثناء تحديث المتغيرات');
    }
  };

  const dirtyCount = Object.values(edits).filter((e) => e.dirty).length;

  if (variants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
        <Table2 size={40} strokeWidth={1} />
        <p className="mt-3 text-sm font-medium">لا توجد متغيرات</p>
        <p className="text-xs mt-1">قم بإضافة خيارات أولاً من تبويب "خيارات المتغيرات"</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              <th className="px-3 py-2.5 text-right font-medium">المتغير</th>
              <th className="px-3 py-2.5 text-right font-medium">SKU</th>
              <th className="px-3 py-2.5 text-right font-medium">باركود</th>
              <th className="px-3 py-2.5 text-right font-medium">التكلفة</th>
              <th className="px-3 py-2.5 text-right font-medium">البيع</th>
              <th className="px-3 py-2.5 text-center font-medium">المخزون</th>
              <th className="px-3 py-2.5 text-center font-medium">الحالة</th>
              <th className="px-3 py-2.5 text-center font-medium w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {variants.map((v) => {
              const edit = getEdit(v);
              return (
                <tr
                  key={v.id}
                  className={cn(
                    'transition-colors',
                    edit.dirty
                      ? 'bg-amber-50/50 dark:bg-amber-950/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  )}
                >
                  <td className="px-3 py-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {v.displayName || v.variantCombination}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={edit.sku}
                      onChange={(e) => setField(v.id, 'sku', e.target.value)}
                      placeholder="—"
                      className="w-24 px-2 py-1 text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={edit.barcode}
                      onChange={(e) => setField(v.id, 'barcode', e.target.value)}
                      placeholder="—"
                      className="w-28 px-2 py-1 text-xs font-mono bg-transparent border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={edit.costPrice}
                      onChange={(e) => setField(v.id, 'costPrice', e.target.value)}
                      className="w-20 px-2 py-1 text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={edit.retailPrice}
                      onChange={(e) => setField(v.id, 'retailPrice', e.target.value)}
                      className="w-20 px-2 py-1 text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant={v.currentStock <= 0 ? 'danger' : 'success'}>
                      {v.currentStock}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => setField(v.id, 'isActive', !edit.isActive)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                        edit.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400',
                      )}
                    >
                      {edit.isActive ? 'فعال' : 'معطل'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => deleteMutation.mutate(v.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {variants.length} متغير
          {dirtyCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 mr-2">
              ({dirtyCount} تعديل غير محفوظ)
            </span>
          )}
        </p>
        <button
          onClick={handleSaveAll}
          disabled={dirtyCount === 0 || updateMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {updateMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          حفظ التعديلات
        </button>
      </div>
    </div>
  );
}
