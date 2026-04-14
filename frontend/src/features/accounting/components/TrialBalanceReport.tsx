import { useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useTrialBalance } from '../api';
import { AccountCategory } from '../types';
import { formatAmount, formatMoney, firstOfMonthISO, todayISO } from '../utils';

const categoryLabels: Record<AccountCategory, string> = {
  [AccountCategory.Asset]: 'أصول',
  [AccountCategory.Liability]: 'خصوم',
  [AccountCategory.Equity]: 'حقوق ملكية',
  [AccountCategory.Revenue]: 'إيرادات',
  [AccountCategory.Expense]: 'مصروفات',
};

const categoryColors: Record<AccountCategory, string> = {
  [AccountCategory.Asset]: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  [AccountCategory.Liability]: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  [AccountCategory.Equity]: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  [AccountCategory.Revenue]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  [AccountCategory.Expense]: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export function TrialBalanceReport() {
  const [fromDate, setFromDate] = useState(firstOfMonthISO);
  const [toDate, setToDate] = useState(todayISO);

  const { data, isLoading, isError, refetch } = useTrialBalance(fromDate, toDate);

  const isBalanced = data ? Math.abs(data.totalDebit - data.totalCredit) < 0.005 : true;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <Calendar size={16} className="text-gray-400" />
        <label className="text-sm text-gray-600 dark:text-gray-400">من</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:border-brand-500 outline-none"
        />
        <label className="text-sm text-gray-600 dark:text-gray-400">إلى</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:border-brand-500 outline-none"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-red-500">
          <AlertCircle size={40} />
          <p className="font-semibold">حدث خطأ أثناء تحميل ميزان المراجعة</p>
          <button onClick={() => refetch()} className="btn-secondary text-sm">إعادة المحاولة</button>
        </div>
      ) : !data || data.rows.length === 0 ? (
        <div className="card py-12 text-center text-gray-500">لا توجد حركات في هذه الفترة</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-3 py-3 text-right font-semibold">الرمز</th>
                  <th className="px-3 py-3 text-right font-semibold">الاسم</th>
                  <th className="px-3 py-3 text-right font-semibold">التصنيف</th>
                  <th className="px-3 py-3 text-left font-semibold">افتتاحي مدين</th>
                  <th className="px-3 py-3 text-left font-semibold">افتتاحي دائن</th>
                  <th className="px-3 py-3 text-left font-semibold">حركة مدين</th>
                  <th className="px-3 py-3 text-left font-semibold">حركة دائن</th>
                  <th className="px-3 py-3 text-left font-semibold">ختامي مدين</th>
                  <th className="px-3 py-3 text-left font-semibold">ختامي دائن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.rows.map((row) => (
                  <tr key={row.accountCode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-700 dark:text-gray-300">{row.accountCode}</td>
                    <td className="px-3 py-2.5 text-gray-900 dark:text-gray-100">{row.accountName}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-[11px] font-medium ${categoryColors[row.category]}`}>
                        {categoryLabels[row.category]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-left font-mono tabular-nums">{formatAmount(row.openingDebit)}</td>
                    <td className="px-3 py-2.5 text-left font-mono tabular-nums">{formatAmount(row.openingCredit)}</td>
                    <td className="px-3 py-2.5 text-left font-mono tabular-nums">{formatAmount(row.periodDebit)}</td>
                    <td className="px-3 py-2.5 text-left font-mono tabular-nums">{formatAmount(row.periodCredit)}</td>
                    <td className="px-3 py-2.5 text-left font-mono tabular-nums font-semibold">{formatAmount(row.closingDebit)}</td>
                    <td className="px-3 py-2.5 text-left font-mono tabular-nums font-semibold">{formatAmount(row.closingCredit)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 font-bold">
                <tr>
                  <td colSpan={7} className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {isBalanced ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs">
                          <CheckCircle2 size={14} /> متوازن
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-xs">
                          <XCircle size={14} /> غير متوازن
                        </span>
                      )}
                      <span className="text-gray-600 dark:text-gray-300">الإجمالي</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-left font-mono tabular-nums text-gray-900 dark:text-gray-100">{formatMoney(data.totalDebit)}</td>
                  <td className="px-3 py-3 text-left font-mono tabular-nums text-gray-900 dark:text-gray-100">{formatMoney(data.totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
