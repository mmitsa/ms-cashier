import { useState, useCallback } from 'react';
import {
  Receipt, TrendingUp, FileText, CreditCard, Plus, Eye, Printer,
  Search, RotateCcw, Send, X, ChevronLeft, ChevronRight, Loader2, AlertCircle,
  Calendar, Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import {
  useInvoices, useInvoiceById, useCreateReturn, useReportToZatca,
} from '@/hooks/useApi';
import {
  formatCurrency, formatDate, formatDateTime,
  getPaymentMethodLabel, getPaymentStatusLabel, getInvoiceTypeLabel,
} from '@/lib/utils/cn';
import { useUIStore } from '@/store/uiStore';
import type { InvoiceDto, InvoiceSearchRequest, InvoiceItemDto } from '@/types/api.types';
import { PaymentMethod, PaymentStatus, InvoiceType } from '@/types/api.types';

// ==================== Constants ====================

type TabFilter = 'all' | 'complete' | 'pending' | 'partial' | 'installment';

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'complete', label: 'مكتمل' },
  { key: 'pending', label: 'معلق' },
  { key: 'partial', label: 'جزئي' },
  { key: 'installment', label: 'تقسيط' },
];

function getPaymentStatusFromTab(tab: TabFilter): PaymentStatus | undefined {
  switch (tab) {
    case 'complete': return PaymentStatus.Paid;
    case 'pending': return PaymentStatus.Unpaid;
    case 'partial': return PaymentStatus.Partial;
    default: return undefined;
  }
}

function getStatusBadgeVariant(status: number): 'success' | 'danger' | 'warning' | 'default' {
  switch (status) {
    case PaymentStatus.Paid: return 'success';
    case PaymentStatus.Unpaid: return 'danger';
    case PaymentStatus.Partial: return 'warning';
    default: return 'default';
  }
}

// ==================== Main Component ====================

