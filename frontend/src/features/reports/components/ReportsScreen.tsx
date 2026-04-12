import { useState, useMemo, useCallback } from 'react';
import {
  BarChart3, TrendingUp, Calendar, Download, Loader2, AlertCircle,
  FileSpreadsheet, RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/endpoints';
import { formatCurrency, formatDate } from '@/lib/utils/cn';

type ReportTab = 'sales' | 'profit';

// Default date range: last 30 days
function getDefaultDates(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split('T')[0] ?? '',
    to: to.toISOString().split('T')[0] ?? '',
  };
}

export function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const defaultDates = useMemo(() => getDefaultDates(), []);
  const [dateFrom, setDateFrom] = useState(defaultDates.from);
  const [dateTo, setDateTo] = useState(defaultDates.to);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
          <p className="text-gray-500 text-sm mt-1">تحليل المبيعات والأرباح</p>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-brand-600" />
            <span className="text-sm font-medium text-gray-700">الفترة:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
            />
            <span className="text-gray-400">إلى</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
            />
          </div>
          <button
            onClick={() => { setDateFrom(defaultDates.from); setDateTo(defaultDates.to); }}
            className="text-sm text-brand-600 hover:text-brand-800 font-medium underline"
          >
            آخر 30 يوم
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'sales'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BarChart3 size={16} />
          تقرير المبيعات
        </button>
        <button
          onClick={() => setActiveTab('profit')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'profit'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <TrendingUp size={16} />
          تقرير الأرباح
        </button>
      </div>

      {/* Report Content */}
      {activeTab === 'sales' ? (
        <SalesReport dateFrom={dateFrom} dateTo={dateTo} />
      ) : (
        <ProfitReport dateFrom={dateFrom} dateTo={dateTo} />
      )}
    </div>
  );
}

// ==================== Sales Report ====================

