import { useState, useMemo } from 'react';
import { Loader2, StopCircle, Receipt, Banknote, CreditCard, TrendingUp, TrendingDown, Equal } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { useCloseShift, useShiftSummary } from '../api';
import { formatCurrency, cn } from '@/lib/utils/cn';
import type { CashierShiftDto } from '../types';

interface CloseShiftModalProps {
  open: boolean;
  onClose: () => void;
  shift: CashierShiftDto | null;
}

export function CloseShiftModal({ open, onClose, shift }: CloseShiftModalProps) {
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');

  const { data: summary, isLoading } = useShiftSummary(open ? shift?.id : null);
  const closeMutation = useCloseShift();

  const actualCashNum = parseFloat(actualCash) || 0;
  const expected = summary?.expectedCash ?? 0;
  const difference = useMemo(() => actualCashNum - expected, [actualCashNum, expected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualCash === '' || isNaN(actualCashNum) || actualCashNum < 0) {
      toast.error('يرجى إدخال المبلغ المعدود في الدرج');
      return;
    }
    try {
      const res = await closeMutation.mutateAsync({
        actualCash: actualCashNum,
        notes: notes.trim() || undefined,
      });
      if (res.success) {
        toast.success('تم إغلاق الشيفت بنجاح');
        setActualCash('');
        setNotes('');
        onClose();
      } else {
        toast.error(res.errors?.[0] || 'فشل إغلاق الشيفت');
      }
    } catch {
      // handled by interceptor
    }
  };

  const diffColor =
    difference === 0
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900'
      : difference > 0
        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900'
        : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900';

  const DiffIcon = difference === 0 ? Equal : difference > 0 ? TrendingUp : TrendingDown;

  return (
    <Modal open={open} onClose={onClose} title="إغلاق الشيفت" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Receipt size={13} /> عدد الفواتير
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
                {summary?.invoiceCount ?? 0}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <TrendingUp size={13} /> إجمالي المبيعات
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
                {formatCurrency(summary?.totalSales ?? 0)}
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 p-3 border border-emerald-100 dark:border-emerald-900">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <Banknote size={13} /> مبيعات نقدية
              </div>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1 tabular-nums">
                {formatCurrency(summary?.totalCashSales ?? 0)}
              </div>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-3 border border-blue-100 dark:border-blue-900">
              <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400">
                <CreditCard size={13} /> مبيعات بطاقات
              </div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-1 tabular-nums">
                {formatCurrency(summary?.totalCardSales ?? 0)}
              </div>
            </div>
          </div>

          {/* Expected cash breakdown */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">المبلغ الافتتاحي</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(shift?.openingCash ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">+ مبيعات نقدية</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(summary?.totalCashSales ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                النقد المتوقع في الدرج
              </span>
              <span className="text-lg font-bold text-brand-700 dark:text-brand-300 tabular-nums">
                {formatCurrency(expected)}
              </span>
            </div>
          </div>

          {/* Actual cash input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              المبلغ الفعلي المعدود في الدرج <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              className="input text-center text-xl font-bold"
              placeholder="0.00"
              autoFocus
              required
            />
          </div>

          {/* Difference preview */}
          {actualCash !== '' && (
            <div
              className={cn(
                'rounded-xl p-4 border flex items-center justify-between',
                diffColor,
              )}
            >
              <div className="flex items-center gap-2">
                <DiffIcon size={18} />
                <span className="font-medium text-sm">
                  {difference === 0 ? 'مطابق' : difference > 0 ? 'زيادة' : 'عجز'}
                </span>
              </div>
              <span className="text-xl font-bold tabular-nums">
                {difference > 0 && '+'}
                {formatCurrency(difference)}
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input resize-none"
              placeholder="سبب العجز/الزيادة، ملاحظات الشيفت..."
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-5 py-3"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={closeMutation.isPending}
              className="btn-primary flex-1 py-3 text-base bg-red-600 hover:bg-red-700 active:bg-red-800"
            >
              {closeMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> جاري الإغلاق...
                </>
              ) : (
                <>
                  <StopCircle size={18} /> تأكيد إغلاق الشيفت
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
