import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Code, Key, Webhook, Plus, Trash2, Copy, Check, Eye, EyeOff,
  Send, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, Activity,
  Shield, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { publicApiManagementApi } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

// ─── Constants ──────────────────────────────────────

const API_SCOPES = [
  { value: 'products:read', label: 'قراءة المنتجات' },
  { value: 'products:write', label: 'تعديل المنتجات' },
  { value: 'orders:read', label: 'قراءة الطلبات' },
  { value: 'orders:write', label: 'تعديل الطلبات' },
  { value: 'inventory:read', label: 'قراءة المخزون' },
  { value: 'inventory:write', label: 'تعديل المخزون' },
  { value: 'customers:read', label: 'قراءة العملاء' },
  { value: 'customers:write', label: 'تعديل العملاء' },
  { value: 'reports:read', label: 'قراءة التقارير' },
];

const WEBHOOK_EVENTS = [
  { group: 'الطلبات', events: [
    { value: 'order.created', label: 'طلب جديد' },
    { value: 'order.updated', label: 'تحديث طلب' },
    { value: 'order.cancelled', label: 'إلغاء طلب' },
  ]},
  { group: 'الفواتير', events: [
    { value: 'invoice.created', label: 'فاتورة جديدة' },
    { value: 'invoice.refunded', label: 'استرداد فاتورة' },
  ]},
  { group: 'المنتجات', events: [
    { value: 'product.created', label: 'منتج جديد' },
    { value: 'product.updated', label: 'تحديث منتج' },
    { value: 'product.deleted', label: 'حذف منتج' },
  ]},
  { group: 'المخزون', events: [
    { value: 'inventory.low_stock', label: 'مخزون منخفض' },
    { value: 'inventory.updated', label: 'تحديث مخزون' },
  ]},
  { group: 'العملاء', events: [
    { value: 'customer.created', label: 'عميل جديد' },
    { value: 'customer.updated', label: 'تحديث عميل' },
  ]},
  { group: 'المتجر الإلكتروني', events: [
    { value: 'online_order.created', label: 'طلب إلكتروني جديد' },
    { value: 'online_order.paid', label: 'طلب إلكتروني مدفوع' },
  ]},
];

const ALL_EVENTS = WEBHOOK_EVENTS.flatMap(g => g.events);

// ─── Main Screen ────────────────────────────────────

