import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Store, CheckCircle, Banknote } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/cn';
import {
  onCustomerDisplayMessage,
  type DisplayMessage,
  type DisplayOrderItem,
} from '@/lib/customerDisplayChannel';

// ── Types ───────────────────────────────────────────────────────────────────

type OrderState = {
  items: DisplayOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
};

type PaymentState = {
  paid: number;
  change: number;
  method: string;
};

type StoreInfo = {
  name: string;
  logo?: string;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function getStoreInfo(): StoreInfo {
  const params = new URLSearchParams(window.location.search);
  const nameFromParam = params.get('store');
  const logoFromParam = params.get('logo') || undefined;

  const nameFromStorage = localStorage.getItem('mpos-store-name');
  const logoFromStorage = localStorage.getItem('mpos-store-logo') || undefined;

  return {
    name: nameFromParam || nameFromStorage || 'MPOS',
    logo: logoFromParam || logoFromStorage,
  };
}

// ── Clock ───────────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-gray-400 text-sm font-mono tabular-nums">
      {time.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}
    </div>
  );
}

// ── Welcome Screen (Idle) ───────────────────────────────────────────────────

function WelcomeScreen({ store }: { store: StoreInfo }) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col items-center justify-center gap-8 px-8"
    >
      {store.logo ? (
        <img
          src={store.logo}
          alt={store.name}
          className="w-32 h-32 object-contain rounded-2xl"
        />
      ) : (
        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
          <Store size={56} className="text-white" />
        </div>
      )}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-white">{store.name}</h1>
        <p className="text-xl text-gray-400">أهلاً وسهلاً بكم</p>
      </div>
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-8 flex items-center gap-3 text-gray-500"
      >
        <ShoppingCart size={20} />
        <span className="text-sm">في انتظار الطلب...</span>
      </motion.div>
    </motion.div>
  );
}

// ── Payment Complete Screen ─────────────────────────────────────────────────

