import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store, Plus, Search, X, Loader2, AlertCircle, Users, Package, DollarSign,
  ToggleLeft, ToggleRight, Edit3, ShieldCheck, ShieldOff, Building2,
  ChevronLeft, ChevronRight, Phone, Mail, MapPin, CreditCard, Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api/client';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────

interface TenantDto {
  id: string;
  name: string;
  businessType: string;
  ownerName: string;
  phone: string;
  email?: string;
  address?: string;
  city: string;
  planId: number;
  planName: string;
  status: number;
  activeUsers: number;
  totalProducts: number;
  totalSales: number;
  subscriptionStart: string;
  subscriptionEnd?: string;
  vatNumber: string;
  zatcaEnabled: boolean;
}

interface CreateTenantRequest {
  name: string;
  businessType: string;
  ownerName: string;
  phone: string;
  email?: string;
  address?: string;
  city: string;
  planId: number;
  adminUsername: string;
  adminPassword: string;
  adminFullName: string;
  vatNumber: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── API ─────────────────────────────────────────────────────

const tenantsApi = {
  getAll: (page: number, pageSize: number) =>
    apiClient.get<{ data: PagedResult<TenantDto> }>(`/admin/tenants`, { params: { page, pageSize } }),
  create: (data: CreateTenantRequest) =>
    apiClient.post<{ data: TenantDto }>('/admin/tenants', data),
  update: (id: string, data: Partial<TenantDto>) =>
    apiClient.put<{ data: TenantDto }>(`/admin/tenants/${id}`, data),
  suspend: (id: string) =>
    apiClient.post(`/admin/tenants/${id}/suspend`),
  activate: (id: string) =>
    apiClient.post(`/admin/tenants/${id}/activate`),
};

// ─── Constants ───────────────────────────────────────────────

const STATUS_FALLBACK = { label: 'غير معروف', variant: 'default' as const };
const STATUS_MAP: Record<number, { label: string; variant: 'success' | 'danger' | 'default' }> = {
  0: { label: 'نشط', variant: 'success' },
  1: { label: 'موقوف', variant: 'danger' },
  2: { label: 'ملغي', variant: 'default' },
};

const BUSINESS_TYPES = [
  { value: 'تجزئة', label: 'تجزئة' },
  { value: 'جملة', label: 'جملة' },
  { value: 'مطعم', label: 'مطعم' },
  { value: 'مقهى', label: 'مقهى' },
  { value: 'أخرى', label: 'أخرى' },
];

const PLANS = [
  { id: 1, name: 'أساسي', price: '99 ر.س/شهر', features: ['مستخدم واحد', 'مخزن واحد', '1000 منتج'], color: 'border-gray-200 bg-gray-50' },
  { id: 2, name: 'متقدم', price: '199 ر.س/شهر', features: ['3 مستخدمين', '2 مخزن', '5000 منتج'], color: 'border-brand-200 bg-brand-50' },
  { id: 3, name: 'احترافي', price: '399 ر.س/شهر', features: ['لا محدود', 'لا محدود', 'لا محدود'], color: 'border-amber-200 bg-amber-50' },
];

// ─── Main Component ──────────────────────────────────────────

export function TenantsScreen() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const pageSize = 20;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['tenants', page, pageSize],
    queryFn: () => tenantsApi.getAll(page, pageSize),
    select: (res) => res.data.data,
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.suspend(id),
    onSuccess: () => {
      toast.success('تم إيقاف المتجر');
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: () => toast.error('فشل إيقاف المتجر'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.activate(id),
    onSuccess: () => {
      toast.success('تم تفعيل المتجر');
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: () => toast.error('فشل تفعيل المتجر'),
  });

  const tenants = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  // Client-side filtering on current page
  const filtered = tenants.filter((t) => {
    const matchesSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      t.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === null || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = tenants.filter((t) => t.status === 0).length;
  const suspendedCount = tenants.filter((t) => t.status === 1).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">إدارة المتاجر</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة جميع المتاجر والاشتراكات</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary shrink-0">
          <Plus size={18} />
          إضافة متجر
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-l from-brand-50 dark:from-brand-950 to-white dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Store size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المتاجر</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isLoading ? '...' : formatNumber(totalCount)}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-l from-emerald-50 dark:from-emerald-950 to-white dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">نشط</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isLoading ? '...' : formatNumber(activeCount)}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-l from-red-50 dark:from-red-950 to-white dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
              <ShieldOff size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">موقوف</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isLoading ? '...' : formatNumber(suspendedCount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم، المالك، المدينة..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
            />
          </div>
          <select
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter(e.target.value === '' ? null : Number(e.target.value))}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none text-sm bg-white dark:bg-gray-900 dark:text-gray-100 min-w-[140px]"
          >
            <option value="">كل الحالات</option>
            <option value={0}>نشط</option>
            <option value={1}>موقوف</option>
            <option value={2}>ملغي</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-red-500">
            <AlertCircle size={40} />
            <p className="font-semibold">حدث خطأ أثناء تحميل البيانات</p>
            <button onClick={() => refetch()} className="btn-secondary text-sm">إعادة المحاولة</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Store size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد متاجر</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المتجر</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المالك</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المدينة</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الباقة</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الحالة</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المستخدمون</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المنتجات</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المبيعات</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tenant) => {
                  const status = STATUS_MAP[tenant.status] ?? STATUS_FALLBACK;
                  return (
                    <tr key={tenant.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm shrink-0">
                            {tenant.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100 block">{tenant.name}</span>
                            <span className="text-xs text-gray-400">{tenant.businessType}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{tenant.ownerName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{tenant.city}</td>
                      <td className="py-3 px-4">
                        <Badge variant="primary">{tenant.planName}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Users size={14} className="text-gray-400" />
                          {tenant.activeUsers}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Package size={14} className="text-gray-400" />
                          {formatNumber(tenant.totalProducts)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(tenant.totalSales)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {tenant.status === 0 ? (
                            <button
                              onClick={() => suspendMutation.mutate(tenant.id)}
                              disabled={suspendMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                              title="إيقاف"
                            >
                              <ToggleRight size={18} />
                            </button>
                          ) : tenant.status === 1 ? (
                            <button
                              onClick={() => activateMutation.mutate(tenant.id)}
                              disabled={activateMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 transition-colors"
                              title="تفعيل"
                            >
                              <ToggleLeft size={18} />
                            </button>
                          ) : null}
                          <button
                            className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors"
                            title="تعديل"
                          >
                            <Edit3 size={18} />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              صفحة {page} من {totalPages} — إجمالي {formatNumber(totalCount)} متجر
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTenantModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

// ─── Create Tenant Modal ─────────────────────────────────────

function CreateTenantModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState<CreateTenantRequest>({
    name: '',
    businessType: 'تجزئة',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    planId: 1,
    adminUsername: '',
    adminPassword: '',
    adminFullName: '',
    vatNumber: '',
  });

  const updateField = <K extends keyof CreateTenantRequest>(key: K, value: CreateTenantRequest[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [errors, setErrors] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTenantRequest) => tenantsApi.create(data),
    onSuccess: () => {
      toast.success('تم إنشاء المتجر بنجاح! يمكن للمدير الآن تسجيل الدخول.');
      qc.invalidateQueries({ queryKey: ['tenants'] });
      onClose();
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const serverErrors = data?.errors;

      // Handle array format: { errors: ["msg"] }
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        toast.error(serverErrors[0]);
      }
      // Handle object format (ASP.NET ValidationProblemDetails): { errors: { "Field": ["msg"] } }
      else if (serverErrors && typeof serverErrors === 'object') {
        const firstField = Object.values(serverErrors).flat() as string[];
        if (firstField.length > 0) {
          toast.error(firstField[0]);
        } else {
          toast.error('فشل إنشاء المتجر. تحقق من البيانات وحاول مرة أخرى.');
        }
      }
      // Handle message field or fallback
      else {
        toast.error(data?.message || 'فشل إنشاء المتجر. تحقق من البيانات وحاول مرة أخرى.');
      }
    },
  });

  const validateForm = (): string[] => {
    const errs: string[] = [];
    if (!form.name.trim()) errs.push('اسم المتجر مطلوب');
    if (!form.ownerName.trim()) errs.push('اسم المالك مطلوب');
    if (!form.phone.trim()) errs.push('رقم الهاتف مطلوب');
    if (!form.city.trim()) errs.push('المدينة مطلوبة');
    if (!form.vatNumber?.trim()) errs.push('الرقم الضريبي مطلوب');
    if (!form.adminFullName.trim()) errs.push('اسم المدير مطلوب');
    if (!form.adminUsername.trim()) errs.push('اسم المستخدم مطلوب');
    if (form.adminUsername.trim().length < 3) errs.push('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
    if (!form.adminPassword) errs.push('كلمة المرور مطلوبة');
    if (form.adminPassword.length < 6) errs.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      if (validationErrors[0]) toast.error(validationErrors[0]);
      return;
    }
    setErrors([]);
    createMutation.mutate({
      ...form,
      email: form.email?.trim() || undefined,
      address: form.address?.trim() || undefined,
    } as CreateTenantRequest);
  };

  const canProceedStep1 = form.name && form.ownerName && form.phone && form.city && form.vatNumber;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">إضافة متجر جديد</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {step === 1 ? 'معلومات المتجر والمالك' : 'حساب المدير والباقة'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {step === 1 ? (
            <>
              {/* Store Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Building2 size={16} /> معلومات المتجر
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم المتجر <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
                    placeholder="مثال: سوبرماركت النور"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      نوع النشاط <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.businessType}
                      onChange={(e) => updateField('businessType', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm bg-white"
                    >
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt.value} value={bt.value}>{bt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      الرقم الضريبي <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.vatNumber}
                      onChange={(e) => updateField('vatNumber', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm"
                      placeholder="3XXXXXXXXXXXXXXX"
                      required
                      dir="ltr"
                    />
                    {!form.vatNumber && <p className="text-xs text-red-500 mt-1">الرقم الضريبي مطلوب للربط مع زاتكا</p>}
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 pt-2">
                  <Users size={16} /> معلومات المالك
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم المالك <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.ownerName}
                    onChange={(e) => updateField('ownerName', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
                    placeholder="الاسم الكامل"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Phone size={14} className="inline ml-1" />
                      الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm"
                      placeholder="05xxxxxxxx"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Mail size={14} className="inline ml-1" />
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm"
                      placeholder="اختياري"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <MapPin size={14} className="inline ml-1" />
                      العنوان
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm"
                      placeholder="اختياري"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      المدينة <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm"
                      placeholder="مثال: الرياض"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  التالي
                  <ChevronLeft size={18} />
                </button>
                <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </>
          ) : (
            <>
              {/* Plan Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <CreditCard size={16} /> اختر الباقة
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => updateField('planId', plan.id)}
                      className={`relative p-4 rounded-xl border-2 text-right transition-all ${
                        form.planId === plan.id
                          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                          : plan.color + ' hover:border-brand-300'
                      }`}
                    >
                      {form.planId === plan.id && (
                        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <p className="font-bold text-gray-900 dark:text-gray-100">{plan.name}</p>
                      <p className="text-sm text-brand-600 dark:text-brand-400 font-semibold mt-1">{plan.price}</p>
                      <ul className="mt-2 space-y-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="text-xs text-gray-500 dark:text-gray-400">• {f}</li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Account */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <ShieldCheck size={16} /> حساب المدير
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.adminFullName}
                    onChange={(e) => updateField('adminFullName', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
                    placeholder="اسم مدير المتجر"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      اسم المستخدم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.adminUsername}
                      onChange={(e) => updateField('adminUsername', e.target.value.replace(/\s/g, ''))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm"
                      placeholder="اسم مستخدم فريد (3 أحرف على الأقل)"
                      required
                      minLength={3}
                      dir="ltr"
                    />
                    {form.adminUsername && form.adminUsername.length < 3 && (
                      <p className="text-xs text-red-500 mt-1">يجب أن يكون 3 أحرف على الأقل</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      كلمة المرور <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={form.adminPassword}
                      onChange={(e) => updateField('adminPassword', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 outline-none text-sm"
                      placeholder="6 أحرف على الأقل"
                      required
                      minLength={6}
                      dir="ltr"
                    />
                    {form.adminPassword && form.adminPassword.length < 6 && (
                      <p className="text-xs text-red-500 mt-1">يجب أن تكون 6 أحرف على الأقل</p>
                    )}
                    {form.adminPassword && form.adminPassword.length >= 6 && (
                      <p className="text-xs text-emerald-600 mt-1">كلمة المرور مقبولة</p>
                    )}
                  </div>
                </div>

                {errors.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    {errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={createMutation.isPending || !form.adminUsername || !form.adminPassword || !form.adminFullName}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  إنشاء المتجر
                </button>
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                  <ChevronRight size={18} />
                  السابق
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
