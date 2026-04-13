import { useState, useMemo } from 'react';
import {
  UtensilsCrossed, Plus, Send, X, ShoppingBag, Truck, Users,
  ChefHat, Check, CreditCard, Printer, Search, Clock,
  Minus, Trash2, MessageSquare, CircleDot, Square, RectangleHorizontal,
  Edit2, AlertCircle, RefreshCw, Banknote,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import {
  useTables, useSaveTable, useDeleteTable, useUpdateTableStatus,
  useActiveOrders, useCreateDineOrder, useAddOrderItems,
  useSendToKitchen, useMarkServed, useCancelDineOrder, useBillOrder,
  useProducts, useCategories, useFloorSections,
} from '@/hooks/useApi';
import { printReceipt } from '@/lib/utils/printer';
import { formatCurrency } from '@/lib/utils/cn';

const tableStatusColors: Record<string, string> = {
  Available: 'bg-green-100 border-green-300 text-green-800',
  Occupied: 'bg-red-100 border-red-300 text-red-800',
  Reserved: 'bg-amber-100 border-amber-300 text-amber-800',
  Cleaning: 'bg-blue-100 border-blue-300 text-blue-800',
};

const tableStatusLabels: Record<string, string> = {
  Available: 'متاحة',
  Occupied: 'مشغولة',
  Reserved: 'محجوزة',
  Cleaning: 'تنظيف',
};

const orderStatusColors: Record<string, string> = {
  New: 'bg-gray-100 text-gray-700',
  InKitchen: 'bg-orange-100 text-orange-700',
  Preparing: 'bg-yellow-100 text-yellow-700',
  Ready: 'bg-green-100 text-green-700',
  Served: 'bg-blue-100 text-blue-700',
  Billed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const orderStatusLabels: Record<string, string> = {
  New: 'جديد',
  InKitchen: 'في المطبخ',
  Preparing: 'قيد التحضير',
  Ready: 'جاهز',
  Served: 'تم التقديم',
  Billed: 'مفوتر',
  Cancelled: 'ملغي',
};

const orderTypeIcons: Record<string, typeof UtensilsCrossed> = {
  DineIn: UtensilsCrossed,
  TakeAway: ShoppingBag,
  Delivery: Truck,
};

const orderTypeLabels: Record<string, string> = {
  DineIn: 'محلي',
  TakeAway: 'تيك اواي',
  Delivery: 'توصيل',
};

export function WaiterScreen() {
  const [view, setView] = useState<'tables' | 'orders' | 'newOrder'>('tables');
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [orderModal, setOrderModal] = useState<any>(null);
  const [billModal, setBillModal] = useState<any>(null);
  const [tableModal, setTableModal] = useState<any>(null);
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  const { data: tablesData, isLoading: tablesLoading } = useTables();
  const { data: ordersData } = useActiveOrders();
  const { data: sectionsRes } = useFloorSections();

  const allTables = tablesData?.data ?? [];
  const orders = ordersData?.data ?? [];
  const floorSections = sectionsRes?.data ?? [];

  const tables = useMemo(() => {
    if (sectionFilter === 'all') return allTables;
    if (sectionFilter === 'unassigned') return allTables.filter((t: any) => !t.sectionId);
    const sId = parseInt(sectionFilter);
    return allTables.filter((t: any) => t.sectionId === sId);
  }, [allTables, sectionFilter]);

  const handleTableClick = (table: any) => {
    if (table.status === 'Available') {
      setSelectedTable(table);
      setView('newOrder');
    } else {
      setSelectedTable(table);
      setView('orders');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <UtensilsCrossed size={22} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">واجهة الويتر</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">إدارة الطاولات والطلبات</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Section Filter */}
          {view === 'tables' && floorSections.length > 0 && (
            <select
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="px-3 py-2 border dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="all">كل المناطق</option>
              {floorSections.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} ({s.tableCount})</option>
              ))}
              <option value="unassigned">غير مخصصة</option>
            </select>
          )}

          {(['tables', 'orders', 'newOrder'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                view === v ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {v === 'tables' ? `الطاولات (${tables.length})` : v === 'orders' ? `الطلبات (${orders.length})` : 'طلب جديد'}
            </button>
          ))}
          <button onClick={() => setTableModal({})} className="px-4 py-2 rounded-xl bg-gray-800 text-white text-sm font-medium flex items-center gap-1.5">
            <Plus size={16} /> إضافة طاولة
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {view === 'tables' && (
          <TableGrid
            tables={tables}
            loading={tablesLoading}
            onTableClick={handleTableClick}
            onEditTable={setTableModal}
          />
        )}
        {view === 'orders' && (
          <ActiveOrdersList
            orders={orders}
            selectedTableId={selectedTable?.id}
            onViewOrder={setOrderModal}
            onBill={setBillModal}
          />
        )}
        {view === 'newOrder' && (
          <NewOrderForm
            table={selectedTable}
            onSuccess={() => { setView('orders'); setSelectedTable(null); }}
            onCancel={() => setView('tables')}
          />
        )}
      </div>

      {/* Modals */}
      {orderModal && <OrderDetailModal order={orderModal} onClose={() => setOrderModal(null)} onBill={setBillModal} />}
      {billModal && <BillModal order={billModal} onClose={() => setBillModal(null)} />}
      {tableModal && <TableEditorModal table={tableModal.id ? tableModal : null} onClose={() => setTableModal(null)} />}
    </div>
  );
}

