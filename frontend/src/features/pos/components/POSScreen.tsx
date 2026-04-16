import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone,
  Clock, ShoppingCart, Box, CheckCircle, Printer, Scale, ScanBarcode,
  ChevronDown, X, Percent, User, Warehouse, Loader2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { usePOSStore, calcBundlePrice } from '@/store/posStore';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useScale } from '@/hooks/useScale';
import {
  useProducts, useCategories, useContacts, useCreateSale,
  useWarehouses, useProductByBarcode,
  usePaymentTerminals, useInitiateTerminalPayment,
} from '@/hooks/useApi';
import { formatCurrency, getPriceByType, cn } from '@/lib/utils/cn';
import { printReceipt } from '@/lib/utils/printer';
import { sendToCustomerDisplay } from '@/lib/customerDisplayChannel';
import { useAuthStore } from '@/store/authStore';
import { salesRepsApi } from '@/lib/api/endpoints';
import type {
  ProductDto, ProductVariantDto, ContactDto, CategoryDto, WarehouseDto,
  PaymentMethod, PriceType, CreateInvoiceRequest,
} from '@/types/api.types';
import { VariantSelector } from './VariantSelector';
import { AddCustomerForm } from './AddCustomerForm';
import { LoyaltyWidget } from '@/features/loyalty/components/LoyaltyWidget';

// ── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  icon: typeof Banknote;
  color: string;
  isTerminal?: boolean;
}[] = [
  { id: 1 as PaymentMethod, label: 'كاش', icon: Banknote, color: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800' },
  { id: 2 as PaymentMethod, label: 'مدى / بطاقة', icon: CreditCard, color: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800', isTerminal: true },
  { id: 3 as PaymentMethod, label: 'تحويل', icon: Smartphone, color: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800' },
  { id: 4 as PaymentMethod, label: 'آجل', icon: Clock, color: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800' },
];

const PRICE_TYPE_MAP: Record<string, PriceType> = {
  retail: 1 as PriceType,
  half: 2 as PriceType,
  wholesale: 3 as PriceType,
};

// ── Skeleton Loader ──────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="card p-3 animate-pulse">
      <div className="w-full h-16 bg-gray-100 dark:bg-gray-800 rounded-lg mb-2" />
      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-1" />
      <div className="h-3 bg-gray-50 dark:bg-gray-800 rounded w-1/2 mt-1" />
      <div className="flex items-center justify-between mt-2">
        <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-full w-14" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-16" />
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function POSScreen() {
  // ── Store ──────────────────────────────────────────────────────────────────
  const {
    cart, addToCart, removeFromCart, updateQuantity, setDirectQuantity,
    clearCart, selectedCustomer, setCustomer, priceType, setPriceType,
    discount, setDiscount, notes, setNotes,
    getSubTotal, getTotal, getProfit, getItemCount, getQuantityCount,
  } = usePOSStore();

  // ── Local State ────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number>(1);
  const [paidAmount, setPaidAmount] = useState('');
  const [editingQty, setEditingQty] = useState<number | null>(null);
  const [editQtyValue, setEditQtyValue] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [lastSaleInvoice, setLastSaleInvoice] = useState<string | null>(null);
  const [salesRepId, setSalesRepId] = useState<number | null>(null);
  const [variantProduct, setVariantProduct] = useState<ProductDto | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect SalesRep from JWT when logged in as SalesRep role
  const user = useAuthStore(s => s.user);
  useEffect(() => {
    if (user?.role === 'SalesRep') {
      salesRepsApi.getMine().then(res => {
        if (res.success && res.data) {
          setSalesRepId(res.data.id);
          if (res.data.assignedWarehouseId) {
            setSelectedWarehouse(res.data.assignedWarehouseId);
          }
        }
      }).catch(() => {});
    }
  }, [user?.role]);

  // ── API Hooks ──────────────────────────────────────────────────────────────
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
  } = useProducts({
    searchTerm: searchTerm || undefined,
    categoryId: selectedCategory ?? undefined,
    activeOnly: true,
    pageSize: 100,
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: warehousesData } = useWarehouses();
  const { data: contactsData, isLoading: contactsLoading } = useContacts({
    search: customerSearch || undefined,
    type: 1, // Customers only
    pageSize: 50,
  });
  const createSaleMutation = useCreateSale();

  // Barcode lookup (triggered on scan)
  const { data: barcodeProduct } = useProductByBarcode(scannedBarcode);

  // Resolve data
  const products = productsData?.items ?? [];
  const categories = categoriesData ?? [];
  const warehouses = warehousesData ?? [];
  const contacts = contactsData?.items ?? [];
  const selectedWarehouseObj = warehouses.find((w: WarehouseDto) => w.id === selectedWarehouse);

  // ── Scale Integration ──────────────────────────────────────────────────────
  const scale = useScale({
    onWeight: (weight) => {
      if (cart.length > 0) {
        const lastItem = cart[cart.length - 1]!;
        setDirectQuantity(lastItem.product.id, weight);
      }
    },
  });

  // ── Barcode Scanner Integration ────────────────────────────────────────────
  // When barcode product resolves from API, add it to cart
  const handleBarcodeResult = useCallback(
    (product: ProductDto) => {
      const price = getPriceByType(product, priceType);
      addToCart(product, price);
      setScannedBarcode('');
      toast.success(`تم إضافة: ${product.name}`);
    },
    [priceType, addToCart],
  );

  // Handle the resolved barcode product
  if (barcodeProduct && scannedBarcode) {
    handleBarcodeResult(barcodeProduct);
  }

  useBarcodeScanner({
    onScan: (barcode) => {
      // First try to find it in already-loaded products (faster)
      const localMatch = products.find((p: ProductDto) => p.barcode === barcode);
      if (localMatch) {
        const price = getPriceByType(localMatch, priceType);
        addToCart(localMatch, price);
        toast.success(`تم إضافة: ${localMatch.name}`);
      } else {
        // Trigger API lookup
        setScannedBarcode(barcode);
      }
    },
    enabled: true,
  });

  // ── Handle barcode input from search field (Enter key) ─────────────────────
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchTerm) {
        // Try to match by barcode in loaded products
        const product = products.find(
          (p: ProductDto) => p.barcode === searchTerm || p.name === searchTerm,
        );
        if (product) {
          const price = getPriceByType(product, priceType);
          addToCart(product, price);
          setSearchTerm('');
          toast.success(`تم إضافة: ${product.name}`);
        } else {
          // Try API barcode lookup
          setScannedBarcode(searchTerm);
          setSearchTerm('');
        }
      }
    },
    [searchTerm, priceType, addToCart, products],
  );

  // ── Terminal state ──
  const { data: terminalsRes } = usePaymentTerminals();
  const initiateTerminalPay = useInitiateTerminalPayment();
  const [terminalPaying, setTerminalPaying] = useState(false);

  // ── Payment Handlers ───────────────────────────────────────────────────────
  const handlePay = async (method: PaymentMethod) => {
    setSelectedPayment(method);
    const total = getTotal();
    if (method === 4) {
      if (!selectedCustomer) {
        toast.error('يجب اختيار عميل للبيع الآجل');
        return;
      }
      setPaidAmount('0');
      completeSale(method, 0);
    } else {
      // Check if this is a card/terminal payment
      const payMethod = PAYMENT_METHODS.find(m => m.id === method);
      if (payMethod?.isTerminal) {
        // Find default terminal
        const terminals = terminalsRes?.data ?? [];
        const defaultTerminal = terminals.find((t: any) => t.isDefault) || terminals[0];
        if (!defaultTerminal) {
          toast.error('لا يوجد جهاز دفع مُعرّف. أضف جهاز من الإعدادات');
          return;
        }
        // Initiate terminal payment
        setTerminalPaying(true);
        toast.loading('جارٍ إرسال المبلغ لجهاز الدفع... مرر البطاقة', { id: 'terminal-pay' });
        try {
          const result = await initiateTerminalPay.mutateAsync({
            terminalId: defaultTerminal.id,
            amount: total,
            tipAmount: null,
            referenceNote: null,
          });
          toast.dismiss('terminal-pay');
          if (result.data?.isApproved) {
            toast.success(`تم الدفع بنجاح — ${result.data.cardScheme || 'بطاقة'} ${result.data.cardLast4 ? '****' + result.data.cardLast4 : ''}`, { duration: 4000 });
            setPaidAmount(total.toString());
            completeSale(method, total);
          } else {
            toast.error(result.data?.responseMessage || 'تم رفض العملية');
          }
        } catch {
          toast.dismiss('terminal-pay');
          toast.error('فشل الاتصال بجهاز الدفع');
        } finally {
          setTerminalPaying(false);
        }
        return;
      }
      setPaidAmount(total.toString());
      setShowPayment(true);
    }
  };

  const completeSale = async (method: PaymentMethod, paid: number) => {
    const total = getTotal();
    const subTotal = getSubTotal();

    const saleData: CreateInvoiceRequest = {
      contactId: selectedCustomer?.id,
      warehouseId: selectedWarehouse,
      priceType: PRICE_TYPE_MAP[priceType] ?? (1 as PriceType),
      paymentMethod: method,
      discountAmount: discount,
      paidAmount: paid,
      notes: notes || undefined,
      salesRepId: salesRepId ?? undefined,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discount || 0,
        productVariantId: item.variantId || undefined,
      })),
    };

    try {
      const result = await createSaleMutation.mutateAsync(saleData);
      const invoiceNumber = result?.data?.invoiceNumber ?? `INV-${String(Date.now()).slice(-6)}`;
      setLastSaleInvoice(invoiceNumber);

      // Print receipt
      printReceipt({
        invoiceNumber,
        date: new Date().toLocaleString('ar-EG'),
        cashierName: 'كاشير ١',
        customerName: selectedCustomer?.name,
        items: cart,
        subTotal,
        discount,
        tax: 0,
        total,
        paidAmount: paid,
        change: Math.max(0, paid - total),
        paymentMethod: PAYMENT_METHODS.find((m) => m.id === method)?.label || 'كاش',
        storeName: 'MPOS',
        storePhone: '01012345678',
      });

      // Broadcast payment to customer display
      sendToCustomerDisplay({
        type: 'PAYMENT_COMPLETE',
        paid,
        change: Math.max(0, paid - total),
        method: PAYMENT_METHODS.find((m) => m.id === method)?.label || 'كاش',
      });

      setShowPayment(false);
      setShowSuccess(true);
    } catch {
      // Error toast is handled by useCreateSale hook
    }
  };

  const handleNewInvoice = () => {
    setShowSuccess(false);
    setLastSaleInvoice(null);
    clearCart();
    setSearchTerm('');
    setScannedBarcode('');
    searchInputRef.current?.focus();
  };

  // ── Computed Values ────────────────────────────────────────────────────────
  const subTotal = getSubTotal();
  const total = getTotal();
  const profit = getProfit();

  // ── Broadcast cart changes to Customer Display ────────────────────────────
  useEffect(() => {
    if (cart.length === 0) {
      sendToCustomerDisplay({ type: 'CLEAR_ORDER' });
      return;
    }
    sendToCustomerDisplay({
      type: 'UPDATE_ORDER',
      items: cart.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * item.quantity - item.discount,
      })),
      subtotal: subTotal,
      tax: 0,
      discount,
      total,
    });
  }, [cart, subTotal, total, discount]);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="pos-screen flex gap-3 h-[calc(100vh-88px)]">
      {/* ═══ LEFT PANEL: Products Grid (60%) ═══ */}
      <div className="flex-[3] flex flex-col min-w-0">
        {/* ── Search & Filter Bar ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="بحث بالاسم أو مسح الباركود..."
              className="input pr-10"
              data-barcode-input="true"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Scale indicator */}
          <button
            onClick={() => (scale.connected ? scale.disconnect() : scale.connect())}
            className={cn(
              'touch-btn px-3 border rounded-xl text-sm gap-2',
              scale.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400',
            )}
            title={scale.connected ? `الميزان: ${scale.weight} ${scale.unit}` : 'توصيل الميزان'}
          >
            <Scale size={16} />
            {scale.connected && <span className="font-mono">{scale.weight}</span>}
          </button>

          <button className="touch-btn px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-400">
            <ScanBarcode size={16} />
          </button>
        </div>

        {/* ── Category Tabs ───────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              !selectedCategory
                ? 'bg-brand-900 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
            )}
          >
            الكل
          </button>

          {categoriesLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse w-20 shrink-0"
                />
              ))
            : categories.map((cat: CategoryDto) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategory(cat.id === selectedCategory ? null : cat.id)
                  }
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                    selectedCategory === cat.id
                      ? 'bg-brand-900 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                  )}
                >
                  {cat.name}
                  {cat.productCount > 0 && (
                    <span className="mr-1 text-xs opacity-60">({cat.productCount})</span>
                  )}
                </button>
              ))}
        </div>

        {/* ── Products Grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 overflow-y-auto flex-1 content-start pb-2">
          {/* Loading State */}
          {productsLoading &&
            Array.from({ length: 15 }).map((_, i) => <ProductSkeleton key={i} />)}

          {/* Error State */}
          {productsError && !productsLoading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-red-400">
              <AlertCircle size={48} strokeWidth={1} />
              <p className="mt-3 text-sm font-medium">خطأ في تحميل الأصناف</p>
              <p className="text-xs text-red-300 mt-1">تحقق من الاتصال وحاول مرة أخرى</p>
            </div>
          )}

          {/* Products */}
          {!productsLoading &&
            !productsError &&
            products.map((product: ProductDto) => {
              const price = getPriceByType(product, priceType);
              const inCart = cart.find((c) => c.product.id === product.id);
              const displayStock = product.currentStock - (inCart?.quantity ?? 0);
              const isLowStock = displayStock <= product.minStock;

              return (
                <button
                  key={product.id}
                  onClick={() => {
                    if (product.hasVariants) {
                      setVariantProduct(product);
                      return;
                    }
                    addToCart(product, price);
                  }}
                  className={cn(
                    'card p-3 text-right transition-all group relative active:scale-[0.97]',
                    'hover:border-brand-300 hover:shadow-md',
                    inCart && 'border-brand-300 bg-brand-50/30',
                  )}
                >
                  {/* Product image / placeholder */}
                  <div className="w-full h-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg mb-2 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Box
                        size={24}
                        className="text-gray-300 group-hover:text-brand-400 transition-colors"
                      />
                    )}
                  </div>

                  {product.isBundle && (
                    <div className="absolute top-1 right-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                      باقة
                    </div>
                  )}

                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                    {product.barcode || '—'}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={isLowStock ? 'danger' : displayStock < product.currentStock ? 'warning' : 'success'}>
                      {displayStock} {product.unitName}
                    </Badge>
                    {product.isBundle && product.bundleItems?.length ? (
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">
                          {formatCurrency(calcBundlePrice(product, priceType))}
                        </span>
                        <span className="text-[10px] text-gray-400 line-through">
                          {formatCurrency(product.bundleItems.reduce((s, bi) => s + bi.componentRetailPrice * bi.quantity, 0))}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
                        {formatCurrency(price)}
                      </span>
                    )}
                  </div>

                  {/* Cart quantity indicator */}
                  {inCart && (
                    <div className="absolute top-1.5 left-1.5 min-w-[24px] h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold px-1.5 animate-bounce-sm">
                      {inCart.quantity}
                    </div>
                  )}
                </button>
              );
            })}

          {/* Empty State */}
          {!productsLoading && !productsError && products.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-300">
              <Search size={48} strokeWidth={1} />
              <p className="mt-3 text-sm">لا توجد أصناف مطابقة</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT PANEL: Cart (40%) ═══ */}
      <div className="flex-[2] card flex flex-col shrink-0 max-w-[420px] min-w-[340px]">
        {/* ── Cart Header ─────────────────────────────────────────────────── */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShoppingCart size={18} /> الفاتورة
            </h3>
            <div className="flex items-center gap-2">
              {/* Price Type Selector */}
              <select
                value={priceType}
                onChange={(e) => {
                  const newType = e.target.value as 'retail' | 'half' | 'wholesale';
                  setPriceType(newType);
                  // Update prices in cart
                  cart.forEach((item) => {
                    const newPrice = getPriceByType(item.product, newType);
                    usePOSStore.setState((state) => ({
                      cart: state.cart.map((c) =>
                        c.product.id === item.product.id
                          ? { ...c, unitPrice: newPrice }
                          : c,
                      ),
                    }));
                  });
                }}
                className="text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 cursor-pointer"
              >
                <option value="retail">قطاعي</option>
                <option value="half">نصف جملة</option>
                <option value="wholesale">جملة</option>
              </select>
            </div>
          </div>

          {/* Warehouse Selector */}
          <button
            onClick={() => setShowWarehousePicker(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Warehouse size={15} className="text-gray-400" />
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {selectedWarehouseObj?.name || 'المخزن الرئيسي'}
            </span>
            <ChevronDown size={14} className="text-gray-300 mr-auto" />
          </button>

          {/* Customer Selector */}
          <button
            onClick={() => setShowCustomerPicker(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <User size={15} className="text-gray-400" />
            <span
              className={selectedCustomer ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400'}
            >
              {selectedCustomer?.name || 'عميل نقدي (اضغط لاختيار عميل)'}
            </span>
            {selectedCustomer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomer(null);
                }}
                className="mr-auto text-gray-300 hover:text-red-400"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown size={14} className="text-gray-300 mr-auto" />
          </button>

          {/* Loyalty Widget */}
          <LoyaltyWidget
            contactId={selectedCustomer?.id ?? null}
            contactName={selectedCustomer?.name}
            onDiscount={(amount) => setDiscount(discount + amount)}
          />
        </div>

        {/* ── Cart Items ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingCart size={56} strokeWidth={1} />
              <p className="mt-3 text-sm">الفاتورة فارغة</p>
              <p className="text-xs mt-1 text-gray-200">امسح باركود أو اختر صنف</p>
            </div>
          ) : (
            cart.map((item) => {
              const cartKey = item.variantId
                ? `${item.product.id}-v${item.variantId}`
                : `${item.product.id}`;
              return (
              <div key={cartKey}>
              <div
                className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {item.isBundleParent && <span className="text-purple-500 ml-1 text-xs">📦</span>}
                    {item.product.name}
                    {item.variantName && (
                      <span className="text-xs font-normal text-brand-500 dark:text-brand-400 mr-1">
                        ({item.variantName})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(item.unitPrice)} × {item.quantity}
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variantId)}
                    className="touch-btn w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-200 hover:text-red-500"
                  >
                    {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                  </button>

                  {editingQty === (item.variantId ?? item.product.id) ? (
                    <input
                      type="number"
                      value={editQtyValue}
                      onChange={(e) => setEditQtyValue(e.target.value)}
                      onBlur={() => {
                        const val = parseFloat(editQtyValue);
                        if (val > 0) setDirectQuantity(item.product.id, val, item.variantId);
                        setEditingQty(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseFloat(editQtyValue);
                          if (val > 0) setDirectQuantity(item.product.id, val, item.variantId);
                          setEditingQty(null);
                        }
                      }}
                      className="w-12 text-center text-sm font-bold border border-brand-300 dark:border-brand-700 rounded-lg py-1 bg-white dark:bg-gray-800 dark:text-gray-100"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingQty(item.variantId ?? item.product.id);
                        setEditQtyValue(item.quantity.toString());
                      }}
                      className="w-10 text-center text-sm font-bold text-gray-900 dark:text-gray-100 py-1 hover:bg-brand-50 dark:hover:bg-brand-950 rounded-lg"
                    >
                      {item.quantity}
                    </button>
                  )}

                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variantId)}
                    className="touch-btn w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-200 hover:text-green-500"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-20 text-left tabular-nums">
                  {formatCurrency(item.unitPrice * item.quantity - item.discount)}
                </span>
              </div>
              {item.isBundleParent && item.bundleChildren?.map((child, idx) => (
                <div key={`bundle-child-${item.product.id}-${idx}`}
                  className="flex items-center gap-2 px-3 py-1 mr-4 border-r-2 border-purple-400/30 dark:border-purple-600/30">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {idx === item.bundleChildren!.length - 1 ? '└' : '├'} {child.product.name} × {child.quantity}
                  </span>
                </div>
              ))}
              </div>
            );})
          )}
        </div>

        {/* ── Cart Footer: Totals & Payment ───────────────────────────────── */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>عدد الأصناف</span>
              <span>{getItemCount()}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>عدد القطع</span>
              <span>{getQuantityCount()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>الخصم</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>الربح المتوقع</span>
              <span>{formatCurrency(profit)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span>الإجمالي</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Discount & Clear buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowDiscount(true)}
              className="flex-1 btn-secondary text-xs py-2"
              disabled={cart.length === 0}
            >
              <Percent size={14} /> خصم
            </button>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="btn-secondary text-xs py-2 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={14} /> مسح
              </button>
            )}
          </div>

          {/* Payment Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                disabled={cart.length === 0 || createSaleMutation.isPending}
                onClick={() => handlePay(method.id)}
                className={cn(
                  'touch-btn py-3 text-white text-sm font-medium rounded-xl transition-all gap-2',
                  cart.length === 0 || createSaleMutation.isPending
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : method.color,
                )}
              >
                {createSaleMutation.isPending ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <method.icon size={17} />
                )}
                {method.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══════════════════════════════════════════════════════════ */}

      {/* ── Payment Confirmation Modal ────────────────────────────────────── */}
      <Modal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        title="تأكيد الدفع"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">المبلغ المطلوب</p>
            <p className="text-3xl font-bold text-brand-700 dark:text-brand-300 mt-1">
              {formatCurrency(total)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              المبلغ المدفوع
            </label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="input text-center text-xl font-bold"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          </div>

          {/* Quick amount buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[
              total,
              Math.ceil(total / 50) * 50,
              Math.ceil(total / 100) * 100,
              Math.ceil(total / 500) * 500,
            ].map((amount, i) => (
              <button
                key={i}
                onClick={() => setPaidAmount(amount.toString())}
                className="py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>

          {parseFloat(paidAmount) > total && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <p className="text-sm text-emerald-600">الباقي</p>
              <p className="text-xl font-bold text-emerald-700">
                {formatCurrency(parseFloat(paidAmount) - total)}
              </p>
            </div>
          )}

          <button
            onClick={() =>
              completeSale(selectedPayment!, parseFloat(paidAmount) || 0)
            }
            disabled={
              !paidAmount ||
              parseFloat(paidAmount) < total ||
              createSaleMutation.isPending
            }
            className="btn-primary w-full py-3 text-base"
          >
            {createSaleMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" /> جاري التسجيل...
              </>
            ) : (
              <>
                <CheckCircle size={18} /> تأكيد البيع
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* ── Success Modal ─────────────────────────────────────────────────── */}
      <Modal open={showSuccess} onClose={handleNewInvoice} size="sm">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">تمت العملية بنجاح!</h3>
          <p className="text-gray-500 dark:text-gray-400">تم تسجيل الفاتورة وطباعة الإيصال</p>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            {lastSaleInvoice && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 dark:text-gray-400">رقم الفاتورة</span>
                <span className="font-mono font-medium">{lastSaleInvoice}</span>
              </div>
            )}
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500 dark:text-gray-400">العميل</span>
              <span className="font-medium">
                {selectedCustomer?.name || 'عميل نقدي'}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <span>الإجمالي</span>
              <span className="text-brand-700 dark:text-brand-300">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleNewInvoice} className="flex-1 btn-primary py-3">
              <ShoppingCart size={16} /> فاتورة جديدة
            </button>
            <button
              onClick={() => {
                printReceipt({
                  invoiceNumber: lastSaleInvoice || `INV-${String(Date.now()).slice(-6)}`,
                  date: new Date().toLocaleString('ar-EG'),
                  cashierName: 'كاشير ١',
                  customerName: selectedCustomer?.name,
                  items: cart,
                  subTotal,
                  discount,
                  tax: 0,
                  total,
                  paidAmount: parseFloat(paidAmount) || total,
                  change: Math.max(0, (parseFloat(paidAmount) || total) - total),
                  paymentMethod:
                    PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.label || 'كاش',
                  storeName: 'MPOS',
                  storePhone: '01012345678',
                });
              }}
              className="flex-1 btn-secondary py-3"
            >
              <Printer size={16} /> طباعة
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Customer Picker Modal ─────────────────────────────────────────── */}
      <Modal
        open={showCustomerPicker}
        onClose={() => {
          setShowCustomerPicker(false);
          setShowAddCustomerForm(false);
          setCustomerSearch('');
        }}
        title={showAddCustomerForm ? 'إضافة عميل جديد' : 'اختيار عميل'}
        size="lg"
      >
        {showAddCustomerForm ? (
          <AddCustomerForm
            onCreated={(contact) => {
              setCustomer(contact);
              setShowCustomerPicker(false);
              setShowAddCustomerForm(false);
              setCustomerSearch('');
            }}
            onBack={() => setShowAddCustomerForm(false)}
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="بحث بالاسم أو الهاتف..."
                className="input flex-1"
                autoFocus
              />
              <button
                onClick={() => setShowAddCustomerForm(true)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-semibold transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">إضافة عميل جديد</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {contactsLoading && (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="mr-2 text-sm">جاري البحث...</span>
                </div>
              )}

              {!contactsLoading && contacts.length === 0 && (
                <div className="text-center py-8 text-gray-300">
                  <User size={32} strokeWidth={1} className="mx-auto mb-2" />
                  <p className="text-sm">لا يوجد عملاء</p>
                  <button
                    onClick={() => setShowAddCustomerForm(true)}
                    className="mt-2 text-brand-500 hover:text-brand-400 text-sm font-medium transition-colors"
                  >
                    إضافة عميل جديد
                  </button>
                </div>
              )}

              {!contactsLoading &&
                contacts.map((customer: ContactDto) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setCustomer(customer);
                      setShowCustomerPicker(false);
                      setCustomerSearch('');
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl text-right transition-colors',
                      selectedCustomer?.id === customer.id
                        ? 'bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold shrink-0">
                      {customer.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{customer.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{customer.phone || '—'}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <Badge variant={customer.balance >= 0 ? 'success' : 'danger'}>
                        {formatCurrency(Math.abs(customer.balance))}
                      </Badge>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Warehouse Picker Modal ────────────────────────────────────────── */}
      <Modal
        open={showWarehousePicker}
        onClose={() => setShowWarehousePicker(false)}
        title="اختيار المخزن"
        size="sm"
      >
        <div className="space-y-2">
          {warehouses.length === 0 && (
            <div className="text-center py-8 text-gray-300">
              <Warehouse size={32} strokeWidth={1} className="mx-auto mb-2" />
              <p className="text-sm">لا توجد مخازن</p>
            </div>
          )}

          {warehouses.map((wh: WarehouseDto) => (
            <button
              key={wh.id}
              onClick={() => {
                setSelectedWarehouse(wh.id);
                setShowWarehousePicker(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl text-right transition-colors',
                selectedWarehouse === wh.id
                  ? 'bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                  wh.isMain
                    ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
                )}
              >
                <Warehouse size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {wh.name}
                  {wh.isMain && (
                    <span className="text-xs text-brand-500 font-normal mr-2">
                      (رئيسي)
                    </span>
                  )}
                </p>
                {wh.location && (
                  <p className="text-xs text-gray-400">{wh.location}</p>
                )}
              </div>
              <div className="text-left shrink-0">
                <Badge variant="info">{wh.totalItems} صنف</Badge>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* ── Variant Selector Modal ──────────────────────────────────────── */}
      {variantProduct && (
        <VariantSelector
          open={!!variantProduct}
          onClose={() => setVariantProduct(null)}
          product={variantProduct}
          priceType={priceType}
          onSelect={(variant: ProductVariantDto, price: number) => {
            addToCart(variantProduct, price, {
              id: variant.id,
              name: variant.displayName || variant.variantCombination,
            });
            toast.success(`تم إضافة: ${variantProduct.name} — ${variant.displayName || variant.variantCombination}`);
            setVariantProduct(null);
          }}
        />
      )}

      {/* ── Discount Modal ────────────────────────────────────────────────── */}
      <Modal
        open={showDiscount}
        onClose={() => setShowDiscount(false)}
        title="إضافة خصم"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              مبلغ الخصم
            </label>
            <input
              type="number"
              value={discount || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="input text-center text-xl font-bold"
              placeholder="0"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                onClick={() => setDiscount(Math.round((subTotal * pct) / 100))}
                className="py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-700 dark:hover:text-brand-300"
              >
                {pct}%
              </button>
            ))}
          </div>
          <button onClick={() => setShowDiscount(false)} className="btn-primary w-full">
            تطبيق
          </button>
        </div>
      </Modal>
    </div>
  );
}
