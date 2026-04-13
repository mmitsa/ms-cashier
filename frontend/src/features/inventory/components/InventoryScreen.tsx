import { useState } from 'react';
import {
  Package,
  Layers,
  AlertTriangle,
  DollarSign,
  Plus,
  Printer,
  Upload,
  Search,
  Pencil,
  Barcode,
  Trash2,
  Settings2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, cn } from '@/lib/utils/cn';
import { printBarcodeLabels } from '@/lib/utils/printer';
import {
  useProducts,
  useCategories,
  useWarehouses,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useLowStockProducts,
} from '@/hooks/useApi';
import type { ProductDto, CreateProductRequest, UpdateProductRequest } from '@/types/api.types';
import { StockManagementTabs } from './StockManagementTabs';
import { CsvImportModal } from './CsvImportModal';
import { VariantManager } from './VariantManager';

type StockStatus = 'low' | 'medium' | 'ok';

function getStockStatus(product: ProductDto): StockStatus {
  if (product.currentStock < product.minStock) return 'low';
  if (product.currentStock < product.minStock * 1.5) return 'medium';
  return 'ok';
}

function getStockStatusLabel(status: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    low: 'منخفض',
    medium: 'متوسط',
    ok: 'جيد',
  };
  return labels[status];
}

function getStockStatusVariant(status: StockStatus): 'danger' | 'warning' | 'success' {
  const variants: Record<StockStatus, 'danger' | 'warning' | 'success'> = {
    low: 'danger',
    medium: 'warning',
    ok: 'success',
  };
  return variants[status];
}

interface ProductFormData {
  name: string;
  barcode: string;
  costPrice: string;
  retailPrice: string;
  wholesalePrice: string;
  minStock: string;
  initialStock: string;
  categoryId: string;
  warehouseId: string;
}

const initialFormData: ProductFormData = {
  name: '',
  barcode: '',
  costPrice: '',
  retailPrice: '',
  wholesalePrice: '',
  minStock: '5',
  initialStock: '0',
  categoryId: '',
  warehouseId: '',
};

function productToFormData(p: ProductDto): ProductFormData {
  return {
    name: p.name,
    barcode: p.barcode || '',
    costPrice: String(p.costPrice),
    retailPrice: String(p.retailPrice),
    wholesalePrice: String(p.wholesalePrice ?? p.retailPrice),
    minStock: String(p.minStock),
    initialStock: String(p.currentStock),
    categoryId: p.categoryId ? String(p.categoryId) : '',
    warehouseId: '',
  };
}

