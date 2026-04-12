import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ShoppingCart, Plus, Minus, Trash2, ArrowRight, ArrowLeft,
  Search, Clock, CheckCircle2, CreditCard, Banknote,
  Phone, User, MapPin, MessageSquare, ChefHat,
  UtensilsCrossed, ShoppingBag, Truck, Globe, Loader2,
  AlertCircle, Star, X, Smartphone,
} from 'lucide-react';
import { customerApi } from '@/lib/api/endpoints';

// ============================================================
// Customer Order App — Public, No Auth
// ============================================================

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialNotes?: string;
}

export default function CustomerOrderApp() {
  const qrCode = window.location.pathname.split('/order/')[1]?.split('/')[0] || '';
  const [sessionToken, setSessionToken] = useState<string>(() => localStorage.getItem(`qr_session_${qrCode}`) || '');
  const [view, setView] = useState<'welcome' | 'menu' | 'cart' | 'checkout' | 'tracking'>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(() => {
    const stored = localStorage.getItem(`qr_order_${qrCode}`);
    return stored ? parseInt(stored) : null;
  });

  // Fetch store menu
  const { data: menuRes, isLoading: menuLoading, error: menuError } = useQuery({
    queryKey: ['customer-menu', qrCode],
    queryFn: () => customerApi.getMenu(qrCode),
    enabled: !!qrCode,
  });

  const store = menuRes?.data;

  // Start session mutation
  const startSessionMut = useMutation({
    mutationFn: (data: any) => customerApi.startSession(qrCode, data),
    onSuccess: (res) => {
      const token = res.data.sessionToken;
      setSessionToken(token);
      localStorage.setItem(`qr_session_${qrCode}`, token);
      setView('menu');
    },
  });

  // Cart query
  const { data: cartRes, refetch: refetchCart } = useQuery({
    queryKey: ['customer-cart', sessionToken],
    queryFn: () => customerApi.getCart(sessionToken),
    enabled: !!sessionToken && view !== 'welcome',
  });

  // Submit order
  const submitMut = useMutation({
    mutationFn: (data: any) => customerApi.submitOrder(sessionToken, data),
    onSuccess: (res) => {
      const orderId = res.data.id;
      setActiveOrderId(orderId);
      localStorage.setItem(`qr_order_${qrCode}`, String(orderId));
      setView('tracking');
    },
  });

  // Add to cart
  const addToCartMut = useMutation({
    mutationFn: (data: any) => customerApi.addToCart(sessionToken, data),
    onSuccess: () => refetchCart(),
  });

  // Update cart item
  const updateItemMut = useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: any }) => customerApi.updateCartItem(sessionToken, itemId, data),
    onSuccess: () => refetchCart(),
  });

  // Remove from cart
  const removeItemMut = useMutation({
    mutationFn: (itemId: number) => customerApi.removeCartItem(sessionToken, itemId),
    onSuccess: () => refetchCart(),
  });

  // Order status polling
  const { data: statusRes } = useQuery({
    queryKey: ['order-status', sessionToken, activeOrderId],
    queryFn: () => customerApi.getOrderStatus(sessionToken, activeOrderId!),
    enabled: !!sessionToken && !!activeOrderId && view === 'tracking',
    refetchInterval: 3000,
  });

  // Auto-navigate to tracking if order exists
  useEffect(() => {
    if (activeOrderId && sessionToken) setView('tracking');
    else if (sessionToken && store) setView('menu');
  }, []);

  const serverCart = cartRes?.data;
  const orderStatus = statusRes?.data;
  const themeColor = store?.themeColor || '#6366f1';

  if (!qrCode) {
    return <ErrorScreen message="رابط غير صالح" />;
  }

  if (menuLoading) {
    return <LoadingScreen color={themeColor} />;
  }

  if (menuError || !store) {
    return <ErrorScreen message="المتجر غير متاح حالياً" />;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" style={{ '--theme': themeColor } as any}>
      {view === 'welcome' && (
        <WelcomeScreen
          store={store}
          onStart={(data: any) => startSessionMut.mutate(data)}
          loading={startSessionMut.isPending}
        />
      )}
      {view === 'menu' && (
        <MenuScreen
          store={store}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddToCart={(productId: number, quantity: number, notes?: string) => {
            addToCartMut.mutate({ productId, quantity, specialNotes: notes });
          }}
          cartItemCount={serverCart?.items?.length ?? 0}
          onViewCart={() => setView('cart')}
          themeColor={themeColor}
        />
      )}
      {view === 'cart' && (
        <CartScreen
          cart={serverCart}
          onBack={() => setView('menu')}
          onCheckout={() => setView('checkout')}
          onUpdateItem={(itemId: number, qty: number, notes?: string) => updateItemMut.mutate({ itemId, data: { quantity: qty, specialNotes: notes } })}
          onRemoveItem={(itemId: number) => removeItemMut.mutate(itemId)}
          themeColor={themeColor}
        />
      )}
      {view === 'checkout' && (
        <CheckoutScreen
          store={store}
          cart={serverCart}
          onBack={() => setView('cart')}
          onSubmit={(data: any) => submitMut.mutate(data)}
          submitting={submitMut.isPending}
          themeColor={themeColor}
        />
      )}
      {view === 'tracking' && (
        <TrackingScreen
          status={orderStatus}
          store={store}
          onNewOrder={() => { setActiveOrderId(null); localStorage.removeItem(`qr_order_${qrCode}`); setView('menu'); }}
          themeColor={themeColor}
        />
      )}
    </div>
  );
}

