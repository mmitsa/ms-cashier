import { useState } from 'react';
import { Landmark } from 'lucide-react';
import { BankAccountsList } from './components/BankAccountsList';
import { BankAccountForm } from './components/BankAccountForm';
import type { BankAccount } from './types';

export function BankAccountsScreen() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (acc: BankAccount) => {
    setEditing(acc);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center shrink-0">
          <Landmark size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            الحسابات البنكية والصناديق
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            إضافة وإدارة الحسابات النقدية والبنكية والمحافظ الإلكترونية. كل حساب جديد يتم ربطه
            تلقائياً بالقيود المحاسبية.
          </p>
        </div>
      </div>

      <BankAccountsList onAdd={openAdd} onEdit={openEdit} />

      <BankAccountForm open={formOpen} account={editing} onClose={closeForm} />
    </div>
  );
}
