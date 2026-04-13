import { useState } from 'react';
import { UserCheck, Plus, Edit2, Trash2, Eye, DollarSign, AlertCircle, X, TrendingUp, Wallet, Users, Calculator } from 'lucide-react';
import { useSalesReps, useSalesRepSummary, useCreateSalesRep, useUpdateSalesRep, useDeleteSalesRep, useSalesRepLedger, useSalesRepCommissions, useWarehouses } from '@/hooks/useApi';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDateTime } from '@/lib/utils/cn';
import type { SalesRepDto, CreateSalesRepRequest, UpdateSalesRepRequest } from '@/types/api.types';
import { salesRepsApi } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

type Tab = 'reps' | 'ledger' | 'commissions';

export function SalesRepsScreen() {
  const { data: reps, isLoading } = useSalesReps();
  const { data: summary } = useSalesRepSummary();
  const [tab, setTab] = useState<Tab>('reps');
  const [showForm, setShowForm] = useState(false);
  const [editingRep, setEditingRep] = useState<SalesRepDto | null>(null);
  const [selectedRep, setSelectedRep] = useState<SalesRepDto | null>(null);

  const handleEdit = (rep: SalesRepDto) => { setEditingRep(rep); setShowForm(true); };
  const handleView = (rep: SalesRepDto) => { setSelectedRep(rep); setTab('ledger'); };
  const handleClose = () => { setShowForm(false); setEditingRep(null); };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UserCheck size={28} className="text-brand-600" />
            مندوبي المبيعات
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة المندوبين وحساباتهم وعمولاتهم</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> إضافة مندوب
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4 bg-gradient-to-l from-brand-50 to-white dark:from-brand-950 dark:to-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center"><Users size={20} className="text-white" /></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">إجمالي المندوبين</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{summary.totalReps}</p></div>
            </div>
          </div>
          <div className="card p-4 bg-gradient-to-l from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center"><UserCheck size={20} className="text-white" /></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">نشط</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{summary.activeReps}</p></div>
            </div>
          </div>
          <div className="card p-4 bg-gradient-to-l from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center"><Wallet size={20} className="text-white" /></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">رصيد معلق</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.totalOutstanding)}</p></div>
            </div>
          </div>
          <div className="card p-4 bg-gradient-to-l from-red-50 to-white dark:from-red-950 dark:to-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center"><DollarSign size={20} className="text-white" /></div>
              <div><p className="text-xs text-gray-500 dark:text-gray-400">عمولات مستحقة</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.totalCommissionUnpaid)}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {[
          { id: 'reps' as Tab, label: 'المندوبين', icon: Users },
          { id: 'ledger' as Tab, label: 'دفتر الحساب', icon: Wallet },
          { id: 'commissions' as Tab, label: 'العمولات', icon: TrendingUp },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white dark:bg-gray-900 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'reps' && <RepsTable reps={reps ?? []} isLoading={isLoading} onEdit={handleEdit} onView={handleView} />}
      {tab === 'ledger' && <LedgerTab reps={reps ?? []} selectedRep={selectedRep} onSelectRep={setSelectedRep} />}
      {tab === 'commissions' && <CommissionsTab reps={reps ?? []} selectedRep={selectedRep} onSelectRep={setSelectedRep} />}

      {/* Form Modal */}
      {showForm && <RepFormModal rep={editingRep} onClose={handleClose} />}
    </div>
  );
}

