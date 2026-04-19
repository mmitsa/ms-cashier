import { useState } from 'react';
import { Clock, Loader2, CheckCircle2, Circle, User, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useShiftsHistory } from '../api';
import { formatCurrency, cn } from '@/lib/utils/cn';
import type { CashierShiftDto } from '../types';

export function ShiftsHistoryScreen() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useShiftsHistory({ page, pageSize });

  const items: CashierShiftDto[] = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center shrink-0">
          <Clock size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            سجل الشيفتات
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            عرض كافة شيفتات الكاشير السابقة والحالية، مع تفاصيل المبيعات والعجز/الزيادة.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Clock size={40} strokeWidth={1} className="mx-auto mb-3" />
            <p className="text-sm">لا توجد شيفتات مسجلة بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">الكاشير</th>
                  <th className="px-4 py-3">بدء الشيفت</th>
                  <th className="px-4 py-3">إغلاق الشيفت</th>
                  <th className="px-4 py-3">افتتاحي</th>
                  <th className="px-4 py-3">مبيعات</th>
                  <th className="px-4 py-3">فواتير</th>
                  <th className="px-4 py-3">العجز/الزيادة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((s) => {
                  const isOpen = s.status === 'Open' || !s.closedAt;
                  const diff = s.difference ?? 0;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        {isOpen ? (
                          <Badge variant="success">
                            <span className="flex items-center gap-1">
                              <Circle size={10} className="fill-emerald-500 text-emerald-500" />
                              مفتوح
                            </span>
                          </Badge>
                        ) : (
                          <Badge variant="info">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={11} /> مُغلق
                            </span>
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {s.userName || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 tabular-nums text-xs">
                        {formatDateTime(s.openedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 tabular-nums text-xs">
                        {s.closedAt ? formatDateTime(s.closedAt) : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums">
                        {formatCurrency(s.openingCash)}
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums">
                        {formatCurrency(s.totalSales ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                          <Receipt size={13} className="text-gray-400" />
                          <span className="tabular-nums">{s.invoiceCount ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {isOpen ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <span
                            className={cn(
                              'font-bold',
                              diff === 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : diff > 0
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-red-600 dark:text-red-400',
                            )}
                          >
                            {diff > 0 && '+'}
                            {formatCurrency(diff)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
            >
              السابق
            </button>
            <span className="text-gray-500 dark:text-gray-400">
              صفحة {page} من {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