export function SalesScreen() {
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  // Search & filter state
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal state
  const [viewInvoiceId, setViewInvoiceId] = useState<number>(0);
  const [returnInvoiceId, setReturnInvoiceId] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  // Build search params
  const searchParams: InvoiceSearchRequest = {
    ...(searchText && { search: searchText }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(activeTab === 'installment'
      ? { paymentMethod: PaymentMethod.Installment }
      : getPaymentStatusFromTab(activeTab) !== undefined
        ? { paymentStatus: getPaymentStatusFromTab(activeTab) }
        : {}),
    invoiceType: InvoiceType.Sale,
    page,
    pageSize,
  };

  const { data: invoicesData, isLoading, isError, refetch } = useInvoices(searchParams);
  const reportToZatca = useReportToZatca();

  const invoices = invoicesData?.items ?? [];
  const totalCount = invoicesData?.totalCount ?? 0;
  const totalPages = invoicesData?.totalPages ?? 1;

  const handleNewSale = () => setActiveModule('pos');

  const handleTabChange = (tab: TabFilter) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearch = () => setPage(1);

  const handleZatcaReport = useCallback((invoiceId: number) => {
    reportToZatca.mutate(invoiceId);
  }, [reportToZatca]);

  const handlePrint = useCallback((invoice: InvoiceDto) => {
    // Open print-friendly view in new window
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl"><head><title>فاتورة ${invoice.invoiceNumber}</title>
      <style>body{font-family:sans-serif;padding:20px;font-size:14px}
      table{width:100%;border-collapse:collapse}th,td{padding:6px;border-bottom:1px solid #eee;text-align:right}
      .total{font-size:18px;font-weight:bold;margin-top:16px}</style></head><body>
      <h2>فاتورة رقم: ${invoice.invoiceNumber}</h2>
      <p>التاريخ: ${formatDateTime(invoice.invoiceDate)}</p>
      <p>العميل: ${invoice.contactName || 'عميل نقدي'}</p>
      <p>طريقة الدفع: ${getPaymentMethodLabel(invoice.paymentMethod)}</p>
      <hr/>
      <table><thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
      <tbody>${invoice.items?.map(it => `<tr><td>${it.productName}</td><td>${it.quantity}</td><td>${it.unitPrice}</td><td>${it.totalPrice}</td></tr>`).join('') ?? ''}</tbody></table>
      <div class="total">الإجمالي: ${formatCurrency(invoice.totalAmount)}</div>
      <script>window.print()</script></body></html>
    `);
    printWindow.document.close();
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المبيعات</h1>
          <p className="text-gray-500 text-sm mt-1">عرض وإدارة فواتير المبيعات</p>
        </div>
        <button onClick={handleNewSale} className="btn-primary shrink-0">
          <Plus size={18} />
          فاتورة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Receipt}
          label="إجمالي الفواتير"
          value={totalCount}
          color="bg-brand-600"
        />
        <StatCard
          icon={FileText}
          label="الصفحة الحالية"
          value={`${page} / ${totalPages}`}
          color="bg-amber-500"
        />
        <StatCard
          icon={TrendingUp}
          label="فواتير الصفحة"
          value={invoices.length}
          color="bg-emerald-600"
        />
        <StatCard
          icon={CreditCard}
          label="حجم الصفحة"
          value={pageSize}
          color="bg-violet-500"
        />
      </div>

      {/* Search & Filters */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث برقم الفاتورة أو اسم العميل..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters ? 'bg-brand-50 border-brand-200 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            فلاتر
          </button>
          <button onClick={() => refetch()} className="btn-secondary shrink-0">
            <RotateCcw size={16} />
            تحديث
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none"
                placeholder="من تاريخ"
              />
              <span className="text-gray-400 text-sm">إلى</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none"
                placeholder="إلى تاريخ"
              />
            </div>
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setSearchText(''); setActiveTab('all'); setPage(1); }}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              مسح الفلاتر
            </button>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading / Error / Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-red-500">
            <AlertCircle size={40} />
            <p className="font-semibold">حدث خطأ أثناء تحميل الفواتير</p>
            <button onClick={() => refetch()} className="btn-secondary text-sm">
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500">رقم الفاتورة</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500">التاريخ</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500">العميل</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500">طريقة الدفع</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500">الحالة</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500">المبلغ</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        لا توجد فواتير مطابقة للبحث
                      </td>
                    </tr>
                  ) : (
                    invoices.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{sale.invoiceNumber}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(sale.invoiceDate)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {sale.contactName || 'عميل نقدي'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="info">
                            {getPaymentMethodLabel(sale.paymentMethod)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusBadgeVariant(sale.paymentStatus)}>
                            {getPaymentStatusLabel(sale.paymentStatus)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => setViewInvoiceId(sale.id)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-brand-600 transition-colors"
                              title="عرض"
                            >
                              <Eye size={17} />
                            </button>
                            <button
                              onClick={() => handlePrint(sale)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-brand-600 transition-colors"
                              title="طباعة"
                            >
                              <Printer size={17} />
                            </button>
                            <button
                              onClick={() => setReturnInvoiceId(sale.id)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-orange-600 transition-colors"
                              title="مرتجع"
                            >
                              <RotateCcw size={17} />
                            </button>
                            <button
                              onClick={() => handleZatcaReport(sale.id)}
                              disabled={reportToZatca.isPending}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-green-600 transition-colors disabled:opacity-50"
                              title="إرسال لزاتكا"
                            >
                              <Send size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  عرض {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} من {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {viewInvoiceId > 0 && (
        <InvoiceDetailModal
          invoiceId={viewInvoiceId}
          onClose={() => setViewInvoiceId(0)}
        />
      )}

      {/* Return Modal */}
      {returnInvoiceId > 0 && (
        <ReturnInvoiceModal
          invoiceId={returnInvoiceId}
          onClose={() => setReturnInvoiceId(0)}
        />
      )}
    </div>
  );
}

// ==================== Invoice Detail Modal ====================

function InvoiceDetailModal({ invoiceId, onClose }: { invoiceId: number; onClose: () => void }) {
  const { data: invoice, isLoading, isError } = useInvoiceById(invoiceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">تفاصيل الفاتورة</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-brand-600" />
          </div>
        ) : isError || !invoice ? (
          <div className="flex flex-col items-center gap-3 py-16 text-red-500">
            <AlertCircle size={40} />
            <p>حدث خطأ أثناء تحميل الفاتورة</p>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Invoice Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="رقم الفاتورة" value={invoice.invoiceNumber} />
              <InfoRow label="النوع" value={getInvoiceTypeLabel(invoice.invoiceType)} />
              <InfoRow label="التاريخ" value={formatDateTime(invoice.invoiceDate)} />
              <InfoRow label="العميل" value={invoice.contactName || 'عميل نقدي'} />
              <InfoRow label="المخزن" value={invoice.warehouseName} />
              <InfoRow label="طريقة الدفع" value={getPaymentMethodLabel(invoice.paymentMethod)} />
              <InfoRow label="الحالة" value={getPaymentStatusLabel(invoice.paymentStatus)} />
              <InfoRow label="بواسطة" value={invoice.createdByName} />
            </div>

            {/* Items Table */}
            {invoice.items && invoice.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-2 px-3 font-semibold">الصنف</th>
                      <th className="py-2 px-3 font-semibold">الكمية</th>
                      <th className="py-2 px-3 font-semibold">السعر</th>
                      <th className="py-2 px-3 font-semibold">الخصم</th>
                      <th className="py-2 px-3 font-semibold">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="py-2 px-3">{item.productName}</td>
                        <td className="py-2 px-3">{item.quantity} {item.unitName}</td>
                        <td className="py-2 px-3">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 px-3">{formatCurrency(item.discountAmount)}</td>
                        <td className="py-2 px-3 font-semibold">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">المجموع الفرعي</span>
                <span className="font-medium">{formatCurrency(invoice.subTotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>الخصم</span>
                  <span>-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">الضريبة</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                <span>الإجمالي</span>
                <span className="text-brand-700">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">المدفوع</span>
                <span className="text-emerald-600 font-medium">{formatCurrency(invoice.paidAmount)}</span>
              </div>
              {invoice.dueAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">المتبقي</span>
                  <span className="text-red-600 font-medium">{formatCurrency(invoice.dueAmount)}</span>
                </div>
              )}
            </div>

            {invoice.notes && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700">ملاحظات: </span>
                <span className="text-gray-600">{invoice.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-500">{label}: </span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

// ==================== Return Invoice Modal ====================

function ReturnInvoiceModal({ invoiceId, onClose }: { invoiceId: number; onClose: () => void }) {
  const { data: invoice, isLoading } = useInvoiceById(invoiceId);
  const createReturn = useCreateReturn();
  const [returnItems, setReturnItems] = useState<Record<number, number>>({});

  const handleQuantityChange = (productId: number, qty: number) => {
    setReturnItems((prev) => ({ ...prev, [productId]: qty }));
  };

  const handleSubmitReturn = () => {
    if (!invoice) return;
    const items = Object.entries(returnItems)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const original = invoice.items.find((it) => it.productId === Number(productId));
        return {
          productId: Number(productId),
          quantity,
          unitPrice: original?.unitPrice ?? 0,
        };
      });

    if (items.length === 0) return;

    createReturn.mutate(
      { invoiceId, items },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">مرتجع فاتورة</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {isLoading || !invoice ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              فاتورة رقم: <span className="font-semibold">{invoice.invoiceNumber}</span>
            </p>
            <p className="text-sm text-gray-500">حدد الأصناف والكميات المراد إرجاعها:</p>

            <div className="space-y-3">
              {invoice.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500">
                      الكمية الأصلية: {item.quantity} • السعر: {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={item.quantity}
                    value={returnItems[item.productId] ?? 0}
                    onChange={(e) => handleQuantityChange(item.productId, Math.min(item.quantity, Math.max(0, Number(e.target.value))))}
                    className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-center text-sm focus:border-brand-500 outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleSubmitReturn}
                disabled={createReturn.isPending || Object.values(returnItems).every((q) => !q)}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {createReturn.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RotateCcw size={18} />
                )}
                تأكيد المرتجع
              </button>
              <button onClick={onClose} className="btn-secondary flex-1">
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
