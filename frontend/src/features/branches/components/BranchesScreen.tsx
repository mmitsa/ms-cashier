import { useState } from 'react';
import {
  Building2, Plus, MapPin, Phone, User, Warehouse, Edit2,
  PauseCircle, PlayCircle, Send, CreditCard, Clock,
  CheckCircle2, XCircle, AlertCircle, GitBranch, Package,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  useBranches, useBranchSummary, useBranchPlanInfo,
  useUpdateBranch, useSuspendBranch, useActivateBranch,
  useAssignWarehouseToBranch, useUnassignWarehouse,
  useCreateBranchRequest, useMyBranchRequests, useRecordBranchPayment,
} from '@/hooks/useApi';
import { useWarehouses } from '@/hooks/useApi';

const statusColors: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Suspended: 'bg-red-100 text-red-700',
  PendingPayment: 'bg-yellow-100 text-yellow-700',
  Expired: 'bg-gray-100 text-gray-500',
};

const statusLabels: Record<string, string> = {
  Active: 'نشط',
  Suspended: 'معلق',
  PendingPayment: 'بانتظار الدفع',
  Expired: 'منتهي',
};

const requestStatusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  AwaitingPayment: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700',
  Activated: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
};

const requestStatusLabels: Record<string, string> = {
  Pending: 'قيد المراجعة',
  AwaitingPayment: 'بانتظار الدفع',
  Paid: 'تم الدفع',
  Activated: 'مفعل',
  Rejected: 'مرفوض',
};

const dataModeLabels: Record<string, string> = {
  SharedCatalog: 'مشترك مع المتجر',
  IndependentCatalog: 'مستقل',
};

export function BranchesScreen() {
  const [tab, setTab] = useState<'branches' | 'requests' | 'new'>('branches');
  const [editModal, setEditModal] = useState<any>(null);
  const [warehouseModal, setWarehouseModal] = useState<any>(null);
  const [payModal, setPayModal] = useState<any>(null);

  const tabs = [
    { id: 'branches' as const, label: 'الفروع', icon: Building2 },
    { id: 'requests' as const, label: 'طلباتي', icon: Clock },
    { id: 'new' as const, label: 'طلب فرع جديد', icon: Plus },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">إدارة الفروع</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة فروع متجرك والتحكم في المخازن والبيانات لكل فرع</p>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="flex border-b dark:border-gray-800">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors
                ${tab === t.id ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 bg-brand-50/50 dark:bg-brand-950/50' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'branches' && <BranchesList onEdit={setEditModal} onManageWarehouse={setWarehouseModal} />}
          {tab === 'requests' && <RequestsList onPay={setPayModal} />}
          {tab === 'new' && <NewBranchRequest onSuccess={() => setTab('requests')} />}
        </div>
      </div>

      {/* Modals */}
      {editModal && <EditBranchModal branch={editModal} onClose={() => setEditModal(null)} />}
      {warehouseModal && <WarehouseAssignModal branch={warehouseModal} onClose={() => setWarehouseModal(null)} />}
      {payModal && <PaymentModal request={payModal} onClose={() => setPayModal(null)} />}
    </div>
  );
}

function SummaryCards() {
  const { data: summary } = useBranchSummary();
  const { data: planInfo } = useBranchPlanInfo();
  const s = summary?.data;
  const p = planInfo?.data;

  const cards = [
    { label: 'إجمالي الفروع', value: s?.totalBranches ?? 0, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'فروع نشطة', value: s?.activeBranches ?? 0, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: 'الحد الأقصى', value: `${s?.totalBranches ?? 0} / ${s?.maxBranches ?? 0}`, icon: GitBranch, color: 'text-purple-600 bg-purple-50' },
    { label: 'رسوم شهرية', value: `${s?.totalMonthlyFees?.toFixed(2) ?? '0.00'} ر.س`, icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
              <c.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{c.value}</p>
            </div>
          </div>
        </div>
      ))}
      {p && !p.canAddMore && (
        <div className="col-span-full bg-amber-50 dark:bg-amber-950 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            وصلت للحد الأقصى من الفروع في باقة <strong>{p.planName}</strong>. يمكنك ترقية الباقة لإضافة المزيد.
          </p>
        </div>
      )}
    </div>
  );
}