// ─── Reps Table ───────────────────────────────────
function RepsTable({ reps, isLoading, onEdit, onView }: { reps: SalesRepDto[]; isLoading: boolean; onEdit: (r: SalesRepDto) => void; onView: (r: SalesRepDto) => void }) {
  const deleteMut = useDeleteSalesRep();
  if (isLoading) return <div className="card p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>;
  if (!reps.length) return <div className="card py-16 text-center"><UserCheck size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500 dark:text-gray-400">لا يوجد مندوبين بعد</p></div>;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead><tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">المندوب</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">المخزن</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">نسبة العمولة</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">بونص ثابت</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الرصيد المعلق</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الحالة</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الإجراءات</th>
          </tr></thead>
          <tbody>
            {reps.map(rep => (
              <tr key={rep.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm shrink-0">{rep.name.charAt(0)}</div>
                    <div><p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{rep.name}</p><p className="text-xs text-gray-400">@{rep.userName}</p></div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{rep.assignedWarehouseName ?? 'الكل'}</td>
                <td className="py-3 px-4 text-sm font-bold text-brand-700 dark:text-brand-300">{rep.commissionPercent}%</td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{formatCurrency(rep.fixedBonus)}</td>
                <td className="py-3 px-4"><span className={`text-sm font-bold ${rep.outstandingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatCurrency(rep.outstandingBalance)}</span></td>
                <td className="py-3 px-4"><Badge variant={rep.isActive ? 'success' : 'danger'}>{rep.isActive ? 'نشط' : 'معطّل'}</Badge></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onView(rep)} className="p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950 text-brand-600 transition" title="دفتر الحساب"><Eye size={14} /></button>
                    <button onClick={() => onEdit(rep)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition" title="تعديل"><Edit2 size={14} /></button>
                    <button onClick={() => { if (confirm(`حذف "${rep.name}"؟`)) deleteMut.mutate(rep.id); }} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-400 transition" title="حذف"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Ledger Tab ───────────────────────────────────
function LedgerTab({ reps, selectedRep, onSelectRep }: { reps: SalesRepDto[]; selectedRep: SalesRepDto | null; onSelectRep: (r: SalesRepDto | null) => void }) {
  const { data: ledger, isLoading } = useSalesRepLedger(selectedRep?.id ?? 0);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <select value={selectedRep?.id ?? ''} onChange={e => { const r = reps.find(x => x.id === Number(e.target.value)); onSelectRep(r ?? null); }}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500">
          <option value="">اختر المندوب لعرض دفتر حسابه</option>
          {reps.map(r => <option key={r.id} value={r.id}>{r.name} — رصيد: {formatCurrency(r.outstandingBalance)}</option>)}
        </select>
      </div>

      {selectedRep && (
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
          ) : !ledger?.length ? (
            <div className="py-12 text-center text-gray-400"><Wallet size={48} className="mx-auto mb-4 opacity-30" /><p>لا توجد حركات بعد</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead><tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">التاريخ</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">النوع</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">المبلغ</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الرصيد بعد</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الفاتورة</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">ملاحظات</th>
                </tr></thead>
                <tbody>
                  {ledger.map(txn => (
                    <tr key={txn.id} className="border-b border-gray-50 dark:border-gray-800">
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">{formatDateTime(txn.transactionDate)}</td>
                      <td className="py-3 px-4"><Badge variant={txn.amount > 0 ? 'danger' : 'success'}>{txn.transactionTypeLabel}</Badge></td>
                      <td className={`py-3 px-4 text-sm font-bold ${txn.amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}</td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-700 dark:text-gray-300">{formatCurrency(txn.balanceAfter)}</td>
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">{txn.invoiceNumber ?? '—'}</td>
                      <td className="py-3 px-4 text-xs text-gray-400">{txn.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Commissions Tab ──────────────────────────────
function CommissionsTab({ reps, selectedRep, onSelectRep }: { reps: SalesRepDto[]; selectedRep: SalesRepDto | null; onSelectRep: (r: SalesRepDto | null) => void }) {
  const { data: commissions, isLoading, refetch } = useSalesRepCommissions(selectedRep?.id ?? 0);
  const [calcMonth, setCalcMonth] = useState(new Date().getMonth() + 1);
  const [calcYear, setCalcYear] = useState(new Date().getFullYear());
  const [calculating, setCalculating] = useState(false);

  const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const STATUS_LABELS: Record<number, { label: string; variant: 'success' | 'danger' | 'default' }> = {
    1: { label: 'مستحقة', variant: 'default' },
    2: { label: 'مدفوعة', variant: 'success' },
    3: { label: 'جزئي', variant: 'danger' },
  };

  const handleCalc = async () => {
    if (!selectedRep) return;
    setCalculating(true);
    try {
      const res = await salesRepsApi.calculateCommission(selectedRep.id, calcMonth, calcYear);
      if (res.success) toast.success(res.message || 'تم احتساب العمولة');
      else toast.error(res.errors?.join(', ') || 'خطأ');
      refetch();
    } finally { setCalculating(false); }
  };

  const handlePay = async (commissionId: number, totalEarned: number, paidAmount: number) => {
    const remaining = totalEarned - paidAmount;
    const amount = Number(prompt(`المبلغ المستحق: ${remaining.toFixed(2)}\nأدخل المبلغ المراد صرفه:`, remaining.toString()));
    if (!amount || amount <= 0) return;
    try {
      const res = await salesRepsApi.payCommission(commissionId, { amount });
      if (res.success) { toast.success('تم صرف العمولة'); refetch(); }
      else toast.error(res.errors?.join(', ') || 'خطأ');
    } catch { toast.error('فشل صرف العمولة'); }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <select value={selectedRep?.id ?? ''} onChange={e => { const r = reps.find(x => x.id === Number(e.target.value)); onSelectRep(r ?? null); }}
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500">
          <option value="">اختر المندوب</option>
          {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {selectedRep && (
          <>
            <select value={calcMonth} onChange={e => setCalcMonth(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" value={calcYear} onChange={e => setCalcYear(Number(e.target.value))}
              className="w-24 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none" />
            <button onClick={handleCalc} disabled={calculating}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition text-sm disabled:opacity-50">
              <Calculator size={16} /> {calculating ? 'جارٍ الحساب...' : 'احتساب العمولة'}
            </button>
          </>
        )}
      </div>

      {selectedRep && (
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
          ) : !commissions?.length ? (
            <div className="py-12 text-center text-gray-400"><TrendingUp size={48} className="mx-auto mb-4 opacity-30" /><p>لا توجد عمولات محسوبة بعد</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead><tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الشهر</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">إجمالي المبيعات</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">النسبة</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">العمولة</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">البونص</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الإجمالي</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">المصروف</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الحالة</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">إجراء</th>
                </tr></thead>
                <tbody>
                  {commissions.map(c => {
                    const st = STATUS_LABELS[c.status] ?? { label: '?', variant: 'default' as const };
                    return (
                      <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">{MONTHS[c.month - 1] ?? c.month} {c.year}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{formatCurrency(c.totalPaidSales)}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{c.commissionPercent}%</td>
                        <td className="py-3 px-4 text-sm font-bold text-brand-700 dark:text-brand-300">{formatCurrency(c.commissionAmount)}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatCurrency(c.fixedBonus)}</td>
                        <td className="py-3 px-4 text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(c.totalEarned)}</td>
                        <td className="py-3 px-4 text-sm text-emerald-600">{formatCurrency(c.paidAmount)}</td>
                        <td className="py-3 px-4"><Badge variant={st.variant}>{st.label}</Badge></td>
                        <td className="py-3 px-4">
                          {c.status !== 2 && (
                            <button onClick={() => handlePay(c.id, c.totalEarned, c.paidAmount)}
                              className="px-3 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 transition font-medium">
                              <DollarSign size={12} className="inline ml-1" /> صرف
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Form Modal ──────────────────────────────────
function RepFormModal({ rep, onClose }: { rep: SalesRepDto | null; onClose: () => void }) {
  const createMut = useCreateSalesRep();
  const updateMut = useUpdateSalesRep();
  const { data: warehouses } = useWarehouses();

  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: rep?.name ?? '',
    phone: rep?.phone ?? '',
    assignedWarehouseId: rep?.assignedWarehouseId ?? undefined as number | undefined,
    commissionPercent: rep?.commissionPercent ?? 5,
    fixedBonus: rep?.fixedBonus ?? 0,
    isActive: rep?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return toast.error('اسم المندوب مطلوب');

    if (rep) {
      updateMut.mutate({
        id: rep.id,
        data: { name: form.fullName, phone: form.phone || undefined, assignedWarehouseId: form.assignedWarehouseId, commissionPercent: form.commissionPercent, fixedBonus: form.fixedBonus, isActive: form.isActive },
      }, { onSuccess: onClose });
    } else {
      if (!form.username.trim()) return toast.error('اسم المستخدم مطلوب');
      if (!form.password || form.password.length < 6) return toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      createMut.mutate({
        username: form.username, password: form.password, fullName: form.fullName,
        phone: form.phone || undefined, assignedWarehouseId: form.assignedWarehouseId,
        commissionPercent: form.commissionPercent, fixedBonus: form.fixedBonus,
      }, { onSuccess: onClose });
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <Modal open onClose={onClose} title={rep ? 'تعديل المندوب' : 'إضافة مندوب جديد'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        {!rep && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اسم المستخدم *</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.replace(/\s/g, '') }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">كلمة المرور *</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500" dir="ltr" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الاسم الكامل *</label>
            <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الهاتف</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500" dir="ltr" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">المخزن المخصص</label>
          <select value={form.assignedWarehouseId ?? ''} onChange={e => setForm(f => ({ ...f, assignedWarehouseId: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500">
            <option value="">جميع المخازن</option>
            {(warehouses ?? []).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-brand-50/50 dark:bg-brand-950/30 rounded-xl border border-brand-200 dark:border-brand-800">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">نسبة العمولة %</label>
            <input type="number" step="0.5" min="0" max="100" value={form.commissionPercent}
              onChange={e => setForm(f => ({ ...f, commissionPercent: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">بونص ثابت شهري</label>
            <input type="number" step="100" min="0" value={form.fixedBonus}
              onChange={e => setForm(f => ({ ...f, fixedBonus: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500" dir="ltr" />
          </div>
        </div>

        {rep && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">المندوب نشط</span>
          </label>
        )}

        <div className="flex gap-3 pt-3 border-t dark:border-gray-700">
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition disabled:opacity-50">
            {saving ? 'جارٍ الحفظ...' : rep ? 'تحديث' : 'إنشاء مندوب'}
          </button>
          <button type="button" onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition">إلغاء</button>
        </div>
      </form>
    </Modal>
  );
}