function SalesReport({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'sales', dateFrom, dateTo],
    queryFn: () => reportsApi.sales(dateFrom, dateTo),
    select: (res) => res.data,
    enabled: !!dateFrom && !!dateTo,
    staleTime: 60_000,
  });

  const salesData = data?.dailyBreakdown ?? data?.items ?? data ?? [];
  const totalSales = useMemo(
    () => (Array.isArray(salesData) ? salesData.reduce((sum: number, d: any) => sum + (d.total ?? d.totalAmount ?? 0), 0) : 0),
    [salesData]
  );
  const totalInvoices = useMemo(
    () => (Array.isArray(salesData) ? salesData.reduce((sum: number, d: any) => sum + (d.invoiceCount ?? d.count ?? 0), 0) : 0),
    [salesData]
  );

  const handleExportCSV = useCallback(() => {
    if (!Array.isArray(salesData) || salesData.length === 0) return;
    const headers = ['التاريخ', 'عدد الفواتير', 'الإجمالي'];
    const rows = salesData.map((d: any) => [
      d.date ?? '',
      d.invoiceCount ?? d.count ?? 0,
      d.total ?? d.totalAmount ?? 0,
    ]);
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${dateFrom}-${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [salesData, dateFrom, dateTo]);

  if (isLoading) {
    return (
      <div className="card p-5 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-5">
        <div className="flex flex-col items-center gap-3 py-12 text-red-500">
          <AlertCircle size={40} />
          <p className="font-semibold">حدث خطأ أثناء تحميل التقرير</p>
          <button onClick={() => refetch()} className="btn-secondary text-sm">
            <RefreshCw size={16} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 bg-gradient-to-l from-brand-50 to-white">
          <p className="text-sm text-gray-500">إجمالي المبيعات</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalSales)}</p>
        </div>
        <div className="card p-5 bg-gradient-to-l from-amber-50 to-white">
          <p className="text-sm text-gray-500">إجمالي الفواتير</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalInvoices}</p>
        </div>
      </div>

      {/* Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={20} className="text-brand-600" />
            التفاصيل اليومية
          </h3>
          <button
            onClick={handleExportCSV}
            disabled={!Array.isArray(salesData) || salesData.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium transition-colors disabled:opacity-40"
          >
            <Download size={16} />
            تصدير CSV
          </button>
        </div>

        {!Array.isArray(salesData) || salesData.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <FileSpreadsheet size={48} className="mx-auto text-gray-300 mb-4" />
            <p>لا توجد بيانات في هذه الفترة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500">التاريخ</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500">عدد الفواتير</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500">الإجمالي</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 w-48">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((day: any, i: number) => {
                  const dayTotal = day.total ?? day.totalAmount ?? 0;
                  const dayCount = day.invoiceCount ?? day.count ?? 0;
                  const percentage = totalSales > 0 ? (dayTotal / totalSales) * 100 : 0;
                  return (
                    <tr key={day.date ?? i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {day.date ? formatDate(day.date) : `#${i + 1}`}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{dayCount}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-brand-700">{formatCurrency(dayTotal)}</td>
                      <td className="py-3 px-4">
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className="py-3 px-4 text-sm">الإجمالي</td>
                  <td className="py-3 px-4 text-sm">{totalInvoices}</td>
                  <td className="py-3 px-4 text-sm text-brand-700">{formatCurrency(totalSales)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Profit Report ====================

function ProfitReport({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'profit', dateFrom, dateTo],
    queryFn: () => reportsApi.profit(dateFrom, dateTo),
    select: (res) => res.data,
    enabled: !!dateFrom && !!dateTo,
    staleTime: 60_000,
  });

  const profitData = data?.items ?? data ?? [];
  const totalRevenue = useMemo(
    () => (Array.isArray(profitData) ? profitData.reduce((s: number, p: any) => s + (p.revenue ?? p.totalRevenue ?? 0), 0) : 0),
    [profitData]
  );
  const totalProfit = useMemo(
    () => (Array.isArray(profitData) ? profitData.reduce((s: number, p: any) => s + (p.profit ?? p.totalProfit ?? 0), 0) : 0),
    [profitData]
  );
  const totalCost = useMemo(
    () => (Array.isArray(profitData) ? profitData.reduce((s: number, p: any) => s + (p.cost ?? p.totalCost ?? 0), 0) : 0),
    [profitData]
  );

  const handleExportCSV = useCallback(() => {
    if (!Array.isArray(profitData) || profitData.length === 0) return;
    const headers = ['المنتج', 'الكمية', 'الإيراد', 'التكلفة', 'الربح', 'هامش الربح %'];
    const rows = profitData.map((p: any) => {
      const revenue = p.revenue ?? p.totalRevenue ?? 0;
      const cost = p.cost ?? p.totalCost ?? 0;
      const profit = p.profit ?? p.totalProfit ?? (revenue - cost);
      const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';
      return [p.productName ?? p.name ?? '', p.quantity ?? p.totalQty ?? 0, revenue, cost, profit, margin];
    });
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profit-report-${dateFrom}-${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [profitData, dateFrom, dateTo]);

  if (isLoading) {
    return (
      <div className="card p-5 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-5">
        <div className="flex flex-col items-center gap-3 py-12 text-red-500">
          <AlertCircle size={40} />
          <p className="font-semibold">حدث خطأ أثناء تحميل التقرير</p>
          <button onClick={() => refetch()} className="btn-secondary text-sm">
            <RefreshCw size={16} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-l from-brand-50 to-white">
          <p className="text-sm text-gray-500">الإيرادات</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card p-5 bg-gradient-to-l from-red-50 to-white">
          <p className="text-sm text-gray-500">التكلفة</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalCost)}</p>
        </div>
        <div className="card p-5 bg-gradient-to-l from-emerald-50 to-white">
          <p className="text-sm text-gray-500">صافي الربح</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalProfit)}</p>
        </div>
        <div className="card p-5 bg-gradient-to-l from-amber-50 to-white">
          <p className="text-sm text-gray-500">هامش الربح</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{profitMargin}%</p>
        </div>
      </div>

      {/* Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-600" />
            الربح حسب المنتج
          </h3>
          <button
            onClick={handleExportCSV}
            disabled={!Array.isArray(profitData) || profitData.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium transition-colors disabled:opacity-40"
          >
            <Download size={16} />
            تصدير CSV
          </button>
        </div>

        {!Array.isArray(profitData) || profitData.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <FileSpreadsheet size={48} className="mx-auto text-gray-300 mb-4" />
            <p>لا توجد بيانات في هذه الفترة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500">#</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500">المنتج</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500">الكمية</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500">الإيراد</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500">التكلفة</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500">الربح</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500">الهامش</th>
                </tr>
              </thead>
              <tbody>
                {profitData.map((item: any, i: number) => {
                  const revenue = item.revenue ?? item.totalRevenue ?? 0;
                  const cost = item.cost ?? item.totalCost ?? 0;
                  const profit = item.profit ?? item.totalProfit ?? (revenue - cost);
                  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';
                  const isPositive = profit >= 0;

                  return (
                    <tr key={item.productId ?? item.id ?? i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-400 font-bold">#{i + 1}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {item.productName ?? item.name ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.quantity ?? item.totalQty ?? 0}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-brand-700">{formatCurrency(revenue)}</td>
                      <td className="py-3 px-4 text-sm text-red-600">{formatCurrency(cost)}</td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(profit)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className="py-3 px-4 text-sm" colSpan={3}>الإجمالي</td>
                  <td className="py-3 px-4 text-sm text-brand-700">{formatCurrency(totalRevenue)}</td>
                  <td className="py-3 px-4 text-sm text-red-600">{formatCurrency(totalCost)}</td>
                  <td className="py-3 px-4 text-sm text-emerald-600">{formatCurrency(totalProfit)}</td>
                  <td className="py-3 px-4 text-sm text-amber-600">{profitMargin}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