function BranchesList({ onEdit, onManageWarehouse }: { onEdit: (b: any) => void; onManageWarehouse: (b: any) => void }) {
  const { data, isLoading } = useBranches();
  const suspendMut = useSuspendBranch();
  const activateMut = useActivateBranch();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const branches = data?.data ?? [];

  if (branches.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">لا توجد فروع</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">اطلب فرعاً جديداً من تبويب "طلب فرع جديد"</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {branches.map((b: any) => (
        <div key={b.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
                <Building2 size={20} className="text-brand-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{b.name}</h3>
                {b.isMainBranch && (
                  <span className="text-xs bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full">الفرع الرئيسي</span>
                )}
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {statusLabels[b.status] ?? b.status}
            </span>
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            {b.address && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <span>{b.address}{b.city ? ` - ${b.city}` : ''}</span>
              </div>
            )}
            {b.phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400" />
                <span>{b.phone}</span>
              </div>
            )}
            {b.managerName && (
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span>المدير: {b.managerName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Package size={14} className="text-gray-400" />
              <span>المخازن: {b.warehouseCount} | النمط: {dataModeLabels[b.dataMode] ?? b.dataMode}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-gray-400" />
              <span>الرسوم: {b.monthlyFee?.toFixed(2)} ر.س / شهر</span>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t dark:border-gray-800">
            <button onClick={() => onEdit(b)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Edit2 size={14} /> تعديل
            </button>
            <button onClick={() => onManageWarehouse(b)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors">
              <Warehouse size={14} /> المخازن
            </button>
            {!b.isMainBranch && b.status === 'Active' && (
              <button onClick={() => suspendMut.mutate(b.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors">
                <PauseCircle size={14} /> تعليق
              </button>
            )}
            {b.status === 'Suspended' && (
              <button onClick={() => activateMut.mutate(b.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
                <PlayCircle size={14} /> تفعيل
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RequestsList({ onPay }: { onPay: (r: any) => void }) {
  const { data, isLoading } = useMyBranchRequests();

  if (isLoading) {
    return <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>;
  }

  const requests = data?.data ?? [];

  if (requests.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock size={48} className="text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">لا توجد طلبات</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">اطلب فرعاً جديداً لإدارة أعمالك بشكل أفضل</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r: any) => (
        <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{r.branchName}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('ar-SA')}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${requestStatusColors[r.status] ?? 'bg-gray-100'}`}>
              {requestStatusLabels[r.status] ?? r.status}
            </span>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
            {r.address && <p>العنوان: {r.address}{r.city ? ` - ${r.city}` : ''}</p>}
            <p>النمط: {dataModeLabels[r.dataMode] ?? r.dataMode}</p>
            <p>الرسوم المطلوبة: {r.requestedFee?.toFixed(2)} ر.س / شهر</p>
            {r.adminNotes && <p className="text-amber-700 bg-amber-50 p-2 rounded-lg">ملاحظات الأدمن: {r.adminNotes}</p>}
          </div>

          {r.status === 'AwaitingPayment' && (
            <button
              onClick={() => onPay(r)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <CreditCard size={16} /> الدفع وتفعيل الفرع
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function NewBranchRequest({ onSuccess }: { onSuccess: () => void }) {
  const { data: planInfo } = useBranchPlanInfo();
  const createMut = useCreateBranchRequest();
  const [form, setForm] = useState({
    branchName: '',
    address: '',
    city: '',
    phone: '',
    managerName: '',
    dataMode: 'SharedCatalog',
    notes: '',
  });

  const plan = planInfo?.data;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.branchName.trim()) return;
    createMut.mutate(form, { onSuccess: () => { setForm({ branchName: '', address: '', city: '', phone: '', managerName: '', dataMode: 'SharedCatalog', notes: '' }); onSuccess(); } });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {plan && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-blue-900">معلومات الباقة - {plan.planName}</h4>
          <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
            <p>الفروع: {plan.currentBranches} / {plan.maxBranches}</p>
            <p>سعر الفرع: {plan.branchMonthlyPrice?.toFixed(2)} ر.س / شهر</p>
            {plan.branchYearlyPrice && <p>سعر سنوي: {plan.branchYearlyPrice?.toFixed(2)} ر.س / سنة</p>}
          </div>
          {!plan.canAddMore && (
            <div className="flex items-center gap-2 text-red-700 text-sm mt-2">
              <XCircle size={16} />
              <span>وصلت للحد الأقصى. يرجى ترقية الباقة لإضافة فروع جديدة.</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الفرع *</label>
          <input
            type="text" required value={form.branchName}
            onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
            placeholder="مثال: فرع الرياض"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدينة</label>
          <input
            type="text" value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
            placeholder="الرياض"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان</label>
          <input
            type="text" value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
            placeholder="عنوان الفرع بالتفصيل"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">هاتف الفرع</label>
          <input
            type="text" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
            placeholder="05xxxxxxxx"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المدير</label>
          <input
            type="text" value={form.managerName}
            onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
            placeholder="اسم مدير الفرع"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نمط البيانات</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, dataMode: 'SharedCatalog' }))}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                form.dataMode === 'SharedCatalog'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">كتالوج مشترك</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">يستخدم نفس قوائم المنتجات والأصناف من المتجر الأساسي ويسحب من نفس المخازن</p>
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, dataMode: 'IndependentCatalog' }))}
              className={`p-4 rounded-xl border-2 text-right transition-all ${
                form.dataMode === 'IndependentCatalog'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">كتالوج مستقل</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">يمكنه إنشاء قوائم منتجات خاصة به مع إمكانية إضافة مخزن مستقل</p>
            </button>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm resize-none"
            placeholder="أي ملاحظات إضافية..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!form.branchName.trim() || createMut.isPending || (plan && !plan.canAddMore)}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={18} />
        {createMut.isPending ? 'جاري الإرسال...' : 'إرسال طلب فتح الفرع'}
      </button>
    </form>
  );
}

function EditBranchModal({ branch, onClose }: { branch: any; onClose: () => void }) {
  const updateMut = useUpdateBranch();
  const [form, setForm] = useState({
    name: branch.name || '',
    address: branch.address || '',
    city: branch.city || '',
    phone: branch.phone || '',
    email: branch.email || '',
    managerName: branch.managerName || '',
    notes: branch.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMut.mutate({ id: branch.id, data: form }, { onSuccess: onClose });
  };

  return (
    <Modal open={true} onClose={onClose} title="تعديل بيانات الفرع" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">اسم الفرع</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">المدينة</label>
            <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">العنوان</label>
            <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">الهاتف</label>
            <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">البريد</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">اسم المدير</label>
            <input type="text" value={form.managerName} onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">ملاحظات</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2} className="w-full px-3 py-2.5 border rounded-xl text-sm resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-gray-700 text-sm font-medium hover:bg-gray-50">إلغاء</button>
          <button type="submit" disabled={updateMut.isPending}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            {updateMut.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function WarehouseAssignModal({ branch, onClose }: { branch: any; onClose: () => void }) {
  const { data: whData } = useWarehouses();
  const assignMut = useAssignWarehouseToBranch();
  const unassignMut = useUnassignWarehouse();

  const warehouses = whData ?? [];
  const assigned = warehouses.filter((w: any) => w.branchId === branch.id);
  const unassigned = warehouses.filter((w: any) => !w.branchId);

  return (
    <Modal open={true} onClose={onClose} title={`مخازن فرع: ${branch.name}`} size="lg">
      <div className="space-y-4">
        {/* Assigned */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">المخازن المخصصة للفرع</h4>
          {assigned.length === 0 ? (
            <p className="text-xs text-gray-400 p-3 bg-gray-50 rounded-lg text-center">لا توجد مخازن مخصصة لهذا الفرع</p>
          ) : (
            <div className="space-y-2">
              {assigned.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Warehouse size={16} className="text-green-600" />
                    <span className="text-sm font-medium">{w.name}</span>
                  </div>
                  <button
                    onClick={() => unassignMut.mutate(w.id)}
                    className="text-xs text-red-600 hover:underline"
                  >إلغاء التخصيص</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unassigned */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">المخازن المتاحة</h4>
          {unassigned.length === 0 ? (
            <p className="text-xs text-gray-400 p-3 bg-gray-50 rounded-lg text-center">لا توجد مخازن متاحة للتخصيص</p>
          ) : (
            <div className="space-y-2">
              {unassigned.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Warehouse size={16} className="text-gray-500" />
                    <span className="text-sm font-medium">{w.name}</span>
                  </div>
                  <button
                    onClick={() => assignMut.mutate({ warehouseId: w.id, branchId: branch.id })}
                    className="text-xs text-brand-600 hover:underline"
                  >تخصيص لهذا الفرع</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">يمكنك تخصيص حتى 5 مخازن لكل متجر</p>
      </div>
    </Modal>
  );
}

function PaymentModal({ request, onClose }: { request: any; onClose: () => void }) {
  const payMut = useRecordBranchPayment();
  const [paymentRef, setPaymentRef] = useState('');

  const handlePay = () => {
    if (!paymentRef.trim()) return;
    payMut.mutate(
      { requestId: request.id, data: { paymentReference: paymentRef } },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal open={true} onClose={onClose} title="دفع وتفعيل الفرع" size="md">
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-1">{request.branchName}</h4>
          <p className="text-sm text-blue-800">المبلغ المطلوب: <strong>{request.requestedFee?.toFixed(2)} ر.س / شهر</strong></p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم مرجع الدفع *</label>
          <input
            type="text" value={paymentRef}
            onChange={e => setPaymentRef(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl text-sm"
            placeholder="أدخل رقم مرجع عملية الدفع"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-gray-700 text-sm font-medium hover:bg-gray-50">إلغاء</button>
          <button
            onClick={handlePay}
            disabled={!paymentRef.trim() || payMut.isPending}
            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {payMut.isPending ? 'جاري التفعيل...' : 'تأكيد الدفع والتفعيل'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
