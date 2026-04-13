import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Image, CreditCard, Truck, ShoppingBag, BarChart3,
  Save, Plus, Trash2, Edit3, Loader2, Search,
  ChevronLeft, ChevronRight, CheckCircle, Clock, Package,
  TruckIcon, CircleCheck, ToggleLeft, ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { onlineStoreApi } from '@/lib/api/endpoints';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/cn';
import { cn } from '@/lib/utils/cn';
import { useOnlineOrderNotification } from '../hooks/useOnlineOrderNotification';

// ─── Types ──────────────────────────────────────────

type TabKey = 'dashboard' | 'settings' | 'banners' | 'payment' | 'shipping' | 'orders';

const tabs: { key: TabKey; label: string; icon: typeof Settings }[] = [
  { key: 'dashboard', label: 'لوحة المعلومات', icon: BarChart3 },
  { key: 'settings', label: 'إعدادات المتجر', icon: Settings },
  { key: 'banners', label: 'البنرات', icon: Image },
  { key: 'payment', label: 'إعدادات الدفع', icon: CreditCard },
  { key: 'shipping', label: 'إعدادات الشحن', icon: Truck },
  { key: 'orders', label: 'الطلبات', icon: ShoppingBag },
];

// ─── Shared UI Helpers ──────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{children}</h2>;
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{children}</label>;
}

function FormInput({
  value, onChange, placeholder, type = 'text', dir, disabled,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; dir?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      dir={dir}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm
        focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all disabled:opacity-50"
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
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm
        focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none"
    />
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 text-sm"
    >
      {value
        ? <ToggleRight size={28} className="text-brand-500" />
        : <ToggleLeft size={28} className="text-gray-400 dark:text-gray-600" />
      }
      {label && <span className="text-gray-700 dark:text-gray-300">{label}</span>}
    </button>
  );
}

// ═══════════════════════════════════════════════════════
// Dashboard Tab
// ═══════════════════════════════════════════════════════

function DashboardTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['online-store-dashboard'],
    queryFn: () => onlineStoreApi.getDashboard(),
  });

  const stats = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle>لوحة المعلومات</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingBag}
          label="إجمالي الطلبات"
          value={stats?.totalOrders ?? 0}
          color="bg-brand-500"
        />
        <StatCard
          icon={BarChart3}
          label="إجمالي الإيرادات"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Clock}
          label="طلبات معلقة"
          value={stats?.pendingOrders ?? 0}
          color="bg-amber-500"
        />
        <StatCard
          icon={CreditCard}
          label="متوسط قيمة الطلب"
          value={formatCurrency(stats?.avgOrderValue ?? 0)}
          color="bg-blue-500"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Store Settings Tab
// ═══════════════════════════════════════════════════════

function StoreSettingsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['online-store-settings'],
    queryFn: () => onlineStoreApi.getSettings(),
  });

  const [form, setForm] = useState({
    subdomain: '',
    customDomain: '',
    logoUrl: '',
    metaTitle: '',
    metaDescription: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
    isPublished: false,
  });

  useEffect(() => {
    if (data?.data) {
      setForm({
        subdomain: data.data.subdomain ?? '',
        customDomain: data.data.customDomain ?? '',
        logoUrl: data.data.logoUrl ?? '',
        metaTitle: data.data.metaTitle ?? '',
        metaDescription: data.data.metaDescription ?? '',
        googleAnalyticsId: data.data.googleAnalyticsId ?? '',
        facebookPixelId: data.data.facebookPixelId ?? '',
        isPublished: data.data.isPublished ?? false,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => onlineStoreApi.updateSettings(form),
    onSuccess: () => {
      toast.success('تم حفظ إعدادات المتجر');
      queryClient.invalidateQueries({ queryKey: ['online-store-settings'] });
    },
    onError: () => toast.error('فشل حفظ الإعدادات'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle>إعدادات المتجر</SectionTitle>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          حفظ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">معلومات أساسية</h3>

          <div>
            <FormLabel>النطاق الفرعي (Subdomain)</FormLabel>
            <div className="flex items-center gap-2">
              <FormInput value={form.subdomain} onChange={(v) => setForm({ ...form, subdomain: v })} placeholder="my-store" dir="ltr" />
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">.mpos.app</span>
            </div>
          </div>

          <div>
            <FormLabel>نطاق مخصص (اختياري)</FormLabel>
            <FormInput value={form.customDomain} onChange={(v) => setForm({ ...form, customDomain: v })} placeholder="store.example.com" dir="ltr" />
          </div>

          <div>
            <FormLabel>رابط الشعار (Logo URL)</FormLabel>
            <FormInput value={form.logoUrl} onChange={(v) => setForm({ ...form, logoUrl: v })} placeholder="https://..." dir="ltr" />
            {form.logoUrl && (
              <div className="mt-2 w-20 h-20 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800">
                <img src={form.logoUrl} alt="logo" className="w-full h-full object-contain" />
              </div>
            )}
          </div>

          <div className="pt-2">
            <Toggle value={form.isPublished} onChange={(v) => setForm({ ...form, isPublished: v })} label={form.isPublished ? 'المتجر منشور' : 'المتجر غير منشور'} />
          </div>
        </div>

        {/* SEO & Tracking */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">تحسين محركات البحث والتتبع</h3>

          <div>
            <FormLabel>عنوان الصفحة (Meta Title)</FormLabel>
            <FormInput value={form.metaTitle} onChange={(v) => setForm({ ...form, metaTitle: v })} placeholder="اسم متجرك" />
          </div>

          <div>
            <FormLabel>وصف الصفحة (Meta Description)</FormLabel>
            <FormTextarea value={form.metaDescription} onChange={(v) => setForm({ ...form, metaDescription: v })} placeholder="وصف مختصر لمتجرك" rows={3} />
          </div>

          <div>
            <FormLabel>Google Analytics ID</FormLabel>
            <FormInput value={form.googleAnalyticsId} onChange={(v) => setForm({ ...form, googleAnalyticsId: v })} placeholder="G-XXXXXXXXXX" dir="ltr" />
          </div>

          <div>
            <FormLabel>Facebook Pixel ID</FormLabel>
            <FormInput value={form.facebookPixelId} onChange={(v) => setForm({ ...form, facebookPixelId: v })} placeholder="123456789" dir="ltr" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Banners Tab
// ═══════════════════════════════════════════════════════

function BannersTab() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState<any>(null);
  const [form, setForm] = useState({
    id: null as number | null,
    title: '',
    imageUrl: '',
    link: '',
    sortOrder: 0,
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['online-store-banners'],
    queryFn: () => onlineStoreApi.getBanners(),
  });

  const saveMutation = useMutation({
    mutationFn: () => onlineStoreApi.saveBanner(form),
    onSuccess: () => {
      toast.success(form.id ? 'تم تحديث البنر' : 'تم إضافة البنر');
      queryClient.invalidateQueries({ queryKey: ['online-store-banners'] });
      closeModal();
    },
    onError: () => toast.error('فشل حفظ البنر'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => onlineStoreApi.deleteBanner(id),
    onSuccess: () => {
      toast.success('تم حذف البنر');
      queryClient.invalidateQueries({ queryKey: ['online-store-banners'] });
    },
    onError: () => toast.error('فشل حذف البنر'),
  });

  function openAdd() {
    setForm({ id: null, title: '', imageUrl: '', link: '', sortOrder: 0, startDate: '', endDate: '', isActive: true });
    setShowModal(true);
  }

  function openEdit(banner: any) {
    setForm({
      id: banner.id,
      title: banner.title ?? '',
      imageUrl: banner.imageUrl ?? '',
      link: banner.link ?? '',
      sortOrder: banner.sortOrder ?? 0,
      startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
      isActive: banner.isActive ?? true,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditBanner(null);
  }

  const banners = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle>البنرات</SectionTitle>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition"
        >
          <Plus size={16} /> إضافة بنر
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      ) : banners.length === 0 ? (
        <div className="card p-10 text-center text-gray-500 dark:text-gray-400">
          <Image size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد بنرات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((b: any) => (
            <div key={b.id} className="card overflow-hidden group">
              {b.imageUrl ? (
                <div className="h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="h-40 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Image size={32} className="text-gray-300 dark:text-gray-600" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{b.title || 'بدون عنوان'}</h4>
                  <Badge variant={b.isActive ? 'success' : 'default'}>{b.isActive ? 'نشط' : 'معطل'}</Badge>
                </div>
                {b.link && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2" dir="ltr">{b.link}</p>}
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-3">
                  <span>ترتيب: {b.sortOrder}</span>
                  {b.startDate && <span>من: {formatDate(b.startDate)}</span>}
                  {b.endDate && <span>إلى: {formatDate(b.endDate)}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(b)} className="flex-1 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900 transition">
                    <Edit3 size={12} className="inline ml-1" /> تعديل
                  </button>
                  <button
                    onClick={() => { if (confirm('هل تريد حذف هذا البنر؟')) deleteMutation.mutate(b.id); }}
                    className="flex-1 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition"
                  >
                    <Trash2 size={12} className="inline ml-1" /> حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={closeModal} title={form.id ? 'تعديل بنر' : 'إضافة بنر'} size="lg">
        <div className="space-y-4">
          <div>
            <FormLabel>العنوان</FormLabel>
            <FormInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="عنوان البنر" />
          </div>
          <div>
            <FormLabel>رابط الصورة</FormLabel>
            <FormInput value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} placeholder="https://..." dir="ltr" />
          </div>
          <div>
            <FormLabel>الرابط (عند النقر)</FormLabel>
            <FormInput value={form.link} onChange={(v) => setForm({ ...form, link: v })} placeholder="https://..." dir="ltr" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FormLabel>الترتيب</FormLabel>
              <FormInput value={String(form.sortOrder)} onChange={(v) => setForm({ ...form, sortOrder: parseInt(v) || 0 })} type="number" />
            </div>
            <div>
              <FormLabel>تاريخ البداية</FormLabel>
              <FormInput value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} type="date" dir="ltr" />
            </div>
            <div>
              <FormLabel>تاريخ النهاية</FormLabel>
              <FormInput value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} type="date" dir="ltr" />
            </div>
          </div>
          <Toggle value={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="نشط" />
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {form.id ? 'تحديث' : 'إضافة'}
            </button>
            <button onClick={closeModal} className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Payment Settings Tab
// ═══════════════════════════════════════════════════════

const PAYMENT_PROVIDERS = [
  { key: 'stripe', label: 'Stripe', icon: '💳' },
  { key: 'paytabs', label: 'PayTabs', icon: '💰' },
  { key: 'tap', label: 'Tap', icon: '📱' },
  { key: 'moyasar', label: 'Moyasar', icon: '🏦' },
  { key: 'fawry', label: 'Fawry', icon: '🔵' },
];

function PaymentSettingsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['online-store-payment-configs'],
    queryFn: () => onlineStoreApi.getPaymentConfigs(),
  });

  const [configs, setConfigs] = useState<Record<string, { apiKey: string; secretKey: string; isTestMode: boolean; isEnabled: boolean }>>({});

  useEffect(() => {
    if (data?.data) {
      const map: typeof configs = {};
      for (const c of data.data) {
        map[c.provider] = {
          apiKey: c.apiKey ?? '',
          secretKey: c.secretKey ?? '',
          isTestMode: c.isTestMode ?? true,
          isEnabled: c.isEnabled ?? false,
        };
      }
      setConfigs(map);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: any) => onlineStoreApi.savePaymentConfig(payload),
    onSuccess: () => {
      toast.success('تم حفظ إعدادات الدفع');
      queryClient.invalidateQueries({ queryKey: ['online-store-payment-configs'] });
    },
    onError: () => toast.error('فشل الحفظ'),
  });

  function updateConfig(provider: string, field: string, value: any) {
    setConfigs((prev) => ({
      ...prev,
      [provider]: { ...(prev[provider] ?? { apiKey: '', secretKey: '', isTestMode: true, isEnabled: false }), [field]: value },
    }));
  }

  function saveConfig(provider: string) {
    const cfg = configs[provider];
    if (!cfg) return;
    saveMutation.mutate({ provider, ...cfg });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle>إعدادات الدفع</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PAYMENT_PROVIDERS.map((p) => {
          const cfg = configs[p.key] ?? { apiKey: '', secretKey: '', isTestMode: true, isEnabled: false };
          return (
            <div key={p.key} className={cn('card p-5 space-y-4 border-2 transition', cfg.isEnabled ? 'border-brand-300 dark:border-brand-700' : 'border-transparent')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">{p.label}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {cfg.isEnabled ? 'مفعّل' : 'معطّل'} {cfg.isTestMode ? '(وضع تجريبي)' : '(وضع حقيقي)'}
                    </p>
                  </div>
                </div>
                <Toggle value={cfg.isEnabled} onChange={(v) => updateConfig(p.key, 'isEnabled', v)} />
              </div>

              <div>
                <FormLabel>API Key</FormLabel>
                <FormInput value={cfg.apiKey} onChange={(v) => updateConfig(p.key, 'apiKey', v)} placeholder="pk_..." dir="ltr" />
              </div>

              <div>
                <FormLabel>Secret Key</FormLabel>
                <FormInput value={cfg.secretKey} onChange={(v) => updateConfig(p.key, 'secretKey', v)} placeholder="sk_..." dir="ltr" type="password" />
              </div>

              <div className="flex items-center justify-between">
                <Toggle value={cfg.isTestMode} onChange={(v) => updateConfig(p.key, 'isTestMode', v)} label="وضع تجريبي" />
                <button
                  onClick={() => saveConfig(p.key)}
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  حفظ
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Shipping Settings Tab
// ═══════════════════════════════════════════════════════

function ShippingSettingsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['online-store-shipping-configs'],
    queryFn: () => onlineStoreApi.getShippingConfigs(),
  });

  const [form, setForm] = useState({
    flatRate: 0,
    freeShippingMinimum: 0,
    zones: [] as { name: string; rate: number }[],
  });

  useEffect(() => {
    if (data?.data) {
      const cfg = data.data[0] ?? {};
      setForm({
        flatRate: cfg.flatRate ?? 0,
        freeShippingMinimum: cfg.freeShippingMinimum ?? 0,
        zones: cfg.zones ?? [],
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => onlineStoreApi.saveShippingConfig(form),
    onSuccess: () => {
      toast.success('تم حفظ إعدادات الشحن');
      queryClient.invalidateQueries({ queryKey: ['online-store-shipping-configs'] });
    },
    onError: () => toast.error('فشل الحفظ'),
  });

  function addZone() {
    setForm({ ...form, zones: [...form.zones, { name: '', rate: 0 }] });
  }

  function updateZone(idx: number, field: string, value: any) {
    const zones = [...form.zones];
    zones[idx] = { ...zones[idx], [field]: value } as { name: string; rate: number };
    setForm({ ...form, zones });
  }

  function removeZone(idx: number) {
    setForm({ ...form, zones: form.zones.filter((_, i) => i !== idx) });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle>إعدادات الشحن</SectionTitle>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          حفظ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">سعر الشحن الثابت</h3>
          <div>
            <FormLabel>سعر الشحن</FormLabel>
            <FormInput value={String(form.flatRate)} onChange={(v) => setForm({ ...form, flatRate: parseFloat(v) || 0 })} type="number" />
          </div>
          <div>
            <FormLabel>حد الشحن المجاني (الحد الأدنى للطلب)</FormLabel>
            <FormInput value={String(form.freeShippingMinimum)} onChange={(v) => setForm({ ...form, freeShippingMinimum: parseFloat(v) || 0 })} type="number" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">اتركه 0 لتعطيل الشحن المجاني</p>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">مناطق الشحن</h3>
            <button onClick={addZone} className="text-sm text-brand-600 dark:text-brand-400 font-bold flex items-center gap-1 hover:underline">
              <Plus size={14} /> إضافة منطقة
            </button>
          </div>
          {form.zones.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">لا توجد مناطق شحن</p>
          ) : (
            <div className="space-y-3">
              {form.zones.map((z, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <div className="flex-1">
                    <FormInput value={z.name} onChange={(v) => updateZone(idx, 'name', v)} placeholder="اسم المنطقة" />
                  </div>
                  <div className="w-32">
                    <FormInput value={String(z.rate)} onChange={(v) => updateZone(idx, 'rate', parseFloat(v) || 0)} type="number" placeholder="السعر" />
                  </div>
                  <button onClick={() => removeZone(idx)} className="text-red-500 hover:text-red-700 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Orders Tab
// ═══════════════════════════════════════════════════════

const ORDER_STATUSES: Record<number, { label: string; variant: 'default' | 'warning' | 'info' | 'primary' | 'success' }> = {
  1: { label: 'معلق', variant: 'warning' },
  2: { label: 'مؤكد', variant: 'info' },
  3: { label: 'قيد التجهيز', variant: 'primary' },
  4: { label: 'تم الشحن', variant: 'info' },
  5: { label: 'تم التسليم', variant: 'success' },
  6: { label: 'ملغي', variant: 'default' },
};

const STATUS_FLOW = [
  { from: 1, to: 2, label: 'تأكيد', icon: CheckCircle },
  { from: 2, to: 3, label: 'تجهيز', icon: Package },
  { from: 3, to: 4, label: 'شحن', icon: TruckIcon },
  { from: 4, to: 5, label: 'تسليم', icon: CircleCheck },
];

function OrdersTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['online-store-orders', page, statusFilter, search],
    queryFn: () => onlineStoreApi.getOrders({ page, pageSize: 15, status: statusFilter, search: search || undefined }),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['online-store-order', selectedOrder?.id],
    queryFn: () => onlineStoreApi.getOrderById(selectedOrder!.id),
    enabled: !!selectedOrder?.id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => onlineStoreApi.updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success('تم تحديث حالة الطلب');
      queryClient.invalidateQueries({ queryKey: ['online-store-orders'] });
      queryClient.invalidateQueries({ queryKey: ['online-store-order'] });
      queryClient.invalidateQueries({ queryKey: ['online-store-pending-orders'] });
    },
    onError: () => toast.error('فشل تحديث الحالة'),
  });

  const orders = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const order = detailData?.data ?? selectedOrder;

  return (
    <div className="space-y-6">
      <SectionTitle>الطلبات</SectionTitle>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث بالرقم أو اسم العميل..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm
              focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => { setStatusFilter(undefined); setPage(1); }}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition', !statusFilter ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}
          >
            الكل
          </button>
          {Object.entries(ORDER_STATUSES).map(([k, v]) => (
            <button
              key={k}
              onClick={() => { setStatusFilter(Number(k)); setPage(1); }}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition', statusFilter === Number(k) ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center text-gray-500 dark:text-gray-400">
          <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد طلبات</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-400">#</th>
                  <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-400">العميل</th>
                  <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-400">المبلغ</th>
                  <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-400">الحالة</th>
                  <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-400">التاريخ</th>
                  <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-400">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => {
                  const status = ORDER_STATUSES[o.status] ?? { label: 'غير معروف', variant: 'default' as const };
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition cursor-pointer"
                      onClick={() => { setSelectedOrder(o); setShowDetail(true); }}
                    >
                      <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">#{o.id}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{o.customerName ?? 'عميل'}</td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">{formatCurrency(o.totalAmount ?? 0)}</td>
                      <td className="px-4 py-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{o.createdAt ? formatDateTime(o.createdAt) : '-'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); setShowDetail(true); }}
                          className="text-brand-600 dark:text-brand-400 font-bold text-xs hover:underline"
                        >
                          التفاصيل
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition"
              >
                <ChevronRight size={16} />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                صفحة {page} من {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal open={showDetail} onClose={() => setShowDetail(false)} title={`طلب #${order?.id ?? ''}`} size="xl">
        {detailLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-brand-500" size={24} />
          </div>
        ) : order ? (
          <div className="space-y-5">
            {/* Status + Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={ORDER_STATUSES[order.status]?.variant ?? 'default'}>
                {ORDER_STATUSES[order.status]?.label ?? 'غير معروف'}
              </Badge>
              <div className="flex-1" />
              {STATUS_FLOW.filter((s) => s.from === order.status).map((s) => (
                <button
                  key={s.to}
                  onClick={() => statusMutation.mutate({ id: order.id, status: s.to })}
                  disabled={statusMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition disabled:opacity-50"
                >
                  {statusMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <s.icon size={14} />}
                  {s.label}
                </button>
              ))}
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">معلومات العميل</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500 dark:text-gray-400">الاسم:</span> <span className="text-gray-900 dark:text-gray-100">{order.customerName ?? '-'}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">الهاتف:</span> <span className="text-gray-900 dark:text-gray-100" dir="ltr">{order.customerPhone ?? '-'}</span></div>
                <div className="col-span-2"><span className="text-gray-500 dark:text-gray-400">العنوان:</span> <span className="text-gray-900 dark:text-gray-100">{order.shippingAddress ?? '-'}</span></div>
              </div>
            </div>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">المنتجات</h4>
                <div className="space-y-2">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.productName ?? 'منتج'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">x{item.quantity}</p>
                      </div>
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{formatCurrency(item.total ?? (item.price * item.quantity))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1">
              {order.shippingCost != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">الشحن</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatCurrency(order.shippingCost)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-base font-bold">
                <span className="text-gray-900 dark:text-gray-100">الإجمالي</span>
                <span className="text-brand-600 dark:text-brand-400">{formatCurrency(order.totalAmount ?? 0)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Main Screen
// ═══════════════════════════════════════════════════════

export function StoreBuilderScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const { pendingCount } = useOnlineOrderNotification();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">المتجر الإلكتروني</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إدارة متجرك الإلكتروني والطلبات والإعدادات</p>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={() => setActiveTab('orders')}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition animate-pulse"
          >
            <ShoppingBag size={16} />
            {pendingCount} طلب معلق
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all',
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.key === 'orders' && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'settings' && <StoreSettingsTab />}
      {activeTab === 'banners' && <BannersTab />}
      {activeTab === 'payment' && <PaymentSettingsTab />}
      {activeTab === 'shipping' && <ShippingSettingsTab />}
      {activeTab === 'orders' && <OrdersTab />}
    </div>
  );
}