// ── Table Grid ──

function TableGrid({ tables, loading, onTableClick, onEditTable }: {
  tables: any[]; loading: boolean; onTableClick: (t: any) => void; onEditTable: (t: any) => void;
}) {
  const sections = useMemo(() => {
    const map = new Map<string, any[]>();
    tables.forEach(t => {
      const sec = t.section || 'عام';
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec)!.push(t);
    });
    return map;
  }, [tables]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="text-center py-20">
        <UtensilsCrossed size={56} className="text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">لا توجد طاولات</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">أضف طاولات لبدء استقبال الطلبات</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {[...sections.entries()].map(([section, sectionTables]) => (
        <div key={section}>
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
            <Users size={16} /> {section}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sectionTables.map((t: any) => (
              <button
                key={t.id}
                onClick={() => onTableClick(t)}
                onContextMenu={(e) => { e.preventDefault(); onEditTable(t); }}
                className={`relative p-4 rounded-2xl border-2 text-center transition-all hover:shadow-lg hover:scale-[1.02] active:scale-95 ${tableStatusColors[t.status] ?? 'bg-gray-100 border-gray-300'}`}
              >
                {t.shape === 'circle' ? (
                  <CircleDot size={32} className="mx-auto mb-2 opacity-30" />
                ) : t.shape === 'rectangle' ? (
                  <RectangleHorizontal size={32} className="mx-auto mb-2 opacity-30" />
                ) : (
                  <Square size={32} className="mx-auto mb-2 opacity-30" />
                )}
                <div className="text-lg font-bold">{t.tableNumber}</div>
                <div className="text-xs mt-1 opacity-80">{tableStatusLabels[t.status]} | {t.capacity} مقاعد</div>
                {t.currentOrderNumber && (
                  <div className="mt-2 text-xs font-medium bg-white/60 rounded-lg px-2 py-1">
                    {t.currentOrderNumber} ({t.currentGuestCount || '?'} ضيوف)
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Active Orders List ──

function ActiveOrdersList({ orders, selectedTableId, onViewOrder, onBill }: {
  orders: any[]; selectedTableId?: number; onViewOrder: (o: any) => void; onBill: (o: any) => void;
}) {
  const sendMut = useSendToKitchen();
  const serveMut = useMarkServed();
  const cancelMut = useCancelDineOrder();

  const filtered = selectedTableId ? orders.filter((o: any) => o.tableId === selectedTableId) : orders;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20">
        <Clock size={48} className="text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">لا توجد طلبات نشطة</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((o: any) => {
        const Icon = orderTypeIcons[o.orderType] || UtensilsCrossed;
        return (
          <div key={o.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={18} className="text-orange-600" />
                <span className="font-bold text-gray-900 dark:text-gray-100">{o.orderNumber}</span>
                {o.tableNumber && <span className="text-xs bg-white px-2 py-0.5 rounded-full border">T{o.tableNumber}</span>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${orderStatusColors[o.status]}`}>
                {orderStatusLabels[o.status]}
              </span>
            </div>

            <div className="p-4">
              <div className="space-y-1.5 mb-3 max-h-32 overflow-auto">
                {o.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.quantity}x {item.productName}</span>
                    <span className="text-gray-500 dark:text-gray-400">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">{o.waiterName}</span>
                <span className="font-bold text-lg">{formatCurrency(o.totalAmount)}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 flex gap-2">
              <button onClick={() => onViewOrder(o)} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600">تفاصيل</button>
              {o.status === 'New' && (
                <button onClick={() => sendMut.mutate(o.id)} className="flex-1 py-2 rounded-lg bg-orange-600 text-white text-xs font-medium hover:bg-orange-700 flex items-center justify-center gap-1">
                  <ChefHat size={14} /> أرسل للمطبخ
                </button>
              )}
              {o.status === 'Ready' && (
                <button onClick={() => serveMut.mutate(o.id)} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 flex items-center justify-center gap-1">
                  <Check size={14} /> تم التقديم
                </button>
              )}
              {(o.status === 'Served' || o.status === 'Ready') && (
                <button onClick={() => onBill(o)} className="flex-1 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 flex items-center justify-center gap-1">
                  <CreditCard size={14} /> فوتر
                </button>
              )}
              {o.status === 'New' && (
                <button onClick={() => cancelMut.mutate(o.id)} className="py-2 px-3 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── New Order Form ──

function NewOrderForm({ table, onSuccess, onCancel }: { table: any; onSuccess: () => void; onCancel: () => void }) {
  const [orderType, setOrderType] = useState<string>(table ? 'DineIn' : 'TakeAway');
  const [guestCount, setGuestCount] = useState(table?.capacity || 2);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<{ productId: number; name: string; quantity: number; price: number; notes: string }[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<number | null>(null);

  const { data: productsData } = useProducts();
  const { data: catsData } = useCategories();
  const createMut = useCreateDineOrder();

  const products = productsData?.items ?? [];
  const categories = catsData ?? [];

  const filtered = products.filter((p: any) => {
    if (catFilter && p.categoryId !== catFilter) return false;
    if (search && !p.name.includes(search) && !p.barcode?.includes(search)) return false;
    return p.isActive;
  });

  const addToCart = (p: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === p.id);
      if (existing) return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: p.id, name: p.name, quantity: 1, price: p.retailPrice, notes: '' }];
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleSubmit = () => {
    if (cart.length === 0) { toast.error('أضف أصناف للطلب'); return; }

    createMut.mutate({
      orderType,
      tableId: orderType === 'DineIn' ? table?.id : null,
      guestCount: orderType === 'DineIn' ? guestCount : null,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      notes: notes || null,
      items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, specialNotes: i.notes || null })),
    }, { onSuccess });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Products panel */}
      <div className="lg:col-span-2 flex flex-col bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 space-y-3">
          <div className="flex gap-2">
            {[{ id: 'DineIn', label: 'محلي', icon: UtensilsCrossed },
              { id: 'TakeAway', label: 'تيك اواي', icon: ShoppingBag },
              { id: 'Delivery', label: 'توصيل', icon: Truck }].map(t => (
              <button key={t.id} onClick={() => setOrderType(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  orderType === t.id ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن صنف..."
              className="w-full pr-10 pl-4 py-2.5 border dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button onClick={() => setCatFilter(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${!catFilter ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'}`}>الكل</button>
            {categories.map((c: any) => (
              <button key={c.id} onClick={() => setCatFilter(c.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${catFilter === c.id ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'}`}>{c.name}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 content-start">
          {filtered.map((p: any) => (
            <button key={p.id} onClick={() => addToCart(p)}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-right hover:bg-orange-50 dark:hover:bg-gray-700 hover:border-orange-200 border border-transparent transition-all active:scale-95">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{p.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.barcode}</div>
              <div className="text-sm font-bold text-orange-600 mt-1">{formatCurrency(p.retailPrice)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart panel */}
      <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">الطلب</h3>
          {table && <p className="text-xs text-gray-500 dark:text-gray-400">طاولة {table.tableNumber}</p>}
        </div>

        {/* Order info */}
        <div className="p-3 space-y-2 border-b dark:border-gray-700 text-sm">
          {orderType === 'DineIn' && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-20">الضيوف:</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center"><Minus size={14} /></button>
                <span className="w-8 text-center font-bold">{guestCount}</span>
                <button onClick={() => setGuestCount(guestCount + 1)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center"><Plus size={14} /></button>
              </div>
            </div>
          )}
          {(orderType === 'TakeAway' || orderType === 'Delivery') && (
            <>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="اسم العميل" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="هاتف العميل" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">أضف أصناف من القائمة</div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm dark:text-gray-100">{item.name}</span>
                  <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setCart(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))}
                      className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center"><Minus size={12} /></button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => setCart(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it))}
                      className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center"><Plus size={12} /></button>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</span>
                </div>
                <input
                  value={item.notes}
                  onChange={e => setCart(prev => prev.map((it, i) => i === idx ? { ...it, notes: e.target.value } : it))}
                  placeholder="ملاحظات خاصة..."
                  className="w-full mt-2 px-2 py-1.5 border rounded-lg text-xs"
                />
              </div>
            ))
          )}
        </div>

        {/* Totals + Submit */}
        <div className="p-4 border-t dark:border-gray-700 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">الإجمالي</span>
            <span className="text-xl font-bold text-orange-600">{formatCurrency(total)}</span>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="ملاحظات عامة..." className="w-full px-3 py-2 border rounded-xl text-sm resize-none" />
          <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 py-3 rounded-xl border dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm">إلغاء</button>
            <button onClick={handleSubmit} disabled={cart.length === 0 || createMut.isPending}
              className="flex-1 py-3 rounded-xl bg-orange-600 text-white font-medium text-sm hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Send size={16} /> {createMut.isPending ? 'جاري الإنشاء...' : 'أنشئ الطلب'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Order Detail Modal ──

function OrderDetailModal({ order, onClose, onBill }: { order: any; onClose: () => void; onBill: (o: any) => void }) {
  const sendMut = useSendToKitchen();
  const serveMut = useMarkServed();
  const addMut = useAddOrderItems();

  return (
    <Modal open={true} onClose={onClose} title={`طلب ${order.orderNumber}`} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">النوع</p>
            <p className="font-medium">{orderTypeLabels[order.orderType]}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">الحالة</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${orderStatusColors[order.status]}`}>{orderStatusLabels[order.status]}</span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">الويتر</p>
            <p className="font-medium">{order.waiterName}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">الأصناف</h4>
          <div className="space-y-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
                <div>
                  <span className="font-medium">{item.quantity}x {item.productName}</span>
                  {item.specialNotes && <p className="text-xs text-orange-600 mt-0.5"><MessageSquare size={10} className="inline mr-1" />{item.specialNotes}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(item.totalPrice)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${orderStatusColors[item.kitchenStatus] ?? 'bg-gray-100'}`}>
                    {orderStatusLabels[item.kitchenStatus] ?? item.kitchenStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center text-lg font-bold border-t dark:border-gray-700 pt-3">
          <span>الإجمالي</span>
          <span className="text-orange-600">{formatCurrency(order.totalAmount)}</span>
        </div>

        <div className="flex gap-2">
          {order.status === 'New' && (
            <button onClick={() => { sendMut.mutate(order.id); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-medium flex items-center justify-center gap-1.5">
              <ChefHat size={16} /> إرسال للمطبخ
            </button>
          )}
          {order.status === 'Ready' && (
            <button onClick={() => { serveMut.mutate(order.id); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium flex items-center justify-center gap-1.5">
              <Check size={16} /> تم التقديم
            </button>
          )}
          {(order.status === 'Served' || order.status === 'Ready') && (
            <button onClick={() => { onBill(order); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium flex items-center justify-center gap-1.5">
              <CreditCard size={16} /> تحويل لفاتورة
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Bill Modal ──

function BillModal({ order, onClose }: { order: any; onClose: () => void }) {
  const billMut = useBillOrder();
  const [paymentMethod, setPaymentMethod] = useState(1);
  const [paidAmount, setPaidAmount] = useState(order.totalAmount?.toString() || '0');
  const [discountAmt, setDiscountAmt] = useState('0');

  const finalTotal = (order.totalAmount || 0) - parseFloat(discountAmt || '0');
  const change = Math.max(0, parseFloat(paidAmount || '0') - finalTotal);

  const handleBill = () => {
    billMut.mutate({
      orderId: order.id,
      data: {
        paymentMethod,
        warehouseId: 1,
        paidAmount: parseFloat(paidAmount) || finalTotal,
        discountAmount: parseFloat(discountAmt) || 0,
      },
    }, {
      onSuccess: (res: any) => {
        // Print receipt
        const items = order.items?.map((i: any) => ({
          product: { name: i.productName, barcode: i.productBarcode },
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })) || [];

        printReceipt({
          invoiceNumber: order.orderNumber,
          date: new Date().toLocaleString('ar-EG'),
          cashierName: order.waiterName || 'ويتر',
          customerName: order.customerName,
          items,
          subTotal: order.subTotal,
          discount: parseFloat(discountAmt) || 0,
          tax: 0,
          total: finalTotal,
          paidAmount: parseFloat(paidAmount) || finalTotal,
          change,
          paymentMethod: paymentMethod === 1 ? 'كاش' : paymentMethod === 2 ? 'فيزا' : 'انستاباي',
          storeName: 'MPOS',
        });

        onClose();
      },
    });
  };

  return (
    <Modal open={true} onClose={onClose} title={`فاتورة طلب ${order.orderNumber}`} size="md">
      <div className="space-y-4">
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-sm text-orange-800">الإجمالي</p>
          <p className="text-3xl font-bold text-orange-700">{formatCurrency(finalTotal)}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">طريقة الدفع</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 1, label: 'كاش', icon: Banknote }, { id: 2, label: 'فيزا', icon: CreditCard }, { id: 3, label: 'انستاباي', icon: RefreshCw }].map(m => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                className={`py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === m.id ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}>
                <m.icon size={16} /> {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">خصم</label>
            <input type="number" value={discountAmt} onChange={e => setDiscountAmt(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">المدفوع</label>
            <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-sm" />
          </div>
        </div>

        {change > 0 && (
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <span className="text-sm text-green-800">الباقي: <strong>{formatCurrency(change)}</strong></span>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm">إلغاء</button>
          <button onClick={handleBill} disabled={billMut.isPending}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <Printer size={16} /> {billMut.isPending ? 'جاري الفوترة...' : 'فوتر واطبع'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Table Editor Modal ──

function TableEditorModal({ table, onClose }: { table: any; onClose: () => void }) {
  const saveMut = useSaveTable();
  const deleteMut = useDeleteTable();
  const { data: sectionsRes } = useFloorSections();
  const flSections = sectionsRes?.data ?? [];
  const [form, setForm] = useState({
    tableNumber: table?.tableNumber || '',
    section: table?.section || '',
    sectionId: table?.sectionId || null,
    capacity: table?.capacity || 4,
    isActive: table?.isActive ?? true,
    branchId: table?.branchId || null,
    gridRow: table?.gridRow || null,
    gridCol: table?.gridCol || null,
    shape: table?.shape || 'square',
  });

  const handleSave = () => {
    if (!form.tableNumber.trim()) return;
    saveMut.mutate({ id: table?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <Modal open={true} onClose={onClose} title={table?.id ? 'تعديل الطاولة' : 'إضافة طاولة'} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">رقم الطاولة *</label>
            <input type="text" value={form.tableNumber} onChange={e => setForm(f => ({ ...f, tableNumber: e.target.value }))} className="w-full px-3 py-2.5 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">المنطقة</label>
            {flSections.length > 0 ? (
              <select
                value={form.sectionId || ''}
                onChange={e => {
                  const sId = e.target.value ? parseInt(e.target.value) : null;
                  const sName = flSections.find((s: any) => s.id === sId)?.name || '';
                  setForm(f => ({ ...f, sectionId: sId, section: sName }));
                }}
                className="w-full px-3 py-2.5 border rounded-xl text-sm"
              >
                <option value="">بدون منطقة</option>
                {flSections.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <input type="text" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} className="w-full px-3 py-2.5 border rounded-xl text-sm" placeholder="مثال: الصالة الرئيسية" />
            )}
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">عدد المقاعد</label>
            <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 4 }))} className="w-full px-3 py-2.5 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">الشكل</label>
            <div className="flex gap-2">
              {[{ id: 'square', icon: Square }, { id: 'circle', icon: CircleDot }, { id: 'rectangle', icon: RectangleHorizontal }].map(s => (
                <button key={s.id} onClick={() => setForm(f => ({ ...f, shape: s.id }))}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center ${form.shape === s.id ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'}`}>
                  <s.icon size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {table?.id && (
            <button onClick={() => deleteMut.mutate(table.id, { onSuccess: onClose })} className="py-2.5 px-4 rounded-xl bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200">حذف</button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium">إلغاء</button>
          <button onClick={handleSave} disabled={saveMut.isPending}
            className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
            {saveMut.isPending ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
