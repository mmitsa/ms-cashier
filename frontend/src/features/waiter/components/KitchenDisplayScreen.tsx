import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChefHat, Clock, CheckCircle2, AlertTriangle, Bell, BellOff,
  UtensilsCrossed, ShoppingBag, Truck, RefreshCw, Maximize, Minimize,
  RotateCcw, Timer, TrendingUp, XCircle, History, Volume2, VolumeX,
  Flame, Zap, ArrowLeft,
} from 'lucide-react';
import {
  useKitchenBoard, useUpdateKitchenItemStatus, useMarkAllReady,
  useKitchenStats, useCompletedKitchenOrders, useRecallOrder,
} from '@/hooks/useApi';

// ── Status config ──

const itemStatusColors: Record<string, string> = {
  Pending: 'bg-gray-100 text-gray-700 border-gray-300',
  Preparing: 'bg-amber-50 text-amber-800 border-amber-300',
  Ready: 'bg-green-50 text-green-800 border-green-300',
  Served: 'bg-blue-50 text-blue-800 border-blue-300',
  Cancelled: 'bg-red-50 text-red-400 border-red-200 line-through opacity-50',
};

const itemStatusLabels: Record<string, string> = {
  Pending: 'معلق',
  Preparing: 'يُحضّر',
  Ready: 'جاهز',
  Served: 'قُدّم',
  Cancelled: 'ملغي',
};

const orderTypeIcons: Record<string, typeof UtensilsCrossed> = {
  DineIn: UtensilsCrossed,
  TakeAway: ShoppingBag,
  Delivery: Truck,
};

const orderTypeLabels: Record<string, string> = {
  DineIn: 'محلي',
  TakeAway: 'سفري',
  Delivery: 'توصيل',
};

const orderTypeBg: Record<string, string> = {
  DineIn: 'from-orange-600 to-orange-700',
  TakeAway: 'from-violet-600 to-violet-700',
  Delivery: 'from-cyan-600 to-cyan-700',
};

function getUrgency(min: number): { color: string; border: string; glow: string; label: string; level: number } {
  if (min < 8) return { color: 'text-emerald-400', border: 'border-emerald-500/40', glow: '', label: 'طبيعي', level: 0 };
  if (min < 15) return { color: 'text-amber-400', border: 'border-amber-500/60', glow: '', label: 'متوسط', level: 1 };
  if (min < 25) return { color: 'text-orange-400', border: 'border-orange-500/70', glow: 'shadow-orange-500/20 shadow-lg', label: 'مستعجل', level: 2 };
  return { color: 'text-red-400', border: 'border-red-500/80', glow: 'shadow-red-500/30 shadow-xl animate-pulse', label: 'متأخر!', level: 3 };
}

// ── Live Timer ──

function LiveTimer({ startTime }: { startTime: string | Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 60000));
    update();
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, [startTime]);

  const urgency = getUrgency(elapsed);

  return (
    <div className={`flex items-center gap-1 font-mono font-bold text-sm ${urgency.color}`}>
      <Clock size={13} />
      <span>{elapsed}د</span>
    </div>
  );
}

// ── Sound Alert ──

function useKitchenSound(enabled: boolean) {
  const prevCountRef = useRef(0);

  const playSound = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch { /* silent fail */ }
  }, [enabled]);

  return { playSound, prevCountRef };
}

// ── Main Screen ──