export function InventoryScreen() {
  const [view, setView] = useState<'products' | 'stock'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrintBarcodeModal, setShowPrintBarcodeModal] = useState(false);
  const [showVariantManager, setShowVariantManager] = useState(false);
  const [variantProduct, setVariantProduct] = useState<ProductDto | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductDto | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [printSelectedIds, setPrintSelectedIds] = useState<Set<number>>(new Set());

  const { data: productsData, isLoading: productsLoading } = useProducts({
    searchTerm: searchTerm || undefined,
    categoryId,
    lowStockOnly: lowStockOnly || undefined,
    page,
    pageSize,
  });

  const { data: categories = [] } = useCategories();
  const { data: warehouses = [] } = useWarehouses();
  const { data: lowStockProducts = [] } = useLowStockProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const products = productsData?.items ?? [];
  const paged = productsData
    ? {
        totalCount: productsData.totalCount,
        pageNumber: productsData.pageNumber,
        pageSize: productsData.pageSize,
        totalPages: productsData.totalPages,
        hasNextPage: productsData.hasNextPage,
        hasPreviousPage: productsData.hasPreviousPage,
      }
    : null;

  const lowStockCount = lowStockProducts.length;

  const stats = {
    totalProducts: paged?.totalCount ?? 0,
    totalStock: products.reduce((sum, p) => sum + p.currentStock, 0),
    lowStockCount,
    stockValue: products.reduce((sum, p) => sum + p.costPrice * p.currentStock, 0),
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const warehouseIdNum = formData.warehouseId ? Number(formData.warehouseId) : warehouses[0]?.id;
    if (!warehouseIdNum) return;

    const payload: CreateProductRequest = {
      name: formData.name,
      barcode: formData.barcode || undefined,
      categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
      costPrice: Number(formData.costPrice) || 0,
      retailPrice: Number(formData.retailPrice) || 0,
      wholesalePrice: formData.wholesalePrice ? Number(formData.wholesalePrice) : undefined,
      minStock: Number(formData.minStock) || 5,
      initialStock: Number(formData.initialStock) || 0,
      warehouseId: warehouseIdNum,
    };

    createProduct.mutate(payload, {
      onSuccess: () => {
        setFormData(initialFormData);
        setShowAddModal(false);
      },
    });
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const payload: UpdateProductRequest = {
      name: formData.name,
      barcode: formData.barcode || undefined,
      categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
      costPrice: Number(formData.costPrice) || 0,
      retailPrice: Number(formData.retailPrice) || 0,
      wholesalePrice: formData.wholesalePrice ? Number(formData.wholesalePrice) : undefined,
      minStock: Number(formData.minStock) || 5,
    };

    updateProduct.mutate(
      { id: editingProduct.id, data: payload },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setEditingProduct(null);
          setFormData(initialFormData);
        },
      }
    );
  };

  const handleDeleteProduct = () => {
    if (!deletingProduct) return;
    deleteProduct.mutate(deletingProduct.id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setDeletingProduct(null);
      },
    });
  };

  const openVariantManager = (product: ProductDto) => {
    setVariantProduct(product);
    setShowVariantManager(true);
  };

  const openEditModal = (product: ProductDto) => {
    setEditingProduct(product);
    setFormData(productToFormData(product));
    setShowEditModal(true);
  };

  const openDeleteModal = (product: ProductDto) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  const handlePrintBarcode = (product?: ProductDto) => {
    if (product) {
      const barcode = product.barcode || product.sku || `P${product.id}`;
      printBarcodeLabels([
        { barcode, name: product.name, price: product.retailPrice },
      ]);
    } else {
      setShowPrintBarcodeModal(true);
      setPrintSelectedIds(new Set());
    }
  };

  const togglePrintSelection = (id: number) => {
    setPrintSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrintSelected = () => {
    const toPrint = products.filter((p) => printSelectedIds.has(p.id));
    if (toPrint.length === 0) return;

    const labels = toPrint.map((p) => ({
      barcode: p.barcode || p.sku || `P${p.id}`,
      name: p.name,
      price: p.retailPrice,
    }));
    printBarcodeLabels(labels);
    setShowPrintBarcodeModal(false);
  };

  const handleImport = () => {
    setShowCsvModal(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Low Stock Alert Banner */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
          <AlertTriangle size={24} className="flex-shrink-0" />
          <div>
            <p className="font-semibold">تنبيه: {lowStockCount} صنف تحت الحد الأدنى للمخزون</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">يرجى مراجعة المخزون وإعادة الطلب</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">إدارة المخزون</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">عرض وإدارة أصناف المخزون والحركات</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={18} />
            إضافة صنف
          </button>
          <button onClick={() => handlePrintBarcode()} className="btn-secondary">
            <Printer size={18} />
            طباعة باركود
          </button>
          <button onClick={handleImport} className="btn-secondary">
            <Upload size={18} />
            استيراد
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button onClick={() => setView('products')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            view === 'products' ? 'bg-white dark:bg-gray-900 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'
          }`}>
          <Package size={16} /> الأصناف
        </button>
        <button onClick={() => setView('stock')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            view === 'stock' ? 'bg-white dark:bg-gray-900 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'
          }`}>
          <Layers size={16} /> إدارة المخزون والحركات
        </button>
      </div>

      {view === 'stock' && <StockManagementTabs />}

      {view === 'products' && <>
      {/* StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="إجمالي الأصناف"
          value={stats.totalProducts}
          color="bg-brand-600"
        />
        <StatCard
          icon={Layers}
          label="إجمالي الكمية"
          value={stats.totalStock}
          color="bg-blue-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="أصناف منخفضة"
          value={lowStockCount}
          color="bg-amber-500"
          sub="تحتاج إعادة طلب"
        />
        <StatCard
          icon={DollarSign}
          label="قيمة المخزون"
          value={formatCurrency(stats.stockValue)}
          color="bg-emerald-600"
        />
      </div>

      {/* Filters & Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="بحث بالاسم أو الباركود..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="input pr-10"
            />
          </div>
          <select
            value={categoryId ?? ''}
            onChange={(e) => {
              setCategoryId(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
            className="input w-full sm:w-48"
          >
            <option value="">كل التصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">منخفض المخزون فقط</span>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  الباركود
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  الاسم
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  التصنيف
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  التكلفة
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  التجزئة
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  الكمية
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {productsLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
                        {product.barcode || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {product.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {product.categoryName || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatCurrency(product.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatCurrency(product.retailPrice)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {product.currentStock}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStockStatusVariant(status)}>
                          {getStockStatusLabel(status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-600 transition-colors"
                            title="تعديل"
                            onClick={() => openEditModal(product)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-purple-600 transition-colors"
                            title="إدارة المتغيرات"
                            onClick={() => openVariantManager(product)}
                          >
                            <Settings2 size={16} />
                          </button>
                          <button
                            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-600 transition-colors"
                            title="طباعة باركود"
                            onClick={() => handlePrintBarcode(product)}
                          >
                            <Barcode size={16} />
                          </button>
                          <button
                            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 transition-colors"
                            title="حذف"
                            onClick={() => openDeleteModal(product)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!productsLoading && products.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            لا توجد أصناف تطابق البحث
          </div>
        )}

        {/* Pagination */}
        {paged && paged.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              عرض {products.length} من {paged.totalCount} صنف
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!paged.hasPreviousPage}
                className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                صفحة {paged.pageNumber} من {paged.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!paged.hasNextPage}
                className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      </>}

      {/* Add Product Modal */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(initialFormData);
        }}
        title="إضافة صنف جديد"
        size="lg"
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الصنف</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              placeholder="أدخل اسم الصنف"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الباركود</label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData((f) => ({ ...f, barcode: e.target.value }))}
              placeholder="اختياري"
              className="input"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التصنيف</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData((f) => ({ ...f, categoryId: e.target.value }))}
                className="input"
              >
                <option value="">اختر التصنيف</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المخزن</label>
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData((f) => ({ ...f, warehouseId: e.target.value }))}
                className="input"
                required
              >
                <option value="">اختر المخزن</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سعر التكلفة</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.costPrice}
                onChange={(e) => setFormData((f) => ({ ...f, costPrice: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سعر التجزئة</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.retailPrice}
                onChange={(e) => setFormData((f) => ({ ...f, retailPrice: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سعر الجملة</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.wholesalePrice}
                onChange={(e) => setFormData((f) => ({ ...f, wholesalePrice: e.target.value }))}
                className="input"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                الحد الأدنى للمخزون
              </label>
              <input
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData((f) => ({ ...f, minStock: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                الكمية الأولية
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.initialStock}
                onChange={(e) => setFormData((f) => ({ ...f, initialStock: e.target.value }))}
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setFormData(initialFormData);
              }}
              className="btn-secondary"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createProduct.isPending}
            >
              <Plus size={18} />
              {createProduct.isPending ? 'جاري الإضافة...' : 'إضافة'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingProduct(null);
          setFormData(initialFormData);
        }}
        title="تعديل الصنف"
        size="lg"
      >
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الصنف</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              placeholder="أدخل اسم الصنف"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الباركود</label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData((f) => ({ ...f, barcode: e.target.value }))}
              placeholder="اختياري"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التصنيف</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData((f) => ({ ...f, categoryId: e.target.value }))}
              className="input"
            >
              <option value="">اختر التصنيف</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سعر التكلفة</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.costPrice}
                onChange={(e) => setFormData((f) => ({ ...f, costPrice: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سعر التجزئة</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.retailPrice}
                onChange={(e) => setFormData((f) => ({ ...f, retailPrice: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سعر الجملة</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.wholesalePrice}
                onChange={(e) => setFormData((f) => ({ ...f, wholesalePrice: e.target.value }))}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الحد الأدنى للمخزون
            </label>
            <input
              type="number"
              min="0"
              value={formData.minStock}
              onChange={(e) => setFormData((f) => ({ ...f, minStock: e.target.value }))}
              className="input"
            />
          </div>
          {/* Variant Manager shortcut */}
          {editingProduct && (
            <button
              type="button"
              onClick={() => openVariantManager(editingProduct)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-950 transition-colors"
            >
              <Settings2 size={16} />
              إدارة المتغيرات
            </button>
          )}

          <div className="flex gap-2 pt-4 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingProduct(null);
                setFormData(initialFormData);
              }}
              className="btn-secondary"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={updateProduct.isPending}
            >
              {updateProduct.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingProduct(null);
        }}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            هل أنت متأكد من حذف الصنف &quot;{deletingProduct?.name}&quot;؟ لا يمكن التراجع عن هذا
            الإجراء.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingProduct(null);
              }}
              className="btn-secondary"
            >
              إلغاء
            </button>
            <button
              onClick={handleDeleteProduct}
              className="btn-primary bg-red-600 hover:bg-red-700"
              disabled={deleteProduct.isPending}
            >
              <Trash2 size={18} />
              {deleteProduct.isPending ? 'جاري الحذف...' : 'حذف'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Print Barcode Modal */}
      <Modal
        open={showPrintBarcodeModal}
        onClose={() => setShowPrintBarcodeModal(false)}
        title="طباعة باركود"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            اختر الأصناف لطباعة ملصقات الباركود عليها
          </p>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {products.map((product) => (
              <label
                key={product.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors',
                  'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                )}
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{product.barcode || '-'}</span>
                <input
                  type="checkbox"
                  checked={printSelectedIds.has(product.id)}
                  onChange={() => togglePrintSelection(product.id)}
                  className="rounded"
                />
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-4 justify-end">
            <button
              type="button"
              onClick={() => setShowPrintBarcodeModal(false)}
              className="btn-secondary"
            >
              إلغاء
            </button>
            <button
              onClick={handlePrintSelected}
              disabled={printSelectedIds.size === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={18} />
              طباعة ({printSelectedIds.size})
            </button>
          </div>
        </div>
      </Modal>

      {/* CSV Import/Export Modal */}
      <CsvImportModal
        open={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        defaultType="Products"
      />

      {/* Variant Manager Modal */}
      {variantProduct && (
        <VariantManager
          open={showVariantManager}
          onClose={() => {
            setShowVariantManager(false);
            setVariantProduct(null);
          }}
          product={variantProduct}
        />
      )}
    </div>
  );
}
