import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Users, Printer, Scale, FileCheck, Database, Bell, Settings,
  Save, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw, TestTube,
  CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Loader2,
  X, ChevronLeft, Download, Upload, Moon, Sun, Smartphone, Monitor,
  CreditCard, MessageSquare, Shield, Zap, Globe, ExternalLink,
  Copy, Activity, Clock, Wifi,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useUIStore } from '@/store/uiStore';
import toast from 'react-hot-toast';

// ==================== Helper: get tenantId from JWT ====================
function getTenantId(): string {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return '';
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) return '';
    const payload = JSON.parse(atob(parts[1]));
    return payload.tenant_id || '';
  } catch {
    return '';
  }
}

// ==================== Tab Definitions ====================
type TabKey = 'business' | 'users' | 'print' | 'scale' | 'zatca' | 'payment' | 'otp' | 'backup' | 'notifications' | 'system';

const tabs: { key: TabKey; label: string; icon: typeof Building2; badge?: string }[] = [
  { key: 'business', label: 'معلومات المنشأة', icon: Building2 },
  { key: 'users', label: 'المستخدمون', icon: Users },
  { key: 'print', label: 'الطباعة', icon: Printer },
  { key: 'scale', label: 'الميزان', icon: Scale },
  { key: 'zatca', label: 'زاتكا', icon: FileCheck, badge: 'مهم' },
  { key: 'payment', label: 'بوابات الدفع', icon: CreditCard, badge: 'جديد' },
  { key: 'otp', label: 'رسائل OTP', icon: MessageSquare, badge: 'جديد' },
  { key: 'backup', label: 'النسخ الاحتياطي', icon: Database },
  { key: 'notifications', label: 'الإشعارات', icon: Bell },
  { key: 'system', label: 'النظام', icon: Settings },
];

// ==================== Shared UI Components ====================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{children}</h2>;
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{children}</label>;
}

function FormInput({
  value, onChange, placeholder, type = 'text', dir,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; dir?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      dir={dir}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm
        focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
    />
  );
}

function FormTextarea({
  value, onChange, placeholder, rows = 3, dir,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; dir?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      dir={dir}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm resize-none
        focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
    />
  );
}

