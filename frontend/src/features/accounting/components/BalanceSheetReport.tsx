import { useState } from 'react';
import { AlertCircle, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useBalanceSheet } from '../api';
import type { BalanceSheetLine } from '../types';
import { formatMoney, todayISO } from '../utils';

function Section({ title, lines, totalLabel, total, extra }: {
  title: string;
  lines: BalanceSheetLine[];
  totalLabel: string;
  total: number;
  extra?: { label: string; value: number };
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      {lines.length === 0 && !extra ? (
        <div className="py-8 text-center text-sm text-gray-500">لا توجد بنود</div>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {lines.map((line) => (
              <tr key={line.accountCode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400 w-20">{line.accountCode}</td>
                <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{line.accountName}</td>
                <td className="px-4 py-2.5 text-left font-mono tabular-nums">{formatMoney(line.balance)}</td>
              </tr>
            ))}
            {extra && (
              <tr className="bg-gray-50/60 dark:bg-gray-800/40">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">—</td>
                <td className="px-4 py-2.5 text-gray-700 dark:text-gray-200 italic">{extra.label}</td>
                <td className="px-4 py-2.5 text-left font-mono tabular-nums">{formatMoney(extra.value)}</td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-800 font-bold">
            <tr>
              <td colSpan={2} className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">{totalLabel}</td>
              <td className="px-4 py-3 text-left font-mono tabular-nums text-gray-900 dark:text-gray-100">{formatMoney(total)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

export function BalanceSheetReport() {
  const [asOfDate, setAsOfDate] = useState(todayISO);

  const { data, isLoading, isError, refetch } = useBalanceSheet(asOfDate);

  const liabilitiesPlusEquity = data ? data.totalLiabilities + data.totalEquity + data.retainedEarnings : 0;
  const difference = data ? data.totalAssets - liabilitiesPlusEquity : 0;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Filter */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <Calendar size={16} className="text-gray-400" />
        <label className="text-sm text-gray-600 dark:text-gray-400">كما في تاريخ</label>
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:border-brand-500 outline-none"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      ) : isError ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-red-500">
          <AlertCircle size={40} />
          <p className="font-semibold">حدث خطأ أثناء تحميل الميزانية</p>
          <button onClick={() => refetch()} className="btn-secondary text-sm">إعادة المحاولة</button>
        </div>
      ) : !data ? (
        <div className="card py-12 text-center text-gray-500">لا توجد بيانات</div>
      ) : (
        <>
          {/* Balance status banner */}
          {data.isBalanced ? (
            <div className="card p-3 flex items-center gap-3 border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                الميزانية متوازنة
              </p>
            </div>
          ) : (
            <div className="card p-3 flex items-center gap-3 border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40">
              <AlertTriangle size={18} className="text-red-600" />
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                الميزانية غير متوازنة — الفرق: {formatMoney(difference)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section
              title="الأصول"
              lines={data.assets}
              totalLabel="إجمالي الأصول"
              total={data.totalAssets}
            />
            <div className="space-y-4">
              <Section
                title="الخصوم"
                lines={data.liabilities}
                totalLabel="إجمالي الخصوم"
                total={data.totalLiabilities}
              />
              <Section
                title="حقوق الملكية"
                lines={data.equity}
                totalLabel="إجمالي حقوق الملكية"
                total={data.totalEquity + data.retainedEarnings}
                extra={{ label: 'الأرباح المحتجزة', value: data.retainedEarnings }}
              />
            </div>
          </div>

          <div className="card p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">إجمالي الخصوم + حقوق الملكية</span>
            <span className="font-mono tabular-nums font-bold text-gray-900 dark:text-gray-100">
              {formatMoney(liabilitiesPlusEquity)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
