import { useMemo, useState } from 'react';
import { AlertCircle, Calendar, Download, Printer } from 'lucide-react';
import { useContactStatement } from '../api';
import type { ContactStatementEntry } from '../types';
import { formatMoney, firstOfMonthISO, todayISO } from '../utils';
import { ContactPicker } from './ContactPicker';

type SelectedContact = { contactId: number; contactName: string } | null;

function balanceClass(v: number): string {
  if (v > 0.005) return 'text-emerald-600 dark:text-emerald-400';
  if (v < -0.005) return 'text-red-600 dark:text-red-400';
  return 'text-gray-500 dark:text-gray-400';
}

function csvEscape(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(
  filename: string,
  openingBalance: number,
  closingBalance: number,
  entries: ContactStatementEntry[],
) {
  const rows: string[] = [];
  rows.push(['التاريخ', 'رقم القيد', 'المرجع', 'البيان', 'مدين', 'دائن', 'الرصيد الجاري'].map(csvEscape).join(','));
  rows.push(['', '', '', 'رصيد افتتاحي', '', '', openingBalance.toFixed(2)].map(csvEscape).join(','));
  for (const e of entries) {
    rows.push(
      [
        e.date?.slice(0, 10) ?? '',
        e.entryNumber,
        e.reference ?? '',
        e.description ?? '',
        e.debit.toFixed(2),
        e.credit.toFixed(2),
        e.runningBalance.toFixed(2),
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  rows.push(['', '', '', 'رصيد ختامي', '', '', closingBalance.toFixed(2)].map(csvEscape).join(','));
  const csv = '\ufeff' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ContactStatementReport() {
  const [contact, setContact] = useState<SelectedContact>(null);
  const [fromDate, setFromDate] = useState(firstOfMonthISO);
  const [toDate, setToDate] = useState(todayISO);

  const { data, isLoading, isError, refetch } = useContactStatement(
    contact?.contactId,
    fromDate,
    toDate,
  );

  const netChange = useMemo(() => {
    if (!data) return 0;
    return data.closingBalance - data.openingBalance;
  }, [data]);

  const handleExport = () => {
    if (!data) return;
    const fname = `contact-statement-${data.contactName}-${fromDate}_${toDate}.csv`;
    downloadCsv(fname, data.openingBalance, data.closingBalance, data.entries);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <ContactPicker value={contact} onChange={setContact} />
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
        <div className="ms-auto flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!data}
            className="btn-secondary text-sm inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <Printer size={14} /> طباعة / تصدير PDF
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!data}
            className="btn-secondary text-sm inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download size={14} /> تصدير CSV
          </button>
        </div>
      </div>

      {!contact ? (
        <div className="card py-12 text-center text-gray-500">ابحث باسم العميل أو المورد</div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-red-500">
          <AlertCircle size={40} />
          <p className="font-semibold">حدث خطأ أثناء تحميل كشف الحساب</p>
          <button onClick={() => refetch()} className="btn-secondary text-sm">إعادة المحاولة</button>
        </div>
      ) : !data ? (
        <div className="card py-12 text-center text-gray-500">لا توجد بيانات</div>
      ) : (
        <>
          {/* Summary header */}
          <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">الحساب</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">{data.contactName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">الرصيد الافتتاحي</div>
              <div className={`text-lg font-semibold mt-1 font-mono tabular-nums ${balanceClass(data.openingBalance)}`}>
                {formatMoney(data.openingBalance)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">صافي الحركة</div>
              <div className={`text-lg font-semibold mt-1 font-mono tabular-nums ${balanceClass(netChange)}`}>
                {formatMoney(netChange)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">الرصيد الختامي</div>
              <div className={`text-lg font-bold mt-1 font-mono tabular-nums ${balanceClass(data.closingBalance)}`}>
                {formatMoney(data.closingBalance)}
              </div>
            </div>
          </div>

          {/* Entries table */}
          <div className="card overflow-hidden">
            <div className="max-h-[65vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="px-3 py-3 text-right font-semibold">التاريخ</th>
                    <th className="px-3 py-3 text-right font-semibold">رقم القيد</th>
                    <th className="px-3 py-3 text-right font-semibold">المرجع</th>
                    <th className="px-3 py-3 text-right font-semibold">البيان</th>
                    <th className="px-3 py-3 text-left font-semibold">مدين</th>
                    <th className="px-3 py-3 text-left font-semibold">دائن</th>
                    <th className="px-3 py-3 text-left font-semibold">الرصيد الجاري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {/* Opening balance row */}
                  <tr className="bg-gray-50/60 dark:bg-gray-800/40">
                    <td className="px-3 py-2.5 text-gray-500">—</td>
                    <td className="px-3 py-2.5 text-gray-500">—</td>
                    <td className="px-3 py-2.5 text-gray-500">—</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-200">رصيد افتتاحي</td>
                    <td className="px-3 py-2.5 text-left font-mono tabular-nums">—</td>
                    <td className="px-3 py-2.5 text-left font-mono tabular-nums">—</td>
                    <td className={`px-3 py-2.5 text-left font-mono tabular-nums font-semibold ${balanceClass(data.openingBalance)}`}>
                      {formatMoney(data.openingBalance)}
                    </td>
                  </tr>

                  {data.entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-12 text-center text-gray-500">
                        لا توجد حركات على هذا الحساب في هذه الفترة
                      </td>
                    </tr>
                  ) : (
                    data.entries.map((e, idx) => (
                      <tr key={`${e.entryNumber}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {e.date?.slice(0, 10)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-700 dark:text-gray-300">{e.entryNumber}</td>
                        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{e.reference || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-900 dark:text-gray-100">{e.description || '—'}</td>
                        <td className="px-3 py-2.5 text-left font-mono tabular-nums">
                          {e.debit > 0 ? formatMoney(e.debit) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-left font-mono tabular-nums">
                          {e.credit > 0 ? formatMoney(e.credit) : '—'}
                        </td>
                        <td className={`px-3 py-2.5 text-left font-mono tabular-nums font-semibold ${balanceClass(e.runningBalance)}`}>
                          {formatMoney(e.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 font-bold">
                  <tr>
                    <td colSpan={3} className="px-3 py-3" />
                    <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-200">رصيد ختامي</td>
                    <td className="px-3 py-3" />
                    <td className="px-3 py-3" />
                    <td className={`px-3 py-3 text-left font-mono tabular-nums ${balanceClass(data.closingBalance)}`}>
                      {formatMoney(data.closingBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
