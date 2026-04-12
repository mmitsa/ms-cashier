import { useState, useMemo } from 'react';
import {
  Banknote, CreditCard, Smartphone, ArrowDownCircle, ArrowUpCircle,
  Plus, X, Loader2, AlertCircle, Calendar, Filter, Wallet,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import {
  useFinanceAccounts, useFinanceTransactions, useRecordFinanceTransaction,
} from '@/hooks/useApi';
import { formatCurrency, formatDateTime } from '@/lib/utils/cn';
import { TransactionType, AccountType } from '@/types/api.types';
import type { FinanceAccountDto } from '@/types/api.types';

const accountIcons = {
  [AccountType.Cash]: Banknote,
  [AccountType.Bank]: CreditCard,
  [AccountType.Digital]: Smartphone,
} as const;

const accountColors = {
  [AccountType.Cash]: 'bg-emerald-600',
  [AccountType.Bank]: 'bg-blue-600',
  [AccountType.Digital]: 'bg-violet-600',
} as const;

type TxFilter = 'all' | 'income' | 'expense';

export function FinanceScreen() {
  // Filters
  const [txFilter, setTxFilter] = useState<TxFilter>('all');
  const [filterAccountId, setFilterAccountId] = useState<number | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal state
  const [showAddTx, setShowAddTx] = useState(false);

  // Data
  const { data: accounts, isLoading: accountsLoading, isError: accountsError, refetch: refetchAccounts } = useFinanceAccounts();
  const { data: txData, isLoading: txLoading, isError: txError, refetch: refetchTx } = useFinanceTransactions({
    accountId: filterAccountId,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    page,
  });

  const transactions = txData?.items ?? [];
  const totalCount = txData?.totalCount ?? 0;
  const totalPages = txData?.totalPages ?? 1;

  // Total balance
  const totalBalance = useMemo(
    () => (accounts ?? []).reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );

  // Filter transactions by type client-side (API might not support this filter)
  const filteredTx = useMemo(() => {
    if (txFilter === 'all') return transactions;
    if (txFilter === 'income') return transactions.filter((t) => t.transactionType === TransactionType.Income);
    return transactions.filter((t) => t.transactionType === TransactionType.Expense);
  }, [transactions, txFilter]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المالية</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة الحسابات والمعاملات المالية</p>
        </div>
        <button onClick={() => setShowAddTx(true)} className="btn-primary shrink-0">
          <Plus size={18} />
          معاملة جديدة
        </button>
      </div>

      {/* Total Balance */}
      <div className="card p-5 bg-gradient-to-l from-brand-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
            <Wallet size={24} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">الرصيد الإجمالي</p>
            <p className="text-2xl font-bold text-gray-900">
              {accountsLoading ? '...' : formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Account Cards */}
      {accountsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : accountsError ? (
        <div className="flex flex-col items-center gap-3 py-8 text-red-500">
          <AlertCircle size={36} />
          <p className="font-semibold">حدث خطأ أثناء تحميل الحسابات</p>
          <button onClick={() => refetchAccounts()} className="btn-secondary text-sm">إعادة المحاولة</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(accounts ?? []).map((account) => {
            const Icon = accountIcons[account.accountType] ?? Banknote;
            const color = accountColors[account.accountType] ?? 'bg-gray-600';
            return (
              <div
                key={account.id}
                onClick={() => { setFilterAccountId(filterAccountId === account.id ? undefined : account.id); setPage(1); }}
                className={`card p-5 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  filterAccountId === account.id ? 'ring-2 ring-brand-500 shadow-lg' : ''
                }`}
              >
                <StatCard
                  icon={Icon}
                  label={account.name}
                  value={formatCurrency(account.balance)}
                  color={color}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Transactions */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-bold text-gray-900 text-lg">المعاملات المالية</h3>

          <div className="flex flex-wrap gap-2">
            {(['all', 'income', 'expense'] as TxFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => { setTxFilter(f); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  txFilter === f
                    ? f === 'income'
                      ? 'bg-emerald-600 text-white'
                      : f === 'expense'
                        ? 'bg-red-500 text-white'
                        : 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'الكل' : f === 'income' ? 'إيرادات' : 'مصروفات'}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Calendar size={16} className="text-gray-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none"
          />
          <span className="text-gray-400 text-sm">إلى</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none"
          />
          {(dateFrom || dateTo || filterAccountId) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setFilterAccountId(undefined); setPage(1); }}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        {/* Transactions Table */}
        {txLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : txError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-red-500">
            <AlertCircle size={40} />
            <p className="font-semibold">حدث خطأ أثناء تحميل المعاملات</p>
            <button onClick={() => refetchTx()} className="btn-secondary text-sm">إعادة المحاولة</button>
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            لا توجد معاملات
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {filteredTx.map((tx) => {
                const isIncome = tx.transactionType === TransactionType.Income;
                return (
                  <div
                    key={tx.id}
                    className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                      isIncome ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-red-50/50 hover:bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isIncome ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {isIncome ? (
                          <ArrowDownCircle size={18} className="text-emerald-600" />
                        ) : (
                          <ArrowUpCircle size={18} className="text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{tx.description || tx.category || '—'}</p>
                        <p className="text-xs text-gray-500">
                          {tx.accountName} • {formatDateTime(tx.createdAt)} • {tx.createdByName}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className={`text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      {tx.category && (
                        <p className="text-xs text-gray-400 mt-0.5">{tx.category}</p>
                      )}
                    </div>
                  </div>
                );
              })}
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
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddTx && (
        <AddTransactionModal
          accounts={accounts ?? []}
          onClose={() => setShowAddTx(false)}
        />
      )}
    </div>
  );
}

// ==================== Add Transaction Modal ====================

function AddTransactionModal({
  accounts,
  onClose,
}: {
  accounts: FinanceAccountDto[];
  onClose: () => void;
}) {
  const recordTx = useRecordFinanceTransaction();

  const [form, setForm] = useState({
    accountId: accounts[0]?.id ?? 0,
    transactionType: TransactionType.Income as number,
    category: '',
    amount: 0,
    description: '',
  });

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0 || form.accountId <= 0) return;
    recordTx.mutate(form, { onSuccess: () => onClose() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">معاملة مالية جديدة</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateField('transactionType', TransactionType.Income)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                form.transactionType === TransactionType.Income
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ArrowDownCircle size={16} className="inline ml-1" />
              إيراد
            </button>
            <button
              type="button"
              onClick={() => updateField('transactionType', TransactionType.Expense)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                form.transactionType === TransactionType.Expense
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ArrowUpCircle size={16} className="inline ml-1" />
              مصروف
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحساب <span className="text-red-500">*</span>
            </label>
            <select
              value={form.accountId}
              onChange={(e) => updateField('accountId', Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm"
              required
            >
              <option value={0}>اختر الحساب</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المبلغ <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={form.amount || ''}
                onChange={(e) => updateField('amount', Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm"
                placeholder="مثال: إيجار، رواتب"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm resize-none"
              placeholder="تفاصيل المعاملة..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={recordTx.isPending || form.amount <= 0 || form.accountId <= 0}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {recordTx.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              تسجيل المعاملة
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
