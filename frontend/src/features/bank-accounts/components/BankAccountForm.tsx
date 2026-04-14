import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { AccountType } from '@/types/api.types';
import { useCreateBankAccount, useUpdateBankAccount } from '../api';
import type { BankAccount } from '../types';
import { accountTypeLabels, isValidIban } from '../types';

type Props = {
  open: boolean;
  account: BankAccount | null;
  onClose: () => void;
};

type FormState = {
  name: string;
  accountType: AccountType;
  bankName: string;
  accountNumber: string;
  iban: string;
  isPrimary: boolean;
  initialBalance: string;
};

const EMPTY: FormState = {
  name: '',
  accountType: AccountType.Cash,
  bankName: '',
  accountNumber: '',
  iban: '',
  isPrimary: false,
  initialBalance: '0',
};

export function BankAccountForm({ open, account, onClose }: Props) {
  const isEdit = !!account;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMut = useCreateBankAccount();
  const updateMut = useUpdateBankAccount();
  const submitting = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (!open) return;
    if (account) {
      setForm({
        name: account.name ?? '',
        accountType: (account.accountType as AccountType) ?? AccountType.Cash,
        bankName: account.bankName ?? '',
        accountNumber: account.accountNumber ?? '',
        iban: account.iban ?? '',
        isPrimary: !!account.isPrimary,
        initialBalance: '0',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [open, account]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (form.accountType === AccountType.Bank) {
      if (form.iban.trim() && !isValidIban(form.iban.trim())) {
        e.iban = 'صيغة IBAN غير صحيحة (حرفان ثم أرقام/أحرف، الطول 22-34)';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    const isBank = form.accountType === AccountType.Bank;
    const isDigital = form.accountType === AccountType.Digital;
    const isCash = form.accountType === AccountType.Cash;

    const payload = {
      name: form.name.trim(),
      accountType: form.accountType,
      bankName: isCash ? null : (form.bankName.trim() || null),
      accountNumber: isCash ? null : (form.accountNumber.trim() || null),
      iban: isBank ? (form.iban.trim().toUpperCase() || null) : null,
      isPrimary: form.isPrimary,
    };

    try {
      if (isEdit && account) {
        await updateMut.mutateAsync({ id: account.id, data: payload });
        toast.success('تم تحديث الحساب');
      } else {
        const initial = parseFloat(form.initialBalance) || 0;
        await createMut.mutateAsync({ ...payload, initialBalance: initial });
        toast.success('تمت إضافة الحساب');
      }
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0] || 'حدث خطأ أثناء حفظ الحساب';
      toast.error(msg);
    }
    // silence unused var warnings in some setups
    void isDigital;
  };

  const isBank = form.accountType === AccountType.Bank;
  const isDigital = form.accountType === AccountType.Digital;
  const isCash = form.accountType === AccountType.Cash;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'تعديل حساب' : 'إضافة حساب جديد'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            الاسم <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder="مثال: الصندوق الرئيسي"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            النوع <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[AccountType.Cash, AccountType.Bank, AccountType.Digital].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('accountType', t)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                  form.accountType === t
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                {accountTypeLabels[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Bank fields */}
        {isBank && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                اسم البنك
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => set('bankName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                رقم الحساب
              </label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => set('accountNumber', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IBAN
              </label>
              <input
                type="text"
                value={form.iban}
                onChange={(e) => set('iban', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono tracking-wider"
                placeholder="SA0000000000000000000000"
              />
              {errors.iban && <p className="text-xs text-red-500 mt-1">{errors.iban}</p>}
            </div>
          </div>
        )}

        {/* Digital wallet fields */}
        {isDigital && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                اسم المنصة
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => set('bankName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="STC Pay, Apple Pay, ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                رقم/معرّف الحساب
              </label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => set('accountNumber', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
              />
            </div>
          </div>
        )}

        {/* Initial balance (create only) */}
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الرصيد الافتتاحي
            </label>
            <input
              type="number"
              step="0.01"
              value={form.initialBalance}
              onChange={(e) => set('initialBalance', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}

        {/* Primary toggle */}
        <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
          <input
            type="checkbox"
            checked={form.isPrimary}
            onChange={(e) => set('isPrimary', e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-brand-600"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">حساب رئيسي</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              الحساب الافتراضي للقبض/الصرف
            </p>
          </div>
        </label>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 justify-center disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'حفظ التعديلات' : 'إضافة الحساب'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            إلغاء
          </button>
        </div>
        {/* keep var referenced to avoid lint noise */}
        <span className="hidden">{isCash ? '' : ''}</span>
      </form>
    </Modal>
  );
}