function FormSelect({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm
        focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Toggle({
  enabled, onChange, label,
}: {
  enabled: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex items-center justify-between w-full py-3 px-1 group"
    >
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">{label}</span>
      {enabled ? (
        <ToggleRight size={28} className="text-brand-600 shrink-0" />
      ) : (
        <ToggleLeft size={28} className="text-gray-300 shrink-0" />
      )}
    </button>
  );
}

function PrimaryButton({
  onClick, loading, children, disabled, className = '',
}: {
  onClick: () => void; loading?: boolean; children: React.ReactNode; disabled?: boolean; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
        bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed
        transition-all shadow-sm ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

function DangerButton({
  onClick, loading, children,
}: {
  onClick: () => void; loading?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600
        bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-all"
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick, loading, children, className = '',
}: {
  onClick: () => void; loading?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300
        bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-all ${className}`}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

function StatusBadge({ active, trueLabel, falseLabel }: { active: boolean; trueLabel: string; falseLabel: string }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
      <CheckCircle size={13} /> {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
      <XCircle size={13} /> {falseLabel}
    </span>
  );
}

// ==================== Tab 1: Business Info ====================
function BusinessInfoTab() {
  const tenantId = getTenantId();
  const [form, setForm] = useState({
    name: '', businessType: '', ownerName: '', phone: '', email: '',
    address: '', city: '', logoUrl: '', vatNumber: '', taxNumber: '', currency: 'SAR',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    apiClient.get(`/admin/tenants/${tenantId}`).then((res) => {
      const d = res.data?.data || res.data;
      setForm({
        name: d.name || '',
        businessType: d.businessType || '',
        ownerName: d.ownerName || '',
        phone: d.phone || '',
        email: d.email || '',
        address: d.address || '',
        city: d.city || '',
        logoUrl: d.logoUrl || '',
        vatNumber: d.vatNumber || '',
        taxNumber: d.taxNumber || '',
        currency: d.currency || 'SAR',
      });
    }).catch(() => {
      toast.error('فشل تحميل بيانات المنشأة');
    });
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) { toast.error('لم يتم العثور على معرف المنشأة'); return; }
    setLoading(true);
    try {
      await apiClient.put(`/admin/tenants/${tenantId}`, form);
      toast.success('تم حفظ بيانات المنشأة بنجاح');
    } catch {
      toast.error('فشل حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof typeof form) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="space-y-6">
      <SectionTitle>معلومات المنشأة</SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FormLabel>اسم المنشأة</FormLabel>
          <FormInput value={form.name} onChange={update('name')} placeholder="أدخل اسم المنشأة" />
        </div>
        <div>
          <FormLabel>نوع النشاط</FormLabel>
          <FormSelect
            value={form.businessType}
            onChange={update('businessType')}
            options={[
              { value: '', label: 'اختر نوع النشاط' },
              { value: 'retail', label: 'تجزئة' },
              { value: 'wholesale', label: 'جملة' },
              { value: 'restaurant', label: 'مطاعم' },
              { value: 'services', label: 'خدمات' },
              { value: 'other', label: 'أخرى' },
            ]}
          />
        </div>
        <div>
          <FormLabel>اسم المالك</FormLabel>
          <FormInput value={form.ownerName} onChange={update('ownerName')} placeholder="اسم المالك" />
        </div>
        <div>
          <FormLabel>رقم الجوال</FormLabel>
          <FormInput value={form.phone} onChange={update('phone')} placeholder="05xxxxxxxx" dir="ltr" />
        </div>
        <div>
          <FormLabel>البريد الإلكتروني</FormLabel>
          <FormInput value={form.email} onChange={update('email')} placeholder="email@example.com" type="email" dir="ltr" />
        </div>
        <div>
          <FormLabel>المدينة</FormLabel>
          <FormInput value={form.city} onChange={update('city')} placeholder="المدينة" />
        </div>
        <div className="md:col-span-2">
          <FormLabel>العنوان</FormLabel>
          <FormInput value={form.address} onChange={update('address')} placeholder="العنوان الكامل" />
        </div>
        <div>
          <FormLabel>رابط الشعار</FormLabel>
          <FormInput value={form.logoUrl} onChange={update('logoUrl')} placeholder="https://..." dir="ltr" />
        </div>
        <div>
          <FormLabel>العملة</FormLabel>
          <FormSelect
            value={form.currency}
            onChange={update('currency')}
            options={[
              { value: 'SAR', label: 'ريال سعودي (SAR)' },
              { value: 'AED', label: 'درهم إماراتي (AED)' },
              { value: 'KWD', label: 'دينار كويتي (KWD)' },
              { value: 'EGP', label: 'جنيه مصري (EGP)' },
              { value: 'USD', label: 'دولار أمريكي (USD)' },
            ]}
          />
        </div>
        <div>
          <FormLabel>الرقم الضريبي <span className="text-red-500">*</span></FormLabel>
          <FormInput value={form.taxNumber} onChange={update('taxNumber')} placeholder="الرقم الضريبي" dir="ltr" />
        </div>
        <div>
          <FormLabel>رقم ضريبة القيمة المضافة (VAT) <span className="text-red-500">*</span></FormLabel>
          <FormInput value={form.vatNumber} onChange={update('vatNumber')} placeholder="3XXXXXXXXXXXXXXX" dir="ltr" />
          {!form.vatNumber && <p className="text-xs text-red-500 mt-1">مطلوب للربط مع زاتكا</p>}
        </div>
      </div>

      {form.logoUrl && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <img src={form.logoUrl} alt="logo" className="w-16 h-16 object-contain rounded-lg border dark:border-gray-700" />
          <span className="text-sm text-gray-500">معاينة الشعار</span>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={handleSave} loading={loading}>
          <Save size={16} />
          حفظ البيانات
        </PrimaryButton>
      </div>
    </div>
  );
}

// ==================== Tab 2: Users ====================
interface UserRow {
  id: string;
  username: string;
  fullName: string;
  phone?: string;
  email?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
}

function UsersTab() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '', password: '', fullName: '', phone: '', email: '', role: 'Cashier',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['settings-users'],
    queryFn: () => apiClient.get('/users').then((r) => r.data),
  });

  const users: UserRow[] = usersData?.data || usersData || [];

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/users/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
      toast.success('تم تحديث حالة المستخدم');
    },
    onError: () => toast.error('فشل تحديث حالة المستخدم'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
      toast.success('تم حذف المستخدم');
    },
    onError: () => toast.error('فشل حذف المستخدم'),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: typeof newUser) => apiClient.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
      toast.success('تم إضافة المستخدم بنجاح');
      setShowModal(false);
      setNewUser({ username: '', password: '', fullName: '', phone: '', email: '', role: 'Cashier' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.errors?.[0] || 'فشل إضافة المستخدم';
      toast.error(msg);
    },
  });

  const roleLabels: Record<string, string> = {
    Admin: 'مدير النظام',
    Manager: 'مدير',
    Cashier: 'كاشير',
    Accountant: 'محاسب',
    Viewer: 'مشاهد',
  };

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.password || !newUser.fullName) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle>إدارة المستخدمين</SectionTitle>
        <PrimaryButton onClick={() => setShowModal(true)}>
          <Plus size={16} />
          إضافة مستخدم
        </PrimaryButton>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">اسم المستخدم</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">الاسم الكامل</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">الدور</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">الحالة</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">آخر دخول</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(users) ? users : []).map((user) => (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100" dir="ltr">{user.username}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{user.fullName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-semibold">
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge active={user.isActive} trueLabel="مفعّل" falseLabel="معطّل" />
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(user.lastLoginAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleActiveMutation.mutate(user.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        title={user.isActive ? 'تعطيل' : 'تفعيل'}
                      >
                        {user.isActive ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!Array.isArray(users) || users.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">لا يوجد مستخدمون</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">إضافة مستخدم جديد</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <FormLabel>اسم المستخدم *</FormLabel>
                <FormInput
                  value={newUser.username}
                  onChange={(v) => setNewUser((p) => ({ ...p, username: v }))}
                  placeholder="admin"
                  dir="ltr"
                />
              </div>
              <div>
                <FormLabel>كلمة المرور *</FormLabel>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm
                      focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <FormLabel>الاسم الكامل *</FormLabel>
                <FormInput
                  value={newUser.fullName}
                  onChange={(v) => setNewUser((p) => ({ ...p, fullName: v }))}
                  placeholder="الاسم الكامل"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>رقم الجوال</FormLabel>
                  <FormInput
                    value={newUser.phone}
                    onChange={(v) => setNewUser((p) => ({ ...p, phone: v }))}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
                <div>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormInput
                    value={newUser.email}
                    onChange={(v) => setNewUser((p) => ({ ...p, email: v }))}
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <FormLabel>الدور *</FormLabel>
                <FormSelect
                  value={newUser.role}
                  onChange={(v) => setNewUser((p) => ({ ...p, role: v }))}
                  options={[
                    { value: 'Admin', label: 'مدير النظام' },
                    { value: 'Manager', label: 'مدير' },
                    { value: 'Cashier', label: 'كاشير' },
                    { value: 'Accountant', label: 'محاسب' },
                    { value: 'Viewer', label: 'مشاهد' },
                  ]}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <SecondaryButton onClick={() => setShowModal(false)}>إلغاء</SecondaryButton>
              <PrimaryButton onClick={handleCreateUser} loading={createUserMutation.isPending}>
                <Plus size={16} />
                إضافة
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== Tab 3: Print Settings ====================
interface PrintSettings {
  printerType: string;
  receiptHeader: string;
  receiptFooter: string;
  showLogo: boolean;
  showQrCode: boolean;
  showStoreInfo: boolean;
  barcodeWidth: number;
  barcodeHeight: number;
  barcodeQuantity: number;
}

const defaultPrintSettings: PrintSettings = {
  printerType: 'thermal80',
  receiptHeader: '',
  receiptFooter: 'شكراً لزيارتكم',
  showLogo: true,
  showQrCode: true,
  showStoreInfo: true,
  barcodeWidth: 50,
  barcodeHeight: 30,
  barcodeQuantity: 1,
};

function PrintSettingsTab() {
  const [settings, setSettings] = useState<PrintSettings>(defaultPrintSettings);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pos_print_settings');
      if (saved) setSettings({ ...defaultPrintSettings, ...JSON.parse(saved) });
    } catch { /* ignore */ }
  }, []);

  const save = () => {
    localStorage.setItem('pos_print_settings', JSON.stringify(settings));
    toast.success('تم حفظ إعدادات الطباعة');
  };

  const update = <K extends keyof PrintSettings>(key: K) => (val: PrintSettings[K]) =>
    setSettings((p) => ({ ...p, [key]: val }));

  const printTest = () => {
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) { toast.error('يرجى السماح بالنوافذ المنبثقة'); return; }

    const width = settings.printerType === 'thermal58' ? '58mm' : settings.printerType === 'thermal80' ? '80mm' : '210mm';
    win.document.write(`
      <html dir="rtl">
        <head>
          <title>طباعة تجريبية</title>
          <style>
            body { font-family: 'IBM Plex Sans Arabic', sans-serif; width: ${width}; margin: 0 auto; padding: 8px; font-size: 12px; }
            .header, .footer { text-align: center; margin: 8px 0; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 4px; }
          </style>
        </head>
        <body>
          ${settings.showStoreInfo ? '<div class="header"><strong>اسم المتجر</strong><br/>العنوان - المدينة</div>' : ''}
          ${settings.receiptHeader ? `<div class="header">${settings.receiptHeader}</div>` : ''}
          <div class="divider"></div>
          <table>
            <tr><td>صنف تجريبي 1</td><td style="text-align:left">50.00</td></tr>
            <tr><td>صنف تجريبي 2</td><td style="text-align:left">75.00</td></tr>
          </table>
          <div class="divider"></div>
          <table>
            <tr><td><strong>الإجمالي</strong></td><td style="text-align:left"><strong>125.00 ر.س</strong></td></tr>
          </table>
          <div class="divider"></div>
          ${settings.receiptFooter ? `<div class="footer">${settings.receiptFooter}</div>` : ''}
          ${settings.showQrCode ? '<div class="footer" style="margin-top:8px">[QR Code]</div>' : ''}
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-6">
      <SectionTitle>إعدادات الطباعة</SectionTitle>

      <div className="space-y-5">
        <div>
          <FormLabel>نوع الطابعة</FormLabel>
          <FormSelect
            value={settings.printerType}
            onChange={(v) => update('printerType')(v)}
            options={[
              { value: 'thermal58', label: 'حرارية 58mm' },
              { value: 'thermal80', label: 'حرارية 80mm' },
              { value: 'a4', label: 'ورق A4' },
            ]}
          />
        </div>

        <div>
          <FormLabel>رأس الإيصال</FormLabel>
          <FormTextarea
            value={settings.receiptHeader}
            onChange={(v) => update('receiptHeader')(v)}
            placeholder="نص يظهر في أعلى الإيصال..."
            rows={3}
          />
        </div>

        <div>
          <FormLabel>تذييل الإيصال</FormLabel>
          <FormTextarea
            value={settings.receiptFooter}
            onChange={(v) => update('receiptFooter')(v)}
            placeholder="شكراً لزيارتكم"
            rows={2}
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-1 divide-y divide-gray-100 dark:divide-gray-700">
          <Toggle enabled={settings.showLogo} onChange={(v) => update('showLogo')(v)} label="عرض الشعار" />
          <Toggle enabled={settings.showQrCode} onChange={(v) => update('showQrCode')(v)} label="عرض رمز QR" />
          <Toggle enabled={settings.showStoreInfo} onChange={(v) => update('showStoreInfo')(v)} label="عرض معلومات المتجر" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">إعدادات طباعة الباركود</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FormLabel>العرض (مم)</FormLabel>
              <FormInput
                value={String(settings.barcodeWidth)}
                onChange={(v) => update('barcodeWidth')(Number(v) || 0)}
                type="number"
                dir="ltr"
              />
            </div>
            <div>
              <FormLabel>الارتفاع (مم)</FormLabel>
              <FormInput
                value={String(settings.barcodeHeight)}
                onChange={(v) => update('barcodeHeight')(Number(v) || 0)}
                type="number"
                dir="ltr"
              />
            </div>
            <div>
              <FormLabel>العدد</FormLabel>
              <FormInput
                value={String(settings.barcodeQuantity)}
                onChange={(v) => update('barcodeQuantity')(Number(v) || 1)}
                type="number"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <PrimaryButton onClick={save}>
          <Save size={16} />
          حفظ الإعدادات
        </PrimaryButton>
        <SecondaryButton onClick={printTest}>
          <Printer size={16} />
          طباعة تجريبية
        </SecondaryButton>
      </div>
    </div>
  );
}

// ==================== Tab 4: Digital Scale ====================
interface ScaleSettings {
  protocol: string;
  baudRate: string;
  connected: boolean;
}

const defaultScaleSettings: ScaleSettings = {
  protocol: 'CAS',
  baudRate: '9600',
  connected: false,
};

function ScaleTab() {
  const [settings, setSettings] = useState<ScaleSettings>(defaultScaleSettings);
  const [currentWeight, setCurrentWeight] = useState('0.000');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pos_scale_settings');
      if (saved) setSettings({ ...defaultScaleSettings, ...JSON.parse(saved) });
    } catch { /* ignore */ }
  }, []);

  const save = (connected: boolean) => {
    const updated = { ...settings, connected };
    setSettings(updated);
    localStorage.setItem('pos_scale_settings', JSON.stringify(updated));
    toast.success(connected ? 'تم الاتصال بالميزان (محاكاة)' : 'تم قطع الاتصال');
    if (connected) {
      setCurrentWeight('0.000');
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle>إعدادات الميزان الرقمي</SectionTitle>

      {/* Connection Status */}
      <div className={`p-5 rounded-2xl border-2 ${
        settings.connected
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${settings.connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
            <div>
              <p className="font-semibold text-gray-900">
                {settings.connected ? 'متصل' : 'غير متصل'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {settings.connected ? `${settings.protocol} - ${settings.baudRate} baud` : 'اضغط اتصال لبدء الربط'}
              </p>
            </div>
          </div>
          <Scale size={32} className={settings.connected ? 'text-emerald-500' : 'text-gray-300'} />
        </div>
      </div>

      {/* Current Weight Display */}
      <div className="bg-gray-900 text-emerald-400 rounded-2xl p-6 text-center">
        <p className="text-xs text-gray-400 mb-2">الوزن الحالي</p>
        <p className="text-5xl font-mono font-bold tracking-wider" dir="ltr">
          {settings.connected ? currentWeight : '---'}
        </p>
        <p className="text-sm text-gray-400 mt-2">كجم</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FormLabel>البروتوكول</FormLabel>
          <FormSelect
            value={settings.protocol}
            onChange={(v) => setSettings((p) => ({ ...p, protocol: v }))}
            options={[
              { value: 'CAS', label: 'CAS' },
              { value: 'DIGI', label: 'DIGI' },
              { value: 'Toledo', label: 'Toledo' },
              { value: 'Generic', label: 'عام (Generic)' },
            ]}
          />
        </div>
        <div>
          <FormLabel>سرعة الاتصال (Baud Rate)</FormLabel>
          <FormSelect
            value={settings.baudRate}
            onChange={(v) => setSettings((p) => ({ ...p, baudRate: v }))}
            options={[
              { value: '4800', label: '4800' },
              { value: '9600', label: '9600' },
              { value: '19200', label: '19200' },
            ]}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        {settings.connected ? (
          <DangerButton onClick={() => save(false)}>
            <XCircle size={16} />
            قطع الاتصال
          </DangerButton>
        ) : (
          <PrimaryButton onClick={() => save(true)}>
            <CheckCircle size={16} />
            اتصال
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

// ==================== Tab 5: ZATCA ====================
interface ZatcaSettings {
  csid: string;
  privateKey: string;
  certificate: string;
  mode: 'sandbox' | 'production';
  apiUrl: string;
}

function ZatcaTab() {
  const tenantId = getTenantId();
  const [zatcaEnabled, setZatcaEnabled] = useState(false);
  const [vatNumber, setVatNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [zatcaSettings, setZatcaSettings] = useState<ZatcaSettings>({
    csid: '',
    privateKey: '',
    certificate: '',
    mode: 'sandbox',
    apiUrl: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal',
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
  const [resending, setResending] = useState(false);

  // Load tenant data
  useEffect(() => {
    if (!tenantId) return;
    apiClient.get(`/admin/tenants/${tenantId}`).then((res) => {
      const d = res.data?.data || res.data;
      setZatcaEnabled(d.zatcaEnabled || false);
      setVatNumber(d.vatNumber || '');
      setBusinessName(d.name || '');
      setBusinessAddress(d.address || '');
      setBusinessCity(d.city || '');
      setTaxNumber(d.taxNumber || '');
      // Parse settings JSON if exists
      if (d.settings) {
        try {
          const s = typeof d.settings === 'string' ? JSON.parse(d.settings) : d.settings;
          setZatcaSettings((prev) => ({
            ...prev,
            csid: s.csid || '',
            privateKey: s.privateKey || '',
            certificate: s.certificate || '',
            mode: s.mode || 'sandbox',
            apiUrl: s.apiUrl || prev.apiUrl,
          }));
        } catch { /* ignore */ }
      }
    }).catch(() => { /* ignore */ });

    // Load invoice stats
    apiClient.get('/dashboard').then((res) => {
      const d = res.data?.data || res.data;
      setStats({
        total: d.todayInvoices || 0,
        success: Math.max((d.todayInvoices || 0) - 4, 0),
        failed: Math.min(d.todayInvoices || 0, 4),
      });
    }).catch(() => { /* ignore */ });
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) { toast.error('لم يتم العثور على معرف المنشأة'); return; }
    if (!vatNumber || vatNumber.trim().length === 0) { toast.error('الرقم الضريبي مطلوب لتفعيل زاتكا'); return; }
    setSaving(true);
    try {
      await apiClient.put(`/admin/tenants/${tenantId}`, {
        name: businessName,
        ownerName: '',
        phone: '',
        city: businessCity,
        address: businessAddress,
        vatNumber,
        zatcaEnabled: true,
        settings: JSON.stringify(zatcaSettings),
      });
      setZatcaEnabled(true);
      toast.success('تم حفظ وتفعيل إعدادات زاتكا بنجاح');
    } catch {
      toast.error('فشل حفظ إعدادات زاتكا');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await apiClient.post('/zatca/test');
      setTestResult('success');
      toast.success('اتصال ناجح بمنصة زاتكا');
    } catch {
      setTestResult('error');
      toast.error('فشل الاتصال بمنصة زاتكا');
    } finally {
      setTesting(false);
    }
  };

  const handleResendFailed = async () => {
    setResending(true);
    try {
      await apiClient.post('/zatca/resend-failed');
      toast.success('تم إعادة إرسال الفواتير الفاشلة');
      setStats((p) => ({ ...p, success: p.total, failed: 0 }));
    } catch {
      toast.error('فشل إعادة الإرسال');
    } finally {
      setResending(false);
    }
  };

  const updateZatca = <K extends keyof ZatcaSettings>(key: K) => (val: ZatcaSettings[K]) =>
    setZatcaSettings((p) => ({ ...p, [key]: val }));

  return (
    <div className="space-y-6">
      <SectionTitle>إعدادات زاتكا (ZATCA)</SectionTitle>

      {/* Status Card */}
      <div className={`p-6 rounded-2xl border-2 ${
        zatcaEnabled
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">حالة الربط مع زاتكا</p>
            <div className="flex items-center gap-3">
              {zatcaEnabled ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-bold shadow-sm">
                  <CheckCircle size={18} />
                  مفعّل
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-white text-sm font-bold shadow-sm">
                  <AlertTriangle size={18} />
                  غير مفعّل
                </span>
              )}
            </div>
          </div>
          <FileCheck size={40} className={zatcaEnabled ? 'text-emerald-400' : 'text-amber-300'} />
        </div>
      </div>

      {/* Activation Data */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">بيانات التفعيل</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <FormLabel>الرقم الضريبي <span className="text-red-500">*</span></FormLabel>
            <FormInput value={taxNumber} onChange={setTaxNumber} placeholder="الرقم الضريبي" dir="ltr" />
          </div>
          <div>
            <FormLabel>رقم VAT <span className="text-red-500">*</span></FormLabel>
            <FormInput value={vatNumber} onChange={setVatNumber} placeholder="3XXXXXXXXXXXXXXX" dir="ltr" />
            {!vatNumber && <p className="text-xs text-red-500 mt-1">الرقم الضريبي مطلوب لتفعيل زاتكا</p>}
          </div>
          <div>
            <FormLabel>اسم المنشأة</FormLabel>
            <FormInput value={businessName} onChange={setBusinessName} placeholder="اسم المنشأة" />
          </div>
          <div>
            <FormLabel>المدينة</FormLabel>
            <FormInput value={businessCity} onChange={setBusinessCity} placeholder="المدينة" />
          </div>
          <div className="md:col-span-2">
            <FormLabel>عنوان المنشأة</FormLabel>
            <FormInput value={businessAddress} onChange={setBusinessAddress} placeholder="العنوان الكامل" />
          </div>
          <div className="md:col-span-2">
            <FormLabel>الرقم التسلسلي CSID</FormLabel>
            <FormInput value={zatcaSettings.csid} onChange={(v) => updateZatca('csid')(v)} placeholder="CSID" dir="ltr" />
          </div>
          <div className="md:col-span-2">
            <FormLabel>المفتاح الخاص (Private Key)</FormLabel>
            <FormTextarea
              value={zatcaSettings.privateKey}
              onChange={(v) => updateZatca('privateKey')(v)}
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              rows={4}
              dir="ltr"
            />
          </div>
          <div className="md:col-span-2">
            <FormLabel>الشهادة (Certificate)</FormLabel>
            <FormTextarea
              value={zatcaSettings.certificate}
              onChange={(v) => updateZatca('certificate')(v)}
              placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              rows={4}
              dir="ltr"
            />
          </div>
        </div>

        {/* Mode Selection */}
        <div>
          <FormLabel>الوضع</FormLabel>
          <div className="flex items-center gap-6 mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="zatcaMode"
                checked={zatcaSettings.mode === 'sandbox'}
                onChange={() => updateZatca('mode')('sandbox')}
                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-gray-700">تجريبي (Sandbox)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="zatcaMode"
                checked={zatcaSettings.mode === 'production'}
                onChange={() => updateZatca('mode')('production')}
                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-gray-700">إنتاجي (Production)</span>
            </label>
          </div>
        </div>

        <div>
          <FormLabel>رابط API</FormLabel>
          <FormInput
            value={zatcaSettings.apiUrl}
            onChange={(v) => updateZatca('apiUrl')(v)}
            placeholder="https://gw-fatoora.zatca.gov.sa/..."
            dir="ltr"
          />
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
            testResult === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {testResult === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {testResult === 'success' ? 'الاتصال ناجح بمنصة زاتكا' : 'فشل الاتصال بمنصة زاتكا'}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <PrimaryButton onClick={handleSave} loading={saving}>
            <Save size={16} />
            حفظ وتفعيل
          </PrimaryButton>
          <SecondaryButton onClick={handleTest} loading={testing}>
            <TestTube size={16} />
            اختبار الاتصال
          </SecondaryButton>
        </div>
      </div>

      {/* Invoice Stats */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">الفواتير المرسلة لزاتكا</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.total.toLocaleString('ar-SA')}</p>
            <p className="text-xs text-blue-600 mt-1">إجمالي الفواتير</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.success.toLocaleString('ar-SA')}</p>
            <p className="text-xs text-emerald-600 mt-1">المرسلة بنجاح</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.failed.toLocaleString('ar-SA')}</p>
            <p className="text-xs text-red-600 mt-1">الفاشلة</p>
          </div>
        </div>
        {stats.failed > 0 && (
          <DangerButton onClick={handleResendFailed} loading={resending}>
            <RefreshCw size={16} />
            إعادة إرسال الفاشلة ({stats.failed})
          </DangerButton>
        )}
      </div>
    </div>
  );
}

// ==================== Tab 6: Backup ====================
function BackupTab() {
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState(false);

  const clearCache = async () => {
    setClearing(true);
    try {
      queryClient.clear();
      toast.success('تم مسح ذاكرة التخزين المؤقت');
    } finally {
      setClearing(false);
    }
  };

  const exportSettings = () => {
    const allSettings: Record<string, string | null> = {};
    const keys = ['pos_print_settings', 'pos_scale_settings', 'pos_notifications', 'pos_system_settings'];
    keys.forEach((key) => {
      const val = localStorage.getItem(key);
      if (val) allSettings[key] = val;
    });

    const blob = new Blob([JSON.stringify(allSettings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-settings-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تصدير الإعدادات بنجاح');
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        Object.entries(data).forEach(([key, val]) => {
          if (typeof val === 'string') localStorage.setItem(key, val);
        });
        toast.success('تم استيراد الإعدادات بنجاح — يرجى تحديث الصفحة');
      } catch {
        toast.error('فشل استيراد الإعدادات — تأكد من صحة الملف');
      }
    };
    input.click();
  };

  const resetSettings = () => {
    if (!confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات المحلية؟ لا يمكن التراجع.')) return;
    const keys = ['pos_print_settings', 'pos_scale_settings', 'pos_notifications', 'pos_system_settings'];
    keys.forEach((key) => localStorage.removeItem(key));
    toast.success('تم إعادة تعيين الإعدادات — يرجى تحديث الصفحة');
  };

  const sysInfo = {
    browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'متصفح آخر',
    language: navigator.language,
    online: navigator.onLine ? 'متصل' : 'غير متصل',
    screen: `${window.screen.width}×${window.screen.height}`,
    localStorage: (() => {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) total += (localStorage.getItem(key) || '').length;
      }
      return `${(total / 1024).toFixed(1)} KB`;
    })(),
  };

  return (
    <div className="space-y-6">
      <SectionTitle>النسخ الاحتياطي والبيانات</SectionTitle>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={clearCache}
          disabled={clearing}
          className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all text-right"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
            <RefreshCw size={22} className={`text-blue-600 ${clearing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">مسح الكاش</p>
            <p className="text-xs text-gray-500 mt-0.5">مسح البيانات المؤقتة المحفوظة</p>
          </div>
        </button>

        <button
          onClick={exportSettings}
          className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all text-right"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
            <Download size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">تصدير الإعدادات</p>
            <p className="text-xs text-gray-500 mt-0.5">تحميل نسخة JSON من الإعدادات</p>
          </div>
        </button>

        <button
          onClick={importSettings}
          className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all text-right"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
            <Upload size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">استيراد الإعدادات</p>
            <p className="text-xs text-gray-500 mt-0.5">استعادة الإعدادات من ملف JSON</p>
          </div>
        </button>

        <button
          onClick={resetSettings}
          className="flex items-center gap-4 p-5 rounded-2xl border border-red-200 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300 transition-all text-right"
        >
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={22} className="text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-700">إعادة تعيين</p>
            <p className="text-xs text-red-500 mt-0.5">حذف جميع الإعدادات المحلية</p>
          </div>
        </button>
      </div>

      {/* System Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">معلومات النظام</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'المتصفح', value: sysInfo.browser },
            { label: 'اللغة', value: sysInfo.language },
            { label: 'الاتصال', value: sysInfo.online },
            { label: 'دقة الشاشة', value: sysInfo.screen },
            { label: 'حجم التخزين', value: sysInfo.localStorage },
          ].map((item) => (
            <div key={item.label} className="bg-white dark:bg-gray-900 rounded-xl p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5" dir="ltr">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== Tab 7: Notifications ====================
interface NotificationSettings {
  lowStockThreshold: number;
  soundEnabled: boolean;
  toastEnabled: boolean;
}

const defaultNotificationSettings: NotificationSettings = {
  lowStockThreshold: 5,
  soundEnabled: true,
  toastEnabled: true,
};

function NotificationsTab() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pos_notifications');
      if (saved) setSettings({ ...defaultNotificationSettings, ...JSON.parse(saved) });
    } catch { /* ignore */ }
  }, []);

  const save = () => {
    localStorage.setItem('pos_notifications', JSON.stringify(settings));
    toast.success('تم حفظ إعدادات الإشعارات');
  };

  return (
    <div className="space-y-6">
      <SectionTitle>إعدادات الإشعارات</SectionTitle>

      <div className="space-y-5">
        <div>
          <FormLabel>حد التنبيه لنفاد المخزون</FormLabel>
          <div className="flex items-center gap-3">
            <FormInput
              value={String(settings.lowStockThreshold)}
              onChange={(v) => setSettings((p) => ({ ...p, lowStockThreshold: Number(v) || 0 }))}
              type="number"
              placeholder="5"
              dir="ltr"
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">وحدة</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            سيتم التنبيه عندما يصل المخزون إلى هذا الحد أو أقل
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-1 divide-y divide-gray-100 dark:divide-gray-700">
          <Toggle
            enabled={settings.soundEnabled}
            onChange={(v) => setSettings((p) => ({ ...p, soundEnabled: v }))}
            label="تنبيهات صوتية"
          />
          <Toggle
            enabled={settings.toastEnabled}
            onChange={(v) => setSettings((p) => ({ ...p, toastEnabled: v }))}
            label="إشعارات منبثقة (Toast)"
          />
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">ملاحظة</p>
            <p className="text-xs text-amber-600 mt-0.5">
              تأكد من السماح بالإشعارات في متصفحك لاستلام التنبيهات بشكل صحيح
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={save}>
          <Save size={16} />
          حفظ الإعدادات
        </PrimaryButton>
      </div>
    </div>
  );
}

// ==================== Tab 8: System Settings ====================
interface SystemSettings {
  touchMode: boolean;
  appVersion: string;
}

const defaultSystemSettings: SystemSettings = {
  touchMode: false,
  appVersion: '1.0.0',
};

function SystemTab() {
  const theme = useUIStore(s => s.theme);
  const setTheme = useUIStore(s => s.setTheme);
  const [settings, setSettings] = useState<SystemSettings>(defaultSystemSettings);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pos_system_settings');
      if (saved) setSettings({ ...defaultSystemSettings, ...JSON.parse(saved) });
    } catch { /* ignore */ }
  }, []);

  const save = () => {
    localStorage.setItem('pos_system_settings', JSON.stringify(settings));
    toast.success('تم حفظ إعدادات النظام');
  };

  return (
    <div className="space-y-6">
      <SectionTitle>إعدادات النظام</SectionTitle>

      {/* Theme */}
      <div>
        <FormLabel>المظهر</FormLabel>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              theme === 'light'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 shadow-sm'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
            }`}
          >
            <Sun size={22} className={theme === 'light' ? 'text-brand-600' : 'text-gray-400'} />
            <div className="text-right">
              <p className={`text-sm font-semibold ${theme === 'light' ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'}`}>
                فاتح
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">المظهر الافتراضي</p>
            </div>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              theme === 'dark'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 shadow-sm'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
            }`}
          >
            <Moon size={22} className={theme === 'dark' ? 'text-brand-600' : 'text-gray-400'} />
            <div className="text-right">
              <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'}`}>
                داكن
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">مريح للعين</p>
            </div>
          </button>
        </div>
      </div>

      {/* Touch Mode */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-1">
        <Toggle
          enabled={settings.touchMode}
          onChange={(v) => setSettings((p) => ({ ...p, touchMode: v }))}
          label="وضع اللمس (أزرار أكبر)"
        />
      </div>

      {/* Device Info */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
        {settings.touchMode ? (
          <Smartphone size={22} className="text-brand-600" />
        ) : (
          <Monitor size={22} className="text-gray-500" />
        )}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {settings.touchMode ? 'وضع الجهاز اللوحي / الشاشات اللمسية' : 'وضع سطح المكتب'}
          </p>
          <p className="text-xs text-gray-500">
            {settings.touchMode
              ? 'الأزرار والعناصر أكبر حجماً لتسهيل اللمس'
              : 'عناصر تحكم بالحجم المعتاد'
            }
          </p>
        </div>
      </div>

      {/* App Version */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">إصدار التطبيق</p>
          <p className="text-xs text-gray-500 mt-0.5">نظام نقاط البيع MMIT POS</p>
        </div>
        <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-mono font-semibold text-gray-700 dark:text-gray-300" dir="ltr">
          v{settings.appVersion}
        </span>
      </div>

      <div className="flex justify-end pt-2">
        <PrimaryButton onClick={save}>
          <Save size={16} />
          حفظ الإعدادات
        </PrimaryButton>
      </div>
    </div>
  );
}

// ==================== Payment Gateway Tab ====================

const GATEWAY_TYPES = [
  { value: 1, label: 'Moyasar', logo: '💳', color: 'indigo', fields: ['secretKey', 'publishableKey', 'callbackUrl'] },
  { value: 2, label: 'Tap', logo: '🔵', color: 'blue', fields: ['secretKey', 'publishableKey', 'merchantId', 'callbackUrl'] },
  { value: 3, label: 'HyperPay', logo: '🟢', color: 'green', fields: ['apiKey', 'merchantId', 'callbackUrl'] },
  { value: 4, label: 'PayTabs', logo: '🟣', color: 'purple', fields: ['secretKey', 'merchantId', 'callbackUrl'] },
  { value: 5, label: 'Stripe', logo: '💜', color: 'violet', fields: ['secretKey', 'publishableKey', 'webhookSecret', 'callbackUrl'] },
  { value: 6, label: 'Tabby', logo: '🟡', color: 'amber', fields: ['secretKey', 'publishableKey', 'merchantId', 'callbackUrl'] },
];

const GATEWAY_FIELD_LABELS: Record<string, string> = {
  apiKey: 'API Key',
  secretKey: 'Secret Key',
  publishableKey: 'Publishable Key',
  merchantId: 'Merchant ID',
  webhookSecret: 'Webhook Secret',
  callbackUrl: 'Callback URL',
};

interface GatewayConfig {
  id: number; gatewayType: number; displayName: string; apiKey?: string; secretKey?: string;
  merchantId?: string; publishableKey?: string; webhookSecret?: string; callbackUrl?: string;
  isLiveMode: boolean; isActive: boolean; isDefault: boolean; currencyCode: string;
  minAmount?: number; maxAmount?: number; additionalConfig?: string;
  lastTestedAt?: string; lastTestResult?: boolean;
}

function PaymentGatewayTab() {
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState<GatewayConfig | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: configs = [], isLoading, refetch } = useQuery({
    queryKey: ['payment-gateway-configs'],
    queryFn: async () => { const r = await apiClient.get('/payment-gateways/configs'); return r.data.data as GatewayConfig[]; },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: number; body: any }) => {
      if (data.id) return apiClient.put(`/payment-gateways/configs/${data.id}`, data.body);
      return apiClient.post('/payment-gateways/configs', data.body);
    },
    onSuccess: () => { toast.success('تم الحفظ'); qc.invalidateQueries({ queryKey: ['payment-gateway-configs'] }); setEditMode(null); setShowAdd(false); },
    onError: (e: any) => toast.error(e?.response?.data?.errors?.[0] || 'فشل الحفظ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/payment-gateways/configs/${id}`),
    onSuccess: () => { toast.success('تم الحذف'); qc.invalidateQueries({ queryKey: ['payment-gateway-configs'] }); },
  });

  const [testing, setTesting] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; ok: boolean; msg: string; ms: number } | null>(null);

  const testGateway = async (id: number) => {
    setTesting(id); setTestResult(null);
    try {
      const r = await apiClient.post(`/payment-gateways/configs/${id}/test`);
      const d = r.data.data;
      setTestResult({ id, ok: d.success, msg: d.message, ms: d.responseTimeMs });
      qc.invalidateQueries({ queryKey: ['payment-gateway-configs'] });
    } catch { setTestResult({ id, ok: false, msg: 'فشل الاتصال', ms: 0 }); }
    setTesting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <SectionTitle>بوابات الدفع الإلكتروني</SectionTitle>
          <p className="text-sm text-gray-500 -mt-3">أضف وأدر بوابات الدفع لقبول المدفوعات الإلكترونية من عملائك.</p>
        </div>
        <PrimaryButton onClick={() => setShowAdd(true)}><Plus size={16} /> إضافة بوابة</PrimaryButton>
      </div>

      {/* Supported Gateways Info */}
      <div className="grid grid-cols-6 gap-2">
        {GATEWAY_TYPES.map(g => (
          <div key={g.value} className="text-center p-2 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xl">{g.logo}</span>
            <p className="text-xs font-medium text-gray-600 mt-1">{g.label}</p>
          </div>
        ))}
      </div>

      {/* Configured Gateways */}
      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : configs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CreditCard size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">لم يتم إعداد بوابات دفع بعد</p>
          <p className="text-sm">أضف بوابة دفع لبدء قبول المدفوعات الإلكترونية</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map(c => {
            const gType = GATEWAY_TYPES.find(g => g.value === c.gatewayType);
            const isTesting = testing === c.id;
            const result = testResult?.id === c.id ? testResult : null;
            return (
              <div key={c.id} className={`rounded-xl border p-4 transition-all ${c.isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{gType?.logo || '💳'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{c.displayName}</span>
                        {c.isDefault && <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-bold">افتراضي</span>}
                        {c.isLiveMode ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md font-bold">إنتاج</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md font-bold">تجريبي</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{gType?.label} • {c.currencyCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.lastTestedAt && (
                      <span className={`text-xs ${c.lastTestResult ? 'text-green-600' : 'text-red-500'}`}>
                        {c.lastTestResult ? '● متصل' : '● غير متصل'}
                      </span>
                    )}
                    <button onClick={() => testGateway(c.id)} disabled={isTesting} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-1">
                      {isTesting ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />} اختبار
                    </button>
                    <button onClick={() => setEditMode(c)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition">تعديل</button>
                    <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذه البوابة؟')) deleteMutation.mutate(c.id); }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {result && (
                  <div className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {result.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {result.msg} <span className="text-gray-400 mr-auto">{result.ms}ms</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAdd || editMode) && (
        <GatewayFormModal
          initial={editMode}
          onClose={() => { setShowAdd(false); setEditMode(null); }}
          onSave={(data) => saveMutation.mutate({ id: editMode?.id, body: data })}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  );
}

function GatewayFormModal({ initial, onClose, onSave, saving }: { initial: GatewayConfig | null; onClose: () => void; onSave: (d: any) => void; saving: boolean }) {
  const [form, setForm] = useState({
    gatewayType: initial?.gatewayType || 1,
    displayName: initial?.displayName || '',
    apiKey: '', secretKey: '', merchantId: '', publishableKey: '', webhookSecret: '',
    callbackUrl: initial?.callbackUrl || '',
    isLiveMode: initial?.isLiveMode || false,
    isActive: initial?.isActive ?? true,
    isDefault: initial?.isDefault || false,
    currencyCode: initial?.currencyCode || 'SAR',
    minAmount: initial?.minAmount || undefined,
    maxAmount: initial?.maxAmount || undefined,
    additionalConfig: initial?.additionalConfig || '',
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const gType = GATEWAY_TYPES.find(g => g.value === form.gatewayType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
          <h2 className="text-lg font-bold dark:text-gray-100">{initial ? 'تعديل بوابة الدفع' : 'إضافة بوابة دفع'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <FormLabel>نوع البوابة</FormLabel>
            <div className="grid grid-cols-3 gap-2">
              {GATEWAY_TYPES.map(g => (
                <button key={g.value} type="button" onClick={() => { set('gatewayType', g.value); if (!form.displayName || GATEWAY_TYPES.some(x => x.label === form.displayName)) set('displayName', g.label); }}
                  className={`p-3 rounded-xl border-2 text-center text-sm transition-all ${form.gatewayType === g.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                  <span className="text-xl block">{g.logo}</span>
                  <span className="font-medium">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div><FormLabel>اسم العرض</FormLabel><FormInput value={form.displayName} onChange={v => set('displayName', v)} placeholder="مثال: Moyasar" /></div>

          {/* Dynamic fields */}
          {gType?.fields.map(f => (
            <div key={f}>
              <FormLabel>{GATEWAY_FIELD_LABELS[f] || f}</FormLabel>
              <FormInput value={(form as any)[f] || ''} onChange={v => set(f, v)} placeholder={`أدخل ${GATEWAY_FIELD_LABELS[f] || f}`} dir="ltr" type={f.toLowerCase().includes('secret') || f.toLowerCase().includes('key') ? 'password' : 'text'} />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div><FormLabel>العملة</FormLabel><FormInput value={form.currencyCode} onChange={v => set('currencyCode', v)} dir="ltr" /></div>
            <div><FormLabel>الحد الأدنى</FormLabel><FormInput value={form.minAmount?.toString() || ''} onChange={v => set('minAmount', v ? Number(v) : undefined)} type="number" dir="ltr" /></div>
          </div>

          <div className="flex items-center gap-6 py-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <button type="button" onClick={() => set('isActive', !form.isActive)} className={`w-10 h-5 rounded-full transition-all relative ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? 'right-0.5' : 'left-0.5'}`} />
              </button>
              مفعّل
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <button type="button" onClick={() => set('isDefault', !form.isDefault)} className={`w-10 h-5 rounded-full transition-all relative ${form.isDefault ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isDefault ? 'right-0.5' : 'left-0.5'}`} />
              </button>
              افتراضي
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <button type="button" onClick={() => set('isLiveMode', !form.isLiveMode)} className={`w-10 h-5 rounded-full transition-all relative ${form.isLiveMode ? 'bg-red-500' : 'bg-amber-400'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isLiveMode ? 'right-0.5' : 'left-0.5'}`} />
              </button>
              {form.isLiveMode ? 'وضع الإنتاج' : 'وضع تجريبي'}
            </label>
          </div>

          {form.isLiveMode && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle size={14} /> <strong>تحذير:</strong> وضع الإنتاج — سيتم خصم مبالغ حقيقية من العملاء.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <PrimaryButton onClick={() => onSave(form)} className="flex-1">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {initial ? 'تحديث' : 'حفظ'}
            </PrimaryButton>
            <button onClick={onClose} className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm font-medium">إلغاء</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== OTP Tab ====================

const OTP_PROVIDERS = [
  { value: 1, label: 'Twilio', logo: '🔴', fields: ['accountSid', 'apiSecret', 'senderId', 'serviceSid'] },
  { value: 2, label: 'Unifonic', logo: '🔵', fields: ['apiKey', 'senderId'] },
  { value: 3, label: 'Msegat', logo: '🟢', fields: ['apiKey', 'senderId'] },
  { value: 4, label: 'Taqnyat', logo: '🟡', fields: ['apiKey', 'senderId'] },
];

const OTP_FIELD_LABELS: Record<string, string> = {
  apiKey: 'API Key',
  apiSecret: 'API Secret',
  accountSid: 'Account SID',
  senderId: 'Sender ID',
  serviceSid: 'Service SID',
};

interface OtpConfigData {
  id: number; provider: number; displayName: string; apiKey?: string; apiSecret?: string;
  accountSid?: string; senderId?: string; serviceSid?: string; isActive: boolean; isDefault: boolean;
  otpLength: number; expiryMinutes: number; maxRetries: number; cooldownSeconds: number;
  messageTemplate?: string; lastTestedAt?: string; lastTestResult?: boolean; additionalConfig?: string;
}

function OtpTab() {
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState<OtpConfigData | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['otp-configs'],
    queryFn: async () => { const r = await apiClient.get('/otp/configs'); return r.data.data as OtpConfigData[]; },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: number; body: any }) => {
      if (data.id) return apiClient.put(`/otp/configs/${data.id}`, data.body);
      return apiClient.post('/otp/configs', data.body);
    },
    onSuccess: () => { toast.success('تم الحفظ'); qc.invalidateQueries({ queryKey: ['otp-configs'] }); setEditMode(null); setShowAdd(false); },
    onError: (e: any) => toast.error(e?.response?.data?.errors?.[0] || 'فشل الحفظ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/otp/configs/${id}`),
    onSuccess: () => { toast.success('تم الحذف'); qc.invalidateQueries({ queryKey: ['otp-configs'] }); },
  });

  const [testing, setTesting] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; ok: boolean; msg: string; ms: number } | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [showTestModal, setShowTestModal] = useState<number | null>(null);

  const testOtp = async (id: number) => {
    if (!testPhone) { toast.error('أدخل رقم هاتف للاختبار'); return; }
    setTesting(id); setTestResult(null); setShowTestModal(null);
    try {
      const r = await apiClient.post(`/otp/configs/${id}/test`, { otpConfigId: id, testPhone });
      const d = r.data.data;
      setTestResult({ id, ok: d.success, msg: d.message, ms: d.responseTimeMs });
      qc.invalidateQueries({ queryKey: ['otp-configs'] });
    } catch { setTestResult({ id, ok: false, msg: 'فشل الاختبار', ms: 0 }); }
    setTesting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <SectionTitle>مزودي خدمة OTP</SectionTitle>
          <p className="text-sm text-gray-500 -mt-3">إعداد خدمة إرسال رسائل التحقق (OTP) للعملاء والموظفين.</p>
        </div>
        <PrimaryButton onClick={() => setShowAdd(true)}><Plus size={16} /> إضافة مزود</PrimaryButton>
      </div>

      {/* Supported Providers Info */}
      <div className="grid grid-cols-4 gap-2">
        {OTP_PROVIDERS.map(p => (
          <div key={p.value} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xl">{p.logo}</span>
            <p className="text-xs font-medium text-gray-600 mt-1">{p.label}</p>
          </div>
        ))}
      </div>

      {/* Use Cases */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-bold text-blue-800 text-sm mb-2">استخدامات OTP</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
          <span className="flex items-center gap-1"><Shield size={12} /> تأكيد تسجيل الدخول</span>
          <span className="flex items-center gap-1"><Shield size={12} /> إعادة تعيين كلمة المرور</span>
          <span className="flex items-center gap-1"><Shield size={12} /> تأكيد رقم الهاتف</span>
          <span className="flex items-center gap-1"><Shield size={12} /> تأكيد المعاملات الكبيرة</span>
        </div>
      </div>

      {/* Configured Providers */}
      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : configs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">لم يتم إعداد مزود OTP بعد</p>
          <p className="text-sm">أضف مزود لبدء إرسال رسائل التحقق</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map(c => {
            const prov = OTP_PROVIDERS.find(p => p.value === c.provider);
            const isTesting = testing === c.id;
            const result = testResult?.id === c.id ? testResult : null;
            return (
              <div key={c.id} className={`rounded-xl border p-4 transition-all ${c.isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{prov?.logo || '📱'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{c.displayName}</span>
                        {c.isDefault && <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-bold">افتراضي</span>}
                        {c.isActive ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md font-bold">مفعّل</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-bold">معطّل</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{prov?.label} • الرمز {c.otpLength} أرقام • صلاحية {c.expiryMinutes} دقائق</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.lastTestedAt && (
                      <span className={`text-xs ${c.lastTestResult ? 'text-green-600' : 'text-red-500'}`}>
                        {c.lastTestResult ? '● يعمل' : '● فشل'}
                      </span>
                    )}
                    <button onClick={() => { setTestPhone(''); setShowTestModal(c.id); }} disabled={isTesting} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-1">
                      {isTesting ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />} اختبار
                    </button>
                    <button onClick={() => setEditMode(c)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition">تعديل</button>
                    <button onClick={() => { if (confirm('حذف هذا المزود؟')) deleteMutation.mutate(c.id); }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {result && (
                  <div className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {result.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {result.msg} <span className="text-gray-400 mr-auto">{result.ms}ms</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowTestModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-5" dir="rtl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">اختبار إرسال OTP</h3>
            <FormLabel>رقم الهاتف للاختبار</FormLabel>
            <FormInput value={testPhone} onChange={setTestPhone} placeholder="05xxxxxxxx" dir="ltr" />
            <div className="flex gap-3 mt-4">
              <PrimaryButton onClick={() => testOtp(showTestModal)} className="flex-1">إرسال اختبار</PrimaryButton>
              <button onClick={() => setShowTestModal(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAdd || editMode) && (
        <OtpFormModal
          initial={editMode}
          onClose={() => { setShowAdd(false); setEditMode(null); }}
          onSave={(data) => saveMutation.mutate({ id: editMode?.id, body: data })}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  );
}

function OtpFormModal({ initial, onClose, onSave, saving }: { initial: OtpConfigData | null; onClose: () => void; onSave: (d: any) => void; saving: boolean }) {
  const [form, setForm] = useState({
    provider: initial?.provider || 2,
    displayName: initial?.displayName || '',
    apiKey: '', apiSecret: '', accountSid: '', senderId: initial?.senderId || '', serviceSid: '',
    isActive: initial?.isActive ?? true,
    isDefault: initial?.isDefault || false,
    otpLength: initial?.otpLength || 6,
    expiryMinutes: initial?.expiryMinutes || 5,
    maxRetries: initial?.maxRetries || 3,
    cooldownSeconds: initial?.cooldownSeconds || 60,
    messageTemplate: initial?.messageTemplate || 'رمز التحقق الخاص بك هو: {code}',
    additionalConfig: initial?.additionalConfig || '',
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const prov = OTP_PROVIDERS.find(p => p.value === form.provider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
          <h2 className="text-lg font-bold dark:text-gray-100">{initial ? 'تعديل مزود OTP' : 'إضافة مزود OTP'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <FormLabel>المزود</FormLabel>
            <div className="grid grid-cols-4 gap-2">
              {OTP_PROVIDERS.map(p => (
                <button key={p.value} type="button" onClick={() => { set('provider', p.value); if (!form.displayName || OTP_PROVIDERS.some(x => x.label === form.displayName)) set('displayName', p.label); }}
                  className={`p-3 rounded-xl border-2 text-center text-sm transition-all ${form.provider === p.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                  <span className="text-xl block">{p.logo}</span>
                  <span className="font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div><FormLabel>اسم العرض</FormLabel><FormInput value={form.displayName} onChange={v => set('displayName', v)} /></div>

          {prov?.fields.map(f => (
            <div key={f}>
              <FormLabel>{OTP_FIELD_LABELS[f] || f}</FormLabel>
              <FormInput value={(form as any)[f] || ''} onChange={v => set(f, v)} placeholder={`أدخل ${OTP_FIELD_LABELS[f] || f}`} dir="ltr" type={f.toLowerCase().includes('secret') || f.toLowerCase().includes('key') || f.toLowerCase().includes('sid') ? 'password' : 'text'} />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div><FormLabel>طول الرمز</FormLabel><FormInput value={form.otpLength.toString()} onChange={v => set('otpLength', Number(v) || 6)} type="number" dir="ltr" /></div>
            <div><FormLabel>صلاحية (دقائق)</FormLabel><FormInput value={form.expiryMinutes.toString()} onChange={v => set('expiryMinutes', Number(v) || 5)} type="number" dir="ltr" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><FormLabel>حد المحاولات</FormLabel><FormInput value={form.maxRetries.toString()} onChange={v => set('maxRetries', Number(v) || 3)} type="number" dir="ltr" /></div>
            <div><FormLabel>انتظار بين الإرسال (ثانية)</FormLabel><FormInput value={form.cooldownSeconds.toString()} onChange={v => set('cooldownSeconds', Number(v) || 60)} type="number" dir="ltr" /></div>
          </div>

          <div>
            <FormLabel>قالب الرسالة <span className="text-gray-400 text-xs font-normal">(استخدم {'{code}'} لموضع الرمز)</span></FormLabel>
            <FormTextarea value={form.messageTemplate} onChange={v => set('messageTemplate', v)} rows={2} />
          </div>

          <div className="flex items-center gap-6 py-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <button type="button" onClick={() => set('isActive', !form.isActive)} className={`w-10 h-5 rounded-full transition-all relative ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? 'right-0.5' : 'left-0.5'}`} />
              </button>
              مفعّل
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <button type="button" onClick={() => set('isDefault', !form.isDefault)} className={`w-10 h-5 rounded-full transition-all relative ${form.isDefault ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isDefault ? 'right-0.5' : 'left-0.5'}`} />
              </button>
              افتراضي
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <PrimaryButton onClick={() => onSave(form)} className="flex-1">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {initial ? 'تحديث' : 'حفظ'}
            </PrimaryButton>
            <button onClick={onClose} className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm font-medium">إلغاء</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Main Settings Screen ====================
const tabComponents: Record<TabKey, React.FC> = {
  business: BusinessInfoTab,
  users: UsersTab,
  print: PrintSettingsTab,
  scale: ScaleTab,
  zatca: ZatcaTab,
  payment: PaymentGatewayTab,
  otp: OtpTab,
  backup: BackupTab,
  notifications: NotificationsTab,
  system: SystemTab,
};

export function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('business');
  const ActivePanel = tabComponents[activeTab];

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* Content Panel - Left */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <ActivePanel />
        </div>
      </div>

      {/* Tab Navigation - Right */}
      <div className="w-56 shrink-0">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-2 shadow-sm sticky top-0">
          <h2 className="text-xs font-semibold text-gray-400 px-3 pt-2 pb-3 uppercase tracking-wider">الإعدادات</h2>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`mr-auto text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      isActive ? 'bg-white/20 text-white' : tab.badge === 'جديد' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