// ============================================================
// Welcome Screen
// ============================================================

function WelcomeScreen({ store, onStart, loading }: { store: any; onStart: (data: any) => void; loading: boolean }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderType, setOrderType] = useState(store.defaultOrderType || 'DineIn');

  const orderTypes = [
    { id: 'DineIn', label: 'محلي', Icon: UtensilsCrossed, desc: 'تناول في المطعم' },
    { id: 'TakeAway', label: 'تيك اواي', Icon: ShoppingBag, desc: 'استلام من المتجر' },
    { id: 'Delivery', label: 'توصيل', Icon: Truck, desc: 'توصيل للموقع' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${store.themeColor}15, ${store.themeColor}05)` }}>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo & Store Name */}
          <div className="text-center">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.storeName} className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                style={{ backgroundColor: store.themeColor }}>
                {store.storeName?.[0]}
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{store.storeName}</h1>
            {store.welcomeMessage && <p className="text-sm text-gray-500 mt-2">{store.welcomeMessage}</p>}
            {store.tableNumber && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm text-sm font-medium"
                style={{ color: store.themeColor }}>
                <UtensilsCrossed size={14} /> طاولة {store.tableNumber}
              </div>
            )}
          </div>

          {/* Order Type */}
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">نوع الطلب</h3>
            <div className="space-y-2">
              {orderTypes.map(t => (
                <button key={t.id} onClick={() => setOrderType(t.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right ${
                    orderType === t.id ? 'border-current shadow-sm' : 'border-gray-200 hover:border-gray-300'
                  }`} style={{ color: orderType === t.id ? store.themeColor : '#6b7280' }}>
                  <div className={`p-2 rounded-lg ${orderType === t.id ? 'bg-current/10' : 'bg-gray-100'}`}>
                    <t.Icon size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{t.label}</div>
                    <div className="text-xs text-gray-500">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">بياناتك</h3>
            <div className="space-y-3">
              <div className="relative">
                <User size={16} className="absolute right-3 top-3 text-gray-400" />
                <input value={name} onChange={e => setName(e.target.value)} placeholder="الاسم (اختياري)"
                  className="w-full pl-3 pr-10 py-2.5 border rounded-xl text-sm" />
              </div>
              {store.requirePhone && (
                <div className="relative">
                  <Phone size={16} className="absolute right-3 top-3 text-gray-400" />
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الجوال *" type="tel" dir="ltr"
                    className="w-full pl-3 pr-10 py-2.5 border rounded-xl text-sm text-left" required />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onStart({ customerName: name || undefined, customerPhone: phone || undefined, orderType })}
            disabled={loading || (store.requirePhone && !phone)}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            style={{ backgroundColor: store.themeColor }}>
            {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'تصفح المنيو'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Menu Screen
// ============================================================

function MenuScreen({ store, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery,
  onAddToCart, cartItemCount, onViewCart, themeColor }: {
  store: any; selectedCategory: number | null; setSelectedCategory: (id: number | null) => void;
  searchQuery: string; setSearchQuery: (q: string) => void;
  onAddToCart: (id: number, qty: number, notes?: string) => void;
  cartItemCount: number; onViewCart: () => void; themeColor: string;
}) {
  const [addingNotes, setAddingNotes] = useState<{ productId: number; name: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const categories = store.categories || [];

  const filteredProducts = categories.flatMap((c: any) =>
    c.products.filter((p: any) =>
      (selectedCategory === null || selectedCategory === c.id) &&
      (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ).map((p: any) => ({ ...p, categoryName: c.name }))
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">{store.storeName}</h1>
            {store.tableNumber && (
              <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>
                طاولة {store.tableNumber}
              </span>
            )}
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute right-3 top-2.5 text-gray-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث في المنيو..." className="w-full pl-3 pr-10 py-2 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-current" />
          </div>
        </div>

        {/* Categories */}
        <div className="overflow-x-auto px-4 pb-2">
          <div className="flex gap-2 min-w-max">
            <button onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                selectedCategory === null ? 'text-white shadow' : 'bg-gray-100 text-gray-600'
              }`} style={selectedCategory === null ? { backgroundColor: themeColor } : {}}>
              الكل
            </button>
            {categories.map((c: any) => (
              <button key={c.id} onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  selectedCategory === c.id ? 'text-white shadow' : 'bg-gray-100 text-gray-600'
                }`} style={selectedCategory === c.id ? { backgroundColor: themeColor } : {}}>
                {c.name} ({c.products.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12"><Search size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">لا توجد نتائج</p></div>
        ) : (
          filteredProducts.map((p: any) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border p-4 flex gap-3">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <UtensilsCrossed size={24} className="text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm">{p.name}</h3>
                {p.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-sm" style={{ color: themeColor }}>
                    {p.price.toFixed(2)} ر.س
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => { setAddingNotes({ productId: p.id, name: p.name }); setNoteText(''); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                      <MessageSquare size={14} />
                    </button>
                    <button onClick={() => onAddToCart(p.id, 1)}
                      className="px-3 py-1.5 rounded-xl text-white text-xs font-medium shadow-sm hover:shadow transition"
                      style={{ backgroundColor: themeColor }}>
                      <Plus size={14} className="inline ml-0.5" /> أضف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <button onClick={onViewCart}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-base shadow-2xl flex items-center justify-center gap-2 transition hover:opacity-90"
            style={{ backgroundColor: themeColor }}>
            <ShoppingCart size={20} />
            عرض السلة ({cartItemCount})
          </button>
        </div>
      )}

      {/* Notes Modal */}
      {addingNotes && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setAddingNotes(null)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900">ملاحظات — {addingNotes.name}</h3>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="مثال: بدون بصل، اكسترا جبنة..." rows={3}
              className="w-full px-3 py-2.5 border rounded-xl text-sm resize-none" />
            <button onClick={() => { onAddToCart(addingNotes.productId, 1, noteText || undefined); setAddingNotes(null); }}
              className="w-full py-2.5 rounded-xl text-white font-medium" style={{ backgroundColor: themeColor }}>
              أضف للسلة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Cart Screen
// ============================================================

function CartScreen({ cart, onBack, onCheckout, onUpdateItem, onRemoveItem, themeColor }: {
  cart: any; onBack: () => void; onCheckout: () => void;
  onUpdateItem: (id: number, qty: number, notes?: string) => void;
  onRemoveItem: (id: number) => void; themeColor: string;
}) {
  const items = cart?.items || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 bg-white shadow-sm z-20 px-4 py-3 flex items-center gap-3 max-w-lg mx-auto">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100"><ArrowRight size={20} /></button>
        <h1 className="text-lg font-bold flex-1">السلة</h1>
        <ShoppingCart size={20} style={{ color: themeColor }} />
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-16"><ShoppingCart size={48} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">السلة فارغة</p></div>
        ) : (
          <>
            {items.map((item: any) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">{item.productName}</h3>
                    <span className="text-xs text-gray-500">{item.unitPrice.toFixed(2)} ر.س</span>
                    {item.specialNotes && <p className="text-xs text-amber-600 mt-1">📝 {item.specialNotes}</p>}
                  </div>
                  <button onClick={() => onRemoveItem(item.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl">
                    <button onClick={() => item.quantity > 1 ? onUpdateItem(item.id, item.quantity - 1) : onRemoveItem(item.id)}
                      className="p-2 hover:bg-gray-200 rounded-r-xl"><Minus size={14} /></button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => onUpdateItem(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-200 rounded-l-xl"><Plus size={14} /></button>
                  </div>
                  <span className="font-bold text-sm" style={{ color: themeColor }}>{item.totalPrice.toFixed(2)} ر.س</span>
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">المجموع</span><span>{cart.subTotal?.toFixed(2)} ر.س</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">الضريبة (15%)</span><span>{cart.taxAmount?.toFixed(2)} ر.س</span></div>
              {cart.serviceCharge > 0 && (
                <div className="flex justify-between text-sm"><span className="text-gray-500">رسوم خدمة</span><span>{cart.serviceCharge?.toFixed(2)} ر.س</span></div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2" style={{ color: themeColor }}>
                <span>الإجمالي</span><span>{cart.totalAmount?.toFixed(2)} ر.س</span>
              </div>
            </div>
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <button onClick={onCheckout}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-base shadow-2xl transition hover:opacity-90"
            style={{ backgroundColor: themeColor }}>
            متابعة الطلب ({cart.totalAmount?.toFixed(2)} ر.س)
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Checkout Screen
// ============================================================

function CheckoutScreen({ store, cart, onBack, onSubmit, submitting, themeColor }: {
  store: any; cart: any; onBack: () => void; onSubmit: (data: any) => void; submitting: boolean; themeColor: string;
}) {
  const [name, setName] = useState(cart?.customerName || '');
  const [phone, setPhone] = useState(cart?.customerPhone || '');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const paymentMethods = [
    ...(store.allowCashPayment ? [{ id: 'Cash', label: 'كاش (عند الاستلام)', Icon: Banknote, color: '#22c55e' }] : []),
    ...(store.allowOnlinePayment ? [
      { id: 'CardOnline', label: 'بطاقة ائتمان', Icon: CreditCard, color: '#3b82f6' },
      { id: 'ApplePay', label: 'Apple Pay', Icon: Smartphone, color: '#1e293b' },
      { id: 'Mada', label: 'مدى', Icon: CreditCard, color: '#004d40' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 bg-white shadow-sm z-20 px-4 py-3 flex items-center gap-3 max-w-lg mx-auto">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100"><ArrowRight size={20} /></button>
        <h1 className="text-lg font-bold flex-1">إتمام الطلب</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <h3 className="font-bold text-gray-900 mb-3">ملخص الطلب</h3>
          {cart?.items?.map((i: any) => (
            <div key={i.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
              <span>{i.quantity}x {i.productName}</span>
              <span className="font-medium">{i.totalPrice.toFixed(2)} ر.س</span>
            </div>
          ))}
          <div className="flex justify-between font-bold mt-3 pt-2 border-t" style={{ color: themeColor }}>
            <span>الإجمالي</span><span>{cart?.totalAmount?.toFixed(2)} ر.س</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
          <h3 className="font-bold text-gray-900">بيانات التواصل</h3>
          <div className="relative">
            <User size={16} className="absolute right-3 top-3 text-gray-400" />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="الاسم"
              className="w-full pl-3 pr-10 py-2.5 border rounded-xl text-sm" />
          </div>
          <div className="relative">
            <Phone size={16} className="absolute right-3 top-3 text-gray-400" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الجوال" type="tel" dir="ltr"
              className="w-full pl-3 pr-10 py-2.5 border rounded-xl text-sm text-left" />
          </div>
          {cart?.orderType === 'Delivery' && (
            <div className="relative">
              <MapPin size={16} className="absolute right-3 top-3 text-gray-400" />
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="عنوان التوصيل"
                className="w-full pl-3 pr-10 py-2.5 border rounded-xl text-sm" />
            </div>
          )}
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية..."
            rows={2} className="w-full px-3 py-2.5 border rounded-xl text-sm resize-none" />
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
          <h3 className="font-bold text-gray-900">طريقة الدفع</h3>
          <div className="space-y-2">
            {paymentMethods.map(pm => (
              <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition ${
                  paymentMethod === pm.id ? 'border-current shadow-sm' : 'border-gray-200'
                }`} style={{ color: paymentMethod === pm.id ? pm.color : '#6b7280' }}>
                <pm.Icon size={20} />
                <span className="font-medium text-gray-900">{pm.label}</span>
                {paymentMethod === pm.id && <CheckCircle2 size={18} className="mr-auto" style={{ color: pm.color }} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
        <button
          onClick={() => onSubmit({ customerName: name, customerPhone: phone, deliveryAddress: address, notes, paymentMethod })}
          disabled={submitting}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-base shadow-2xl flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: themeColor }}>
          {submitting ? <Loader2 size={20} className="animate-spin" /> : <>تأكيد الطلب</>}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Order Tracking Screen
// ============================================================

function TrackingScreen({ status, store, onNewOrder, themeColor }: {
  status: any; store: any; onNewOrder: () => void; themeColor: string;
}) {
  const [elapsed, setElapsed] = useState(status?.elapsedSeconds || 0);

  useEffect(() => {
    if (status?.elapsedSeconds != null) setElapsed(status.elapsedSeconds);
  }, [status?.elapsedSeconds]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e: number) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isReady = status?.status === 'Ready' || status?.status === 'Served' || status?.status === 'Completed';
  const isCancelled = status?.status === 'Cancelled';

  const steps = [
    { key: 'Confirmed', label: 'تم التأكيد', Icon: CheckCircle2 },
    { key: 'InKitchen', label: 'في المطبخ', Icon: ChefHat },
    { key: 'Preparing', label: 'قيد التحضير', Icon: Clock },
    { key: 'Ready', label: 'جاهز!', Icon: Star },
  ];

  const currentStep = steps.findIndex(s => s.key === status?.status);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${themeColor}10, ${themeColor}05)` }}>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          {/* Store Info */}
          <h2 className="text-lg font-bold text-gray-900">{store?.storeName}</h2>

          {/* Order Number */}
          <div className="bg-white rounded-3xl shadow-lg p-6 space-y-5">
            <div className="text-sm text-gray-500">رقم الطلب</div>
            <div className="text-3xl font-black" style={{ color: themeColor }}>
              {status?.orderNumber || '---'}
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-bold text-lg"
              style={{ backgroundColor: status?.statusColor || themeColor }}>
              {isReady ? <Star size={22} /> : isCancelled ? <AlertCircle size={22} /> : <Clock size={22} />}
              {status?.statusLabel || 'جارٍ التحميل...'}
            </div>

            {/* Timer */}
            {!isReady && !isCancelled && (
              <div className="space-y-2">
                <div className="text-5xl font-black tabular-nums" style={{ color: themeColor }}>
                  {formatTime(elapsed)}
                </div>
                {status?.estimatedMinutes && (
                  <div className="text-sm text-gray-500">
                    الوقت المتوقع: <span className="font-bold">{status.estimatedMinutes} دقيقة</span>
                  </div>
                )}
                {/* Progress */}
                {status?.estimatedMinutes && (
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{
                        backgroundColor: themeColor,
                        width: `${Math.min(100, (elapsed / (status.estimatedMinutes * 60)) * 100)}%`
                      }} />
                  </div>
                )}
              </div>
            )}

            {/* Ready Animation */}
            {isReady && (
              <div className="space-y-2">
                <div className="text-6xl animate-bounce">🎉</div>
                <p className="text-lg font-bold text-green-600">طلبك جاهز للاستلام!</p>
              </div>
            )}
          </div>

          {/* Steps */}
          {!isCancelled && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                {steps.map((step, i) => {
                  const isActive = i <= currentStep;
                  const isCurrent = step.key === status?.status;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCurrent ? 'text-white shadow-lg scale-110' : isActive ? 'text-white' : 'bg-gray-100 text-gray-400'
                      }`} style={isActive ? { backgroundColor: themeColor } : {}}>
                        <step.Icon size={18} />
                      </div>
                      <span className={`text-[10px] font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                      {i < steps.length - 1 && (
                        <div className="absolute" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Order */}
          {(isReady || isCancelled) && (
            <button onClick={onNewOrder}
              className="w-full py-3 rounded-2xl border-2 font-bold transition hover:bg-white/50"
              style={{ borderColor: themeColor, color: themeColor }}>
              طلب جديد
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Utility Screens
// ============================================================

function LoadingScreen({ color }: { color: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Loader2 size={48} className="animate-spin mx-auto" style={{ color }} />
        <p className="text-gray-500 font-medium">جارٍ تحميل المنيو...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 max-w-sm px-4">
        <AlertCircle size={56} className="text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">عذراً</h2>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
}
