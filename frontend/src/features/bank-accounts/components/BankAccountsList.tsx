import { Edit2, PauseCircle, PlayCircle, Plus, Landmark, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { AccountType } from '@/types/api.types';
import {
  useBankAccounts, useDeactivateBankAccount, useActivateBankAccount,
} from '../api';
import type { BankAccount } from '../types';
import { accountTypeLabels, accountTypeVariants } from '../types';

const nf = new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Props = {
  onAdd: () => void;
  onEdit: (acc: BankAccount) => void;
};

export function BankAccountsList({ onAdd, onEdit }: Props) {
  const { data: accounts = [], isLoading } = useBankAccounts();
  const deactivate = useDeactivateBankAccount();
  const activate = useActivateBankAccount();

  const handleToggle = async (acc: BankAccount) => {
    const isActive = acc.isActive !== false;
    try {
      if (isActive) {
        await deactivate.mutateAsync(acc.id);
        toast.success('تم تعطيل الحساب');
      } else {
        await activate.mutateAsync(acc.id);
        toast.success('تم تنشيط الحساب');
      }
    } catch {
      toast.error('حدث خطأ أثناء تحديث الحساب');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">قائمة الحسابات</h2>
        <button onClick={onAdd} className="btn-primary">
          <Plus size={16} /> إضافة حساب
        </button>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-gray-400 text-sm">جارٍ التحميل...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Landmark size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            لم تتم إضافة أي حساب بعد
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            أضف حساباتك النقدية والبنكية والمحافظ الإلكترونية للبدء.
          </p>
          <button onClick={onAdd} className="btn-primary mx-auto">
            <Plus size={16} /> إضافة حساب
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-xs">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">الاسم</th>
                <th className="text-right px-4 py-3 font-semibold">النوع</th>
                <th className="text-right px-4 py-3 font-semibold">البنك</th>
                <th className="text-right px-4 py-3 font-semibold">الحساب / IBAN</th>
                <th className="text-right px-4 py-3 font-semibold">الرصيد</th>
                <th className="text-right px-4 py-3 font-semibold">GL كود</th>
                <th className="text-right px-4 py-3 font-semibold">رئيسي</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {accounts.map((a) => {
                const isActive = a.isActive !== false;
                return (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {a.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={accountTypeVariants[a.accountType as AccountType]}>
                        {accountTypeLabels[a.accountType as AccountType]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {a.bankName || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">
                      {a.iban || a.accountNumber || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                      {nf.format(a.balance)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {a.chartOfAccountCode || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {a.isPrimary ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold">
                          <Star size={12} className="fill-current" /> نعم
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">لا</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={isActive ? 'success' : 'default'}>
                        {isActive ? 'نشط' : 'معطل'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEdit(a)}
                          title="تعديل"
                          className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-brand-50 dark:hover:bg-brand-950 text-gray-600 dark:text-gray-300 hover:text-brand-600 flex items-center justify-center transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleToggle(a)}
                          title={isActive ? 'تعطيل' : 'تنشيط'}
                          className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-950 text-gray-600 dark:text-gray-300 hover:text-amber-600 flex items-center justify-center transition"
                        >
                          {isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