export function KitchenDisplayScreen() {
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [filter, setFilter] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useKitchenBoard();
  const { data: statsData } = useKitchenStats();
  const updateItemMut = useUpdateKitchenItemStatus();
  const markAllMut = useMarkAllReady();
  const recallMut = useRecallOrder();

  const orders = data?.data ?? [];
  const stats = statsData?.data;

  const { playSound, prevCountRef } = useKitchenSound(soundEnabled);

  // Alert on new orders
  useEffect(() => {
    if (orders.length > prevCountRef.current && prevCountRef.current > 0) {
      playSound();
    }
    prevCountRef.current = orders.length;
  }, [orders.length, playSound, prevCountRef]);

  const filteredOrders = orders
    .filter((o: any) => filter === 'all' || o.orderType === filter)
    .sort((a: any, b: any) => b.minutesElapsed - a.minutesElapsed); // Oldest first (most urgent)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-gray-950 text-white">
      {/* ═══ Header ═══ */}
      <header className="bg-gray-900/95 backdrop-blur px-5 py-3 flex items-center justify-between shrink-0 border-b border-gray-800/50">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
            <ChefHat size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">شاشة المطبخ</h1>
            <p className="text-[11px] text-gray-500">تحديث مباشر · {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div className="flex items-center gap-3">
          <StatPill icon={Flame} label="نشط" value={stats?.activeOrders ?? orders.length} color="text-orange-400" bg="bg-orange-950/50" />
          <StatPill icon={Zap} label="يُحضّر" value={stats?.preparingItems ?? 0} color="text-amber-400" bg="bg-amber-950/50" />
          <StatPill icon={CheckCircle2} label="جاهز" value={stats?.readyItems ?? 0} color="text-green-400" bg="bg-green-950/50" />
          {(stats?.urgentOrders ?? 0) > 0 && (
            <StatPill icon={AlertTriangle} label="متأخر" value={stats?.urgentOrders ?? 0} color="text-red-400" bg="bg-red-950/50 animate-pulse" />
          )}
          <div className="w-px h-8 bg-gray-800" />
          <StatPill icon={TrendingUp} label="متوسط" value={`${stats?.avgPrepTimeMinutes ?? 0}د`} color="text-blue-400" bg="bg-blue-950/50" />
          <StatPill icon={History} label="اليوم" value={stats?.completedToday ?? 0} color="text-emerald-400" bg="bg-emerald-950/50" />
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-gray-800 rounded-xl p-0.5">
            <button onClick={() => setTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === 'active' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              الطلبات النشطة
            </button>
            <button onClick={() => setTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === 'completed' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              المكتملة
            </button>
          </div>

          {/* Filters */}
          <div className="flex bg-gray-800 rounded-xl p-0.5">
            {[{ id: 'all', label: 'الكل' }, { id: 'DineIn', label: 'محلي' }, { id: 'TakeAway', label: 'سفري' }, { id: 'Delivery', label: 'توصيل' }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${filter === f.id ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {f.label}
              </button>
            ))}
          </div>

          <button onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${soundEnabled ? 'bg-gray-800 text-green-400 hover:bg-gray-700' : 'bg-gray-800 text-gray-600 hover:bg-gray-700'}`}
            title={soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}>
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button onClick={() => refetch()}
            className="w-9 h-9 rounded-xl bg-gray-800 text-gray-400 flex items-center justify-center hover:bg-gray-700 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>

          <button onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl bg-gray-800 text-gray-400 flex items-center justify-center hover:bg-gray-700 hover:text-white transition-colors">
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </header>

      {/* ═══ Content ═══ */}
      <div className="flex-1 overflow-auto p-4">
        {tab === 'active' ? (
          <ActiveKitchenBoard
            orders={filteredOrders}
            loading={isLoading}
            onItemStatusChange={(itemId, status) => updateItemMut.mutate({ itemId, status })}
            onAllReady={(orderId) => markAllMut.mutate(orderId)}
          />
        ) : (
          <CompletedOrdersBoard onRecall={(id) => recallMut.mutate(id)} />
        )}
      </div>
    </div>
  );
}

// ── Stat Pill ──

function StatPill({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: any; color: string; bg: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${bg}`}>
      <Icon size={14} className={color} />
      <div className="text-right">
        <p className={`text-sm font-bold ${color}`}>{value}</p>
        <p className="text-[9px] text-gray-500 leading-none">{label}</p>
      </div>
    </div>
  );
}

// ── Active Kitchen Board ──

function ActiveKitchenBoard({ orders, loading, onItemStatusChange, onAllReady }: {
  orders: any[]; loading: boolean;
  onItemStatusChange: (itemId: number, status: string) => void;
  onAllReady: (orderId: number) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 bg-gray-800/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-32">
        <div className="w-24 h-24 rounded-3xl bg-gray-800/50 flex items-center justify-center mx-auto mb-6">
          <ChefHat size={48} className="text-gray-700" />
        </div>
        <h3 className="text-xl font-bold text-gray-500 mb-2">المطبخ فارغ</h3>
        <p className="text-sm text-gray-600">الطلبات ستظهر هنا تلقائياً عند إرسالها من الويتر</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {orders.map((order: any) => (
        <KitchenOrderCard
          key={order.orderId}
          order={order}
          onItemStatusChange={onItemStatusChange}
          onAllReady={onAllReady}
        />
      ))}
    </div>
  );
}

// ── Kitchen Order Card ──

function KitchenOrderCard({ order, onItemStatusChange, onAllReady }: {
  order: any;
  onItemStatusChange: (itemId: number, status: string) => void;
  onAllReady: (orderId: number) => void;
}) {
  const Icon = orderTypeIcons[order.orderType] || UtensilsCrossed;
  const allReady = order.items.every((i: any) => i.kitchenStatus === 'Ready' || i.kitchenStatus === 'Cancelled');
  const urgency = getUrgency(order.minutesElapsed);
  const bgGrad = orderTypeBg[order.orderType] || 'from-gray-600 to-gray-700';

  const pendingCount = order.items.filter((i: any) => i.kitchenStatus === 'Pending' || i.kitchenStatus === 'Preparing').length;

  return (
    <div className={`bg-gray-900 rounded-2xl border-2 overflow-hidden transition-all duration-300 ${urgency.border} ${urgency.glow} ${allReady ? 'opacity-60 scale-[0.98]' : ''}`}>
      {/* Header */}
      <div className={`bg-gradient-to-l ${bgGrad} p-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon size={16} className="opacity-80" />
          <span className="font-bold text-sm">{order.orderNumber}</span>
          <span className="text-[10px] opacity-70 bg-white/15 px-1.5 py-0.5 rounded">{orderTypeLabels[order.orderType]}</span>
        </div>
        <div className="flex items-center gap-2">
          {order.tableNumber && (
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-lg font-bold">T{order.tableNumber}</span>
          )}
          <LiveTimer startTime={order.orderTime} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <div
          className={`h-full transition-all duration-500 ${allReady ? 'bg-green-500' : urgency.level >= 2 ? 'bg-red-500' : 'bg-amber-500'}`}
          style={{ width: `${order.items.length > 0 ? ((order.items.length - pendingCount) / order.items.length) * 100 : 0}%` }}
        />
      </div>

      {/* Items */}
      <div className="p-2.5 space-y-1.5 max-h-[280px] overflow-auto">
        {order.items.map((item: any) => {
          const canToggle = item.kitchenStatus === 'Pending' || item.kitchenStatus === 'Preparing';
          const nextStatus = item.kitchenStatus === 'Pending' ? 'Preparing' : item.kitchenStatus === 'Preparing' ? 'Ready' : null;

          return (
            <div
              key={item.itemId}
              onClick={() => { if (nextStatus) onItemStatusChange(item.itemId, nextStatus); }}
              className={`rounded-xl p-2.5 border transition-all ${canToggle ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''} ${itemStatusColors[item.kitchenStatus]}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black leading-none">{Number(item.quantity)}</span>
                  <span className="text-xs font-medium opacity-40">×</span>
                  <span className="font-semibold text-sm">{item.productName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.kitchenStatus === 'Ready' && <CheckCircle2 size={14} className="text-green-600" />}
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                    {itemStatusLabels[item.kitchenStatus]}
                  </span>
                </div>
              </div>
              {item.specialNotes && (
                <div className="mt-1.5 flex items-start gap-1.5 bg-orange-500/10 rounded-lg px-2 py-1">
                  <AlertTriangle size={11} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-orange-600">{item.specialNotes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-gray-800/50 flex items-center justify-between">
        <div className="text-[10px] text-gray-600">
          <span>{order.waiterName}</span>
          {order.guestCount && <span className="mx-1">·</span>}
          {order.guestCount && <span>{order.guestCount} ضيوف</span>}
        </div>
        {!allReady ? (
          <button
            onClick={() => onAllReady(order.orderId)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-600 text-white text-[11px] font-bold hover:bg-green-500 active:scale-95 transition-all"
          >
            <CheckCircle2 size={13} /> جاهز الكل
          </button>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 text-[11px] font-bold">
            <CheckCircle2 size={13} /> مكتمل
          </div>
        )}
      </div>
    </div>
  );
}

// ── Completed Orders Board ──

function CompletedOrdersBoard({ onRecall }: { onRecall: (id: number) => void }) {
  const { data, isLoading } = useCompletedKitchenOrders(30);
  const orders = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-800/50 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-32">
        <History size={48} className="text-gray-700 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-500">لا توجد طلبات مكتملة اليوم</h3>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="overflow-hidden rounded-2xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-right py-3 px-4 font-semibold text-gray-400">رقم الطلب</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-400">النوع</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-400">الطاولة</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-400">الويتر</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-400">وقت التحضير</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-400">الأصناف</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-400">اكتمل</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-400">إرجاع</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {orders.map((o: any) => {
              const Icon = orderTypeIcons[o.orderType] || UtensilsCrossed;
              return (
                <tr key={o.orderId} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{o.orderNumber}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Icon size={14} /> {orderTypeLabels[o.orderType]}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{o.tableNumber || '—'}</td>
                  <td className="py-3 px-4 text-gray-400">{o.waiterName || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${o.prepTimeMinutes < 15 ? 'text-green-400' : o.prepTimeMinutes < 25 ? 'text-amber-400' : 'text-red-400'}`}>
                      {o.prepTimeMinutes}د
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{o.itemCount} أصناف</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {new Date(o.completedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onRecall(o.orderId)}
                      className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-amber-400 hover:bg-gray-700 transition-colors mx-auto"
                      title="إرجاع للمطبخ"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
