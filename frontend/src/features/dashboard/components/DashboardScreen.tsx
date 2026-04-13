import {
  ShoppingBag,
  TrendingUp,
  Users,
  AlertTriangle,
  Calendar,
  Download,
  ShoppingCart,
  Package,
  Printer,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils/cn';
import { useUIStore } from '@/store/uiStore';
import { useDashboard } from '@/hooks/useApi';

const DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

function DashboardSkeleton() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-gray-200 animate-pulse" />
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-6 bg-gray-100 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-2 w-full bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="card p-5">
            <div className="h-6 w-28 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
          <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>

      <div className="card p-5">
        <div className="h-6 w-28 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="flex items-end justify-between h-48 px-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
              <div
                className="w-full max-w-[40px] rounded-t-lg bg-gray-200 animate-pulse"
                style={{ height: `${30 + i * 8}%`, minHeight: '20px' }}
              />
              <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4" dir="rtl">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle size={32} className="text-red-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">فشل تحميل البيانات</h3>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6 max-w-sm">
        حدث خطأ أثناء جلب بيانات لوحة التحكم. يرجى المحاولة مرة أخرى.
      </p>
      <button
        onClick={onRetry}
        className="btn-primary flex items-center gap-2"
      >
        <RefreshCw size={18} />
        إعادة المحاولة
      </button>
    </div>
  );
}

export function DashboardScreen() {
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <DashboardError onRetry={() => refetch()} />;
  if (!data) return null;

  const d = data;
  const maxSale = Math.max(...(d.weeklySales?.map((s) => s.total) ?? [1]), 1);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">مرحباً بك</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            ملخص نشاطك التجاري اليوم —{' '}
            {new Date().toLocaleDateString('ar-EG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <Calendar size={15} /> اليوم
          </button>
          <button className="btn-primary">
            <Download size={15} /> تصدير التقرير
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={ShoppingBag}
          label="مبيعات اليوم"
          value={formatCurrency(d.todaySales)}
          color="bg-brand-600"
          sub={`${d.todayInvoices} فاتورة`}
        />
        <StatCard
          icon={BarChart3}
          label="عدد الفواتير"
          value={d.todayInvoices.toString()}
          color="bg-indigo-500"
        />
        <StatCard
          icon={TrendingUp}
          label="صافي الربح"
          value={formatCurrency(d.todayProfit)}
          color="bg-emerald-600"
          sub={`هامش ${d.profitMargin}%`}
        />
        <StatCard
          icon={Users}
          label="عملاء جدد"
          value={d.newCustomers.toString()}
          color="bg-amber-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="أصناف منخفضة"
          value={d.lowStockCount.toString()}
          color="bg-red-500"
          sub="تحتاج إعادة طلب"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">الأصناف الأكثر مبيعاً</h3>
            <button
              onClick={() => setActiveModule('inventory')}
              className="text-sm text-brand-600 hover:text-brand-800"
            >
              عرض الكل
            </button>
          </div>
          <div className="space-y-3">
            {(d.topProducts ?? []).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">لا توجد مبيعات بعد</p>
            ) : (
              (d.topProducts ?? []).map((item, i) => {
                const maxQty = d.topProducts?.[0]?.totalQty || 1;
                return (
                  <div key={item.id} className="flex items-center gap-4">
                    <span className="w-6 text-center text-sm font-bold text-gray-300">
                      #{i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.totalQty} قطعة</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-all duration-500"
                          style={{ width: `${(item.totalQty / maxQty) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-brand-700 dark:text-brand-300 w-24 text-left">
                      {formatCurrency(item.totalRevenue)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar: Quick Actions + Low Stock */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">إجراءات سريعة</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: ShoppingCart, label: 'فاتورة جديدة', action: () => setActiveModule('pos') },
                { icon: Package, label: 'إضافة صنف', action: () => setActiveModule('inventory') },
                { icon: Users, label: 'عميل جديد', action: () => setActiveModule('customers') },
                { icon: Printer, label: 'طباعة باركود', action: () => setActiveModule('inventory') },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-700 dark:hover:text-brand-300 transition-all text-gray-600 dark:text-gray-400 text-xs font-medium"
                >
                  <btn.icon size={20} />
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {(d.lowStockItems ?? []).length > 0 && (
            <div className="bg-gradient-to-br from-red-50 to-amber-50 dark:from-red-950 dark:to-amber-950 rounded-2xl border border-red-100 dark:border-red-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-red-500" />
                <h3 className="font-bold text-red-700">تنبيهات المخزون</h3>
              </div>
              <div className="space-y-2">
                {(d.lowStockItems ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    <Badge variant="danger">
                      {item.quantity} / {item.minStock}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Sales Chart */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">مبيعات الأسبوع</h3>
        <div className="flex items-end justify-between h-48 px-4">
          {(d.weeklySales ?? []).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 w-full text-center py-12">لا توجد بيانات للمبيعات الأسبوعية</p>
          ) : (
            (d.weeklySales ?? []).map((day, i) => {
              const height = maxSale > 0 ? (day.total / maxSale) * 100 : 0;
              const isToday = i === (d.weeklySales?.length ?? 1) - 1;
              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {formatCurrency(day.total)}
                  </span>
                  <div
                    className="w-full max-w-[40px] rounded-t-lg transition-all duration-500 hover:opacity-80"
                    style={{
                      height: `${height}%`,
                      minHeight: '4px',
                      background: isToday
                        ? 'linear-gradient(180deg, #4F46E5, #1e1b4b)'
                        : 'linear-gradient(180deg, #E0E7FF, #C7D2FE)',
                    }}
                  />
                  <span
                    className={`text-xs ${isToday ? 'font-bold text-brand-700' : 'text-gray-400'}`}
                  >
                    {DAYS[i] ?? day.date}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
