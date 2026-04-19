import { useState } from 'react';
import { Clock, Loader2, PlayCircle, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { useOpenShift } from '../api';
import { useWarehouses } from '@/hooks/useApi';
import type { WarehouseDto } from '@/types/api.types';
import { useAuthStore } from '@/store/authStore';

interface OpenShiftModalProps {
  open: boolean;
  onClose?: () => void;
  /** When true, user cannot dismiss the modal (blocking overlay for POS). */
  blocking?: boolean;
}

export function OpenShiftModal({ open, onClose, blocking = false }: OpenShiftModalProps) {
  const [openingCash, setOpeningCash] = useState('');
  const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const { data: warehouses } = useWarehouses();
  const openMutation = useOpenShift();
  const logout = useAuthStore((s) => s.logout);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(openingCash);
    if (isNaN(amount) || amount < 0) {
      toast.error('يرجى إدخال مبلغ افتتاحي صحيح');
      return;
    }
    try {
      const res = await openMutation.mutateAsync({
        openingCash: amount,
        warehouseId,
        notes: notes.trim() || undefined,
      });
      if (res.success) {
        toast.success('تم فتح الشيفت بنجاح');
        setOpeningCash('');
        setNotes('');
        onClose?.();
      } else {
        toast.error(res.errors?.[0] || 'فشل فتح الشيفت');
      }
    } catch {
      // interceptor already surfaces toast
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!blocking) onClose?.();
      }}
      title={blocking ? undefined : 'فتح شيفت جديد'}
      size="md"
    >
      {blocking && (
        <div className="text-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center mx-auto mb-3">
            <Clock size={28} className="text-brand-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">ابدأ يومك — افتح الشيفت</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            لا يمكن تسجيل مبيعات قبل فتح شيفت جديد وتحديد رصيد الدرج الافتتاحي.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            المبلغ الافتتاحي في الدرج <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            className="input text-center text-xl font-bold"
            placeholder="0.00"
            autoFocus
            required
          />
        </div>

        {warehouses && warehouses.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              المخزن
            </label>
            <select
              value={warehouseId ?? ''}
              onChange={(e) =>
                setWarehouseId(e.target.value ? Number(e.target.value) : undefined)
              }
              className="input"
            >
              <option value="">— اختر المخزن —</option>
              {warehouses.map((w: WarehouseDto) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.isMain ? ' (رئيسي)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ملاحظات (اختياري)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="input resize-none"
            placeholder="أي ملاحظات عن بداية الشيفت..."
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={openMutation.isPending}
            className="btn-primary flex-1 py-3 text-base"
          >
            {openMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" /> جاري الفتح...
              </>
            ) : (
              <>
                <PlayCircle size={18} /> فتح الشيفت
              </>
            )}
          </button>
          {blocking && (
            <button
              type="button"
              onClick={() => {
                logout();
                window.location.reload();
              }}
              className="btn-secondary py-3 text-sm text-red-500"
              title="تسجيل الخروج"
            >
              <LogOut size={16} /> خروج
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
