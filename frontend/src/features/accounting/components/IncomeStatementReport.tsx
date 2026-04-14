import { useState } from 'react';
import { AlertCircle, Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import { useIncomeStatement } from '../api';
import type { IncomeStatementLine } from '../types';
import { formatMoney, firstOfMonthISO, todayISO } from '../utils';

function LinesTable({ title, lines, totalLabel, total, tone }: {
  title: string;
  lines: IncomeStatementLine[];
  totalLabel: string;
  total: number;
  tone: 'revenue' | 'expense';
}) {
  const toneClasses = tone === 'revenue'
    ? 'text-emerald-700 dark:text-emerald-300'
    : 'text-red-700 dark:text-red-300';

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        {tone === 'revenue' ? (
          <TrendingUp size={18} className="text-emerald-600" />
        ) : (
          <TrendingDown size={18} className="text-red-500" />
        )}
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      {lines.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">لا توجد بنود</div>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {lines.map((line) => (
              <tr key={line.accountCode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400 w-24">{line.accountCode}</td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{line.accountName}</td>
                <td className="px-4 py-2.5 text-left font-mono tabular-nums">{formatMoney(line.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-800 font-bold">
            <tr>
              <td colSpan={2} className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">{totalLabel}</td>
              <td className={`px-4 py-3 text-left font-mono tabular-nums ${toneClasses}`}>{formatMoney(total)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

export function IncomeStatementReport() {
  const [fromDate, setFromDate] = useState(firstOfMonthISO);
  const [toDate, setToDate] = useState(todayISO);

  const { data, isLoading, isError, refetch } = useIncomeStatement(fromDate, toDate);

  const isProfit = data ? data.netIncome >= 0 : true;

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

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-red-500">
          <AlertCircle size={40} />
          <p className="font-semibold">حدث خطأ أثناء تحميل قائمة الدخل</p>
          <button onClick={() => refetch()} className="btn-secondary text-sm">إعادة المحاولة</button>
        </div>
      ) : !data ? (
        <div className="card py-12 text-center text-gray-500">لا توجد بيانات</div>
      ) : (
        <>
          <LinesTable
            title="الإيرادات"
            lines={data.revenues}
            totalLabel="إجمالي الإيرادات"
            total={data.totalRevenue}
            tone="revenue"
          />
          <LinesTable
            title="المصروفات"
            lines={data.expenses}
            totalLabel="إجمالي المصروفات"
            total={data.totalExpenses}
            tone="expense"
          />

          <div className={`card p-5 flex items-center justify-between border-2 ${
            isProfit ? 'border-emerald-500/30' : 'border-red-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {isProfit ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <TrendingUp size={20} className="text-emerald-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <TrendingDown size={20} className="text-red-500" />
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">النتيجة</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {isProfit ? 'صافي الربح' : 'صافي الخسارة'}
                </p>
              </div>
            </div>
            <span className={`text-2xl font-bold font-mono tabular-nums ${
              isProfit ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {formatMoney(data.netIncome)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