function PaymentCompleteScreen({
  payment,
  total,
  store,
}: {
  payment: PaymentState;
  total: number;
  store: StoreInfo;
}) {
  return (
    <motion.div
      key="payment-complete"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col items-center justify-center gap-6 px-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle size={56} className="text-emerald-400" />
        </div>
      </motion.div>

      <h2 className="text-3xl font-bold text-white">تمت العملية بنجاح</h2>

      <div className="w-full max-w-md space-y-4 mt-4">
        <div className="bg-gray-800/60 rounded-2xl p-6 space-y-4 border border-gray-700/50">
          <div className="flex items-center justify-between text-lg">
            <span className="text-gray-400">الإجمالي</span>
            <span className="font-bold text-white">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between text-lg">
            <span className="text-gray-400">طريقة الدفع</span>
            <span className="font-medium text-gray-200">{payment.method}</span>
          </div>
          <div className="h-px bg-gray-700" />
          <div className="flex items-center justify-between text-lg">
            <span className="text-gray-400">المبلغ المدفوع</span>
            <span className="font-bold text-emerald-400">
              {formatCurrency(payment.paid)}
            </span>
          </div>
          {payment.change > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between text-xl bg-amber-500/10 -mx-3 px-3 py-3 rounded-xl border border-amber-500/20"
            >
              <span className="text-amber-400 flex items-center gap-2">
                <Banknote size={20} />
                الباقي
              </span>
              <span className="font-bold text-amber-300 text-2xl">
                {formatCurrency(payment.change)}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      <p className="text-gray-500 mt-6 text-lg">
        شكراً لتسوقكم في{' '}
        <span className="text-brand-400 font-bold">{store.name}</span>
      </p>
    </motion.div>
  );
}

// ── Active Order Screen ─────────────────────────────────────────────────────

function ActiveOrderScreen({ order }: { order: OrderState }) {
  return (
    <motion.div
      key="active-order"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart size={22} className="text-brand-400" />
          <h2 className="text-xl font-bold text-white">الطلب الحالي</h2>
        </div>
        <div className="bg-brand-500/20 text-brand-400 px-4 py-1.5 rounded-full text-sm font-bold">
          {order.items.length} {order.items.length === 1 ? 'صنف' : 'أصناف'}
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 text-xs text-gray-500 font-bold uppercase tracking-wider pb-3 border-b border-gray-800 mb-2">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">الصنف</div>
          <div className="col-span-2 text-center">الكمية</div>
          <div className="col-span-2 text-center">السعر</div>
          <div className="col-span-2 text-left">المجموع</div>
        </div>

        <AnimatePresence mode="popLayout">
          {order.items.map((item, idx) => (
            <motion.div
              key={`${item.name}-${idx}`}
              layout
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30, height: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-12 gap-4 py-3.5 border-b border-gray-800/50 items-center text-sm"
            >
              <div className="col-span-1 text-center text-gray-600 font-mono">
                {idx + 1}
              </div>
              <div className="col-span-5 text-white font-medium truncate">
                {item.name}
              </div>
              <div className="col-span-2 text-center">
                <span className="bg-gray-800 text-gray-200 px-3 py-1 rounded-lg font-bold text-base">
                  {item.quantity}
                </span>
              </div>
              <div className="col-span-2 text-center text-gray-400">
                {formatCurrency(item.unitPrice)}
              </div>
              <div className="col-span-2 text-left text-white font-bold">
                {formatCurrency(item.total)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Totals */}
      <div className="border-t border-gray-700 bg-gray-900/80 px-8 py-5 space-y-3">
        <div className="flex items-center justify-between text-gray-400">
          <span>المجموع الفرعي</span>
          <span className="font-medium text-gray-300">
            {formatCurrency(order.subtotal)}
          </span>
        </div>
        {order.tax > 0 && (
          <div className="flex items-center justify-between text-gray-400">
            <span>الضريبة</span>
            <span className="font-medium text-gray-300">
              {formatCurrency(order.tax)}
            </span>
          </div>
        )}
        {order.discount > 0 && (
          <div className="flex items-center justify-between text-red-400">
            <span>الخصم</span>
            <span className="font-medium">-{formatCurrency(order.discount)}</span>
          </div>
        )}
        <div className="h-px bg-gray-700" />
        <motion.div
          key={order.total}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-between text-2xl"
        >
          <span className="text-white font-bold">الإجمالي</span>
          <span className="font-bold text-brand-400 text-3xl">
            {formatCurrency(order.total)}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function CustomerDisplayPage() {
  const [store, setStore] = useState<StoreInfo>(getStoreInfo);
  const [order, setOrder] = useState<OrderState | null>(null);
  const [payment, setPayment] = useState<PaymentState | null>(null);
  const [lastTotal, setLastTotal] = useState(0);

  // Auto-fullscreen on load
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // User may need to interact first; ignore
      }
    };
    enterFullscreen();
  }, []);

  const handleMessage = useCallback((msg: DisplayMessage) => {
    switch (msg.type) {
      case 'UPDATE_ORDER':
        setPayment(null);
        setOrder({
          items: msg.items,
          subtotal: msg.subtotal,
          tax: msg.tax,
          discount: msg.discount,
          total: msg.total,
        });
        setLastTotal(msg.total);
        break;
      case 'PAYMENT_COMPLETE':
        setPayment({
          paid: msg.paid,
          change: msg.change,
          method: msg.method,
        });
        break;
      case 'CLEAR_ORDER':
        setOrder(null);
        setPayment(null);
        break;
      case 'STORE_INFO':
        setStore({ name: msg.name, logo: msg.logo });
        localStorage.setItem('mpos-store-name', msg.name);
        if (msg.logo) localStorage.setItem('mpos-store-logo', msg.logo);
        break;
    }
  }, []);

  useEffect(() => {
    const cleanup = onCustomerDisplayMessage(handleMessage);
    return cleanup;
  }, [handleMessage]);

  const isIdle = !order && !payment;
  const isPaid = !!payment;
  const hasItems = order && order.items.length > 0;

  return (
    <div
      dir="rtl"
      className="h-screen w-screen flex flex-col bg-gray-950 text-white overflow-hidden select-none"
      style={{
        fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif",
      }}
    >
      {/* Top bar */}
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3">
          {store.logo ? (
            <img
              src={store.logo}
              alt={store.name}
              className="w-8 h-8 rounded-lg object-contain"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
          )}
          <span className="font-bold text-lg text-white">{store.name}</span>
        </div>
        <LiveClock />
      </div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {isIdle && <WelcomeScreen store={store} />}
        {isPaid && (
          <PaymentCompleteScreen
            payment={payment}
            total={lastTotal}
            store={store}
          />
        )}
        {!isIdle && !isPaid && hasItems && (
          <ActiveOrderScreen order={order} />
        )}
        {!isIdle && !isPaid && !hasItems && <WelcomeScreen store={store} />}
      </AnimatePresence>
    </div>
  );
}