export function ApiManagementScreen() {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks'>('keys');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Code size={28} className="text-brand-600" />
          إدارة API والتكاملات
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          إنشاء مفاتيح API والتحكم في اشتراكات Webhook للتكامل مع الأنظمة الخارجية
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('keys')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'keys'
              ? 'bg-white dark:bg-gray-700 text-brand-700 dark:text-brand-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Key size={16} />
          مفاتيح API
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'webhooks'
              ? 'bg-white dark:bg-gray-700 text-brand-700 dark:text-brand-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Webhook size={16} />
          Webhooks
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'keys' ? <ApiKeysTab /> : <WebhooksTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// API Keys Tab
// ═══════════════════════════════════════════════════════

function ApiKeysTab() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: keysRes, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => publicApiManagementApi.getKeys(),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: number) => publicApiManagementApi.revokeKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('تم إلغاء المفتاح');
    },
    onError: () => toast.error('فشل إلغاء المفتاح'),
  });

  const keys = keysRes?.data ?? [];

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 bg-gradient-to-l from-brand-50 to-white dark:from-brand-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي المفاتيح</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{keys.length}</p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">مفاتيح نشطة</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{keys.filter((k: any) => k.isActive).length}</p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الطلبات</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {keys.reduce((sum: number, k: any) => sum + (k.requestCount || 0), 0).toLocaleString('ar-SA')}
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {keys.length > 0 ? `${keys.length} مفتاح` : 'لا توجد مفاتيح API بعد'}
        </p>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> إنشاء مفتاح جديد
        </button>
      </div>

      {/* Created key banner */}
      {createdKey && (
        <div className="card p-4 bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                تم إنشاء المفتاح بنجاح! احفظه الآن — لن يظهر مرة أخرى.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg text-xs font-mono text-gray-900 dark:text-gray-100 border border-emerald-200 dark:border-emerald-800 break-all select-all">
                  {createdKey}
                </code>
                <button
                  onClick={() => copyKey(createdKey)}
                  className="shrink-0 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'تم النسخ' : 'نسخ'}
                </button>
              </div>
            </div>
            <button onClick={() => setCreatedKey(null)} className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Keys table */}
      {isLoading ? (
        <div className="card p-8 flex items-center justify-center">
          <RefreshCw size={20} className="animate-spin text-gray-400" />
        </div>
      ) : keys.length === 0 ? (
        <div className="card p-12 text-center">
          <Key size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد مفاتيح API. أنشئ مفتاحك الأول للبدء.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">الاسم</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">المعرّف</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">الصلاحيات</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">تاريخ الإنشاء</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">آخر استخدام</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">الطلبات</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">الحالة</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400"></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key: any) => {
                  const scopes: string[] = key.scopes ? (typeof key.scopes === 'string' ? JSON.parse(key.scopes) : key.scopes) : [];
                  const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();
                  return (
                    <tr key={key.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{key.name}</td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">
                          {key.keyPrefix}...
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {scopes.length === 0 ? (
                            <Badge variant="default">كل الصلاحيات</Badge>
                          ) : scopes.slice(0, 3).map((s: string) => (
                            <Badge key={s} variant="info">{s}</Badge>
                          ))}
                          {scopes.length > 3 && <Badge variant="default">+{scopes.length - 3}</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(key.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString('ar-SA') : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300 text-xs">
                        {(key.requestCount || 0).toLocaleString('ar-SA')}
                      </td>
                      <td className="px-4 py-3">
                        {!key.isActive ? (
                          <Badge variant="danger">ملغي</Badge>
                        ) : isExpired ? (
                          <Badge variant="warning">منتهي</Badge>
                        ) : (
                          <Badge variant="success">نشط</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {key.isActive && (
                          <button
                            onClick={() => {
                              if (confirm('هل أنت متأكد من إلغاء هذا المفتاح؟')) {
                                revokeMutation.mutate(key.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium"
                          >
                            إلغاء
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      <CreateKeyModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(key) => {
          setCreatedKey(key);
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ['api-keys'] });
        }}
      />
    </>
  );
}

// ─── Create Key Modal ───────────────────────────────

function CreateKeyModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (key: string) => void }) {
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  const createMutation = useMutation({
    mutationFn: () => publicApiManagementApi.createKey({
      name,
      scopes: selectedScopes.length > 0 ? selectedScopes : undefined,
      expiresAt: hasExpiry && expiresAt ? new Date(expiresAt).toISOString() : undefined,
    }),
    onSuccess: (res) => {
      if (res.data?.key) {
        onCreated(res.data.key);
        setName('');
        setSelectedScopes([]);
        setHasExpiry(false);
        setExpiresAt('');
      }
    },
    onError: () => toast.error('فشل إنشاء المفتاح'),
  });

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="إنشاء مفتاح API جديد" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المفتاح</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: تكامل المتجر الإلكتروني"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الصلاحيات</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">اترك الكل بدون تحديد للسماح بكل الصلاحيات</p>
          <div className="grid grid-cols-2 gap-2">
            {API_SCOPES.map(scope => (
              <label key={scope.value} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedScopes.includes(scope.value)}
                  onChange={() => toggleScope(scope.value)}
                  className="rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{scope.label}</span>
                <code className="text-[10px] text-gray-400 font-mono mr-auto">{scope.value}</code>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasExpiry}
              onChange={e => setHasExpiry(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">تحديد تاريخ انتهاء</span>
          </label>
          {hasExpiry && (
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="mt-2 w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
            />
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {createMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
            إنشاء المفتاح
          </button>
          <button onClick={onClose} className="btn-secondary text-sm">إلغاء</button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// Webhooks Tab
// ═══════════════════════════════════════════════════════

function WebhooksTab() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any | null>(null);
  const [viewDeliveries, setViewDeliveries] = useState<number | null>(null);

  const { data: webhooksRes, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => publicApiManagementApi.getWebhooks(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => publicApiManagementApi.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('تم حذف الاشتراك');
    },
    onError: () => toast.error('فشل حذف الاشتراك'),
  });

  const testMutation = useMutation({
    mutationFn: (id: number) => publicApiManagementApi.testWebhook(id),
    onSuccess: (res) => {
      if (res.data?.success) {
        toast.success(`تم الاختبار بنجاح (${res.data.statusCode})`);
      } else {
        toast.error(`فشل الاختبار: ${res.data?.statusCode || 'خطأ'}`);
      }
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: () => toast.error('فشل اختبار Webhook'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      publicApiManagementApi.updateWebhook(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('تم تحديث الحالة');
    },
  });

  const webhooks = webhooksRes?.data ?? [];

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 bg-gradient-to-l from-brand-50 to-white dark:from-brand-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الاشتراكات</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{webhooks.length}</p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">نشطة</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{webhooks.filter((w: any) => w.isActive).length}</p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-red-50 to-white dark:from-red-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">بها أخطاء</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{webhooks.filter((w: any) => w.failureCount > 0).length}</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {webhooks.length > 0 ? `${webhooks.length} اشتراك` : 'لا توجد اشتراكات Webhook بعد'}
        </p>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> إضافة Webhook
        </button>
      </div>

      {/* Webhooks list */}
      {isLoading ? (
        <div className="card p-8 flex items-center justify-center">
          <RefreshCw size={20} className="animate-spin text-gray-400" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="card p-12 text-center">
          <Webhook size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد اشتراكات Webhook. أضف اشتراكك الأول للبدء.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook: any) => {
            const events: string[] = webhook.events ? (typeof webhook.events === 'string' ? JSON.parse(webhook.events) : webhook.events) : [];
            return (
              <div key={webhook.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={webhook.isActive ? 'success' : 'danger'}>
                        {webhook.isActive ? 'نشط' : 'معطّل'}
                      </Badge>
                      {webhook.failureCount > 0 && (
                        <Badge variant="warning">
                          {webhook.failureCount} خطأ من {webhook.maxFailures}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">{webhook.url}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {events.slice(0, 5).map((e: string) => (
                        <span key={e} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-mono">
                          {e}
                        </span>
                      ))}
                      {events.length > 5 && (
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                          +{events.length - 5}
                        </span>
                      )}
                    </div>
                    {webhook.lastDeliveredAt && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                        <Clock size={10} /> آخر إرسال: {new Date(webhook.lastDeliveredAt).toLocaleString('ar-SA')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => testMutation.mutate(webhook.id)}
                      disabled={testMutation.isPending}
                      title="اختبار"
                      className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <Send size={14} />
                    </button>
                    <button
                      onClick={() => setViewDeliveries(webhook.id)}
                      title="سجل الإرسال"
                      className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <Activity size={14} />
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate({ id: webhook.id, isActive: !webhook.isActive })}
                      title={webhook.isActive ? 'تعطيل' : 'تفعيل'}
                      className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      {webhook.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) {
                          deleteMutation.mutate(webhook.id);
                        }
                      }}
                      title="حذف"
                      className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Secret display */}
                <SecretDisplay secret={webhook.secret} />
              </div>
            );
          })}
        </div>
      )}

      {/* Create Webhook Modal */}
      <WebhookFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={() => {
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        }}
      />

      {/* Deliveries Modal */}
      {viewDeliveries !== null && (
        <DeliveriesModal
          subscriptionId={viewDeliveries}
          onClose={() => setViewDeliveries(null)}
        />
      )}
    </>
  );
}

// ─── Secret Display ─────────────────────────────────

function SecretDisplay({ secret }: { secret: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      <span className="text-gray-400 dark:text-gray-500">Secret:</span>
      <code className="font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded">
        {show ? secret : '••••••••••••••••'}
      </code>
      <button onClick={() => setShow(!show)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      <button onClick={copy} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}

// ─── Webhook Form Modal ─────────────────────────────

function WebhookFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: () => publicApiManagementApi.createWebhook({ url, events: selectedEvents }),
    onSuccess: () => {
      toast.success('تم إنشاء Webhook بنجاح');
      setUrl('');
      setSelectedEvents([]);
      onSaved();
    },
    onError: () => toast.error('فشل إنشاء Webhook'),
  });

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const toggleGroup = (events: string[]) => {
    const allSelected = events.every(e => selectedEvents.includes(e));
    if (allSelected) {
      setSelectedEvents(prev => prev.filter(e => !events.includes(e)));
    } else {
      setSelectedEvents(prev => [...new Set([...prev, ...events])]);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="إضافة اشتراك Webhook" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان URL</label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            dir="ltr"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الأحداث</label>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {WEBHOOK_EVENTS.map(group => {
              const groupEventValues = group.events.map(e => e.value);
              const allSelected = groupEventValues.every(e => selectedEvents.includes(e));
              return (
                <div key={group.group}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupEventValues)}
                    className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      readOnly
                      className="rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500"
                    />
                    {group.group}
                  </button>
                  <div className="grid grid-cols-2 gap-1 mr-5">
                    {group.events.map(event => (
                      <label key={event.value} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event.value)}
                          onChange={() => toggleEvent(event.value)}
                          className="rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{event.label}</span>
                        <code className="text-[9px] text-gray-400 font-mono mr-auto">{event.value}</code>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => createMutation.mutate()}
            disabled={!url.trim() || selectedEvents.length === 0 || createMutation.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {createMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Webhook size={14} />}
            إنشاء Webhook
          </button>
          <button onClick={onClose} className="btn-secondary text-sm">إلغاء</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Deliveries Modal ───────────────────────────────

function DeliveriesModal({ subscriptionId, onClose }: { subscriptionId: number; onClose: () => void }) {
  const [page, setPage] = useState(1);

  const { data: deliveriesRes, isLoading } = useQuery({
    queryKey: ['webhook-deliveries', subscriptionId, page],
    queryFn: () => publicApiManagementApi.getDeliveries(subscriptionId, page, 15),
  });

  const deliveries = deliveriesRes?.data?.items ?? [];
  const totalCount = deliveriesRes?.data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / 15);

  return (
    <Modal open={true} onClose={onClose} title="سجل إرسال Webhook" size="xl">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <RefreshCw size={20} className="animate-spin text-gray-400" />
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-8">
          <Activity size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">لا يوجد سجل إرسال بعد</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">الحدث</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">الحالة</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">الكود</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">المدة</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d: any) => (
                  <tr key={d.id} className="border-b border-gray-50 dark:border-gray-800/50">
                    <td className="px-4 py-2">
                      <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
                        {d.event}
                      </code>
                    </td>
                    <td className="px-4 py-2">
                      {d.success ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs">
                          <CheckCircle size={12} /> نجح
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
                          <XCircle size={12} /> فشل
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs font-mono text-gray-600 dark:text-gray-400">{d.statusCode || '—'}</td>
                    <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">{d.durationMs}ms</td>
                    <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(d.createdAt).toLocaleString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">{totalCount} إرسال</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50"
                >
                  السابق
                </button>
                <span className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
