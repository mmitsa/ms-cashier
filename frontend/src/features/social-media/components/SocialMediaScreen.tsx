import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone, Plus, Trash2, Send, Clock, CheckCircle2, XCircle, AlertCircle,
  Facebook, Instagram, Twitter, MessageCircle, Music2, Ghost,
  Image, Hash, Calendar, ToggleLeft, ToggleRight, Pencil, Eye,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { socialMediaApi } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────

type Tab = 'accounts' | 'posts' | 'auto-rules';

type PlatformKey = 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'snapchat' | 'whatsapp';

const PLATFORMS: { key: PlatformKey; label: string; labelAr: string; icon: LucideIcon; color: string; bg: string; darkBg: string }[] = [
  { key: 'facebook', label: 'Facebook', labelAr: 'فيسبوك', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-950' },
  { key: 'instagram', label: 'Instagram', labelAr: 'انستقرام', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', darkBg: 'dark:bg-pink-950' },
  { key: 'twitter', label: 'Twitter', labelAr: 'تويتر', icon: Twitter, color: 'text-sky-500', bg: 'bg-sky-50', darkBg: 'dark:bg-sky-950' },
  { key: 'tiktok', label: 'TikTok', labelAr: 'تيك توك', icon: Music2, color: 'text-gray-900 dark:text-gray-100', bg: 'bg-gray-100', darkBg: 'dark:bg-gray-800' },
  { key: 'snapchat', label: 'Snapchat', labelAr: 'سناب شات', icon: Ghost, color: 'text-yellow-500', bg: 'bg-yellow-50', darkBg: 'dark:bg-yellow-950' },
  { key: 'whatsapp', label: 'WhatsApp', labelAr: 'واتساب', icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50', darkBg: 'dark:bg-green-950' },
];

const TRIGGER_EVENTS = [
  { value: 'new_product', label: 'منتج جديد' },
  { value: 'new_offer', label: 'عرض جديد' },
  { value: 'price_change', label: 'تغيير سعر' },
];

const POST_TYPES = [
  { value: 1, label: 'منتج' },
  { value: 2, label: 'عرض' },
  { value: 3, label: 'مخصص' },
  { value: 4, label: 'تلقائي' },
];

function statusBadge(status: number) {
  switch (status) {
    case 1: return <Badge variant="default">مسودة</Badge>;
    case 2: return <Badge variant="info">مجدول</Badge>;
    case 3: return <Badge variant="success">منشور</Badge>;
    case 4: return <Badge variant="danger">فشل</Badge>;
    default: return <Badge variant="default">—</Badge>;
  }
}

function getPlatformInfo(key: string) {
  return PLATFORMS.find(p => p.key === key);
}

// ─── Main Screen ─────────────────────────────────────

export function SocialMediaScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('accounts');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'accounts', label: 'الحسابات' },
    { id: 'posts', label: 'المنشورات' },
    { id: 'auto-rules', label: 'النشر التلقائي' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Megaphone size={28} className="text-brand-600" />
            التواصل الاجتماعي
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">ربط حسابات التواصل ونشر المحتوى وجدولته تلقائياً</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'accounts' && <AccountsTab />}
      {activeTab === 'posts' && <PostsTab />}
      {activeTab === 'auto-rules' && <AutoRulesTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab 1: Accounts
// ═══════════════════════════════════════════════════════

function AccountsTab() {
  const qc = useQueryClient();
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['social-media', 'accounts'],
    queryFn: () => socialMediaApi.getAccounts(),
  });
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<any>(null);

  const saveMutation = useMutation({
    mutationFn: (data: any) => socialMediaApi.saveAccount(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['social-media', 'accounts'] }); setShowForm(false); setEditAccount(null); toast.success('تم حفظ الحساب'); },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => socialMediaApi.deleteAccount(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['social-media', 'accounts'] }); toast.success('تم حذف الحساب'); },
    onError: () => toast.error('حدث خطأ'),
  });

  const connectedAccounts = (accounts?.data ?? []) as any[];
  const connectedPlatforms = new Set(connectedAccounts.filter(a => a.isActive).map((a: any) => a.platform));

  return (
    <div className="space-y-4">
      {/* Platform Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map(platform => {
          const connected = connectedAccounts.filter(a => a.platform === platform.key);
          const isConnected = connected.length > 0 && connected.some(a => a.isActive);

          return (
            <div key={platform.key} className={`card p-5 ${platform.bg} ${platform.darkBg} border-0`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-gray-900 shadow-sm ${platform.color}`}>
                    <platform.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{platform.labelAr}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{platform.label}</p>
                  </div>
                </div>
                {isConnected ? (
                  <Badge variant="success">متصل</Badge>
                ) : (
                  <Badge variant="default">غير متصل</Badge>
                )}
              </div>

              {connected.length > 0 && (
                <div className="mt-3 space-y-2">
                  {connected.map((acct: any) => (
                    <div key={acct.id} className="flex items-center justify-between text-sm bg-white/60 dark:bg-gray-900/60 rounded-lg px-3 py-2">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{acct.accountName || acct.accountId || '—'}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditAccount(acct); setShowForm(true); }}
                          className="p-1 text-gray-400 hover:text-brand-600 transition"><Pencil size={14} /></button>
                        <button onClick={() => { if (confirm('حذف هذا الحساب؟')) deleteMutation.mutate(acct.id); }}
                          className="p-1 text-gray-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setEditAccount({ platform: platform.key }); setShowForm(true); }}
                className="mt-3 w-full py-2 text-sm font-medium rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition"
              >
                <Plus size={14} className="inline ml-1" />
                {isConnected ? 'إضافة حساب آخر' : 'ربط الحساب'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">حسابات متصلة</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{connectedAccounts.filter(a => a.isActive).length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">منصات مفعّلة</p>
          <p className="text-2xl font-bold text-brand-600">{connectedPlatforms.size}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي المنصات</p>
          <p className="text-2xl font-bold text-gray-400">{PLATFORMS.length}</p>
        </div>
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <AccountFormModal
          account={editAccount}
          onClose={() => { setShowForm(false); setEditAccount(null); }}
          onSave={(data) => saveMutation.mutate(data)}
          isSaving={saveMutation.isPending}
        />
      )}
    </div>
  );
}

function AccountFormModal({ account, onClose, onSave, isSaving }: {
  account: any;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    id: account?.id || null,
    platform: account?.platform || 'facebook',
    accountName: account?.accountName || '',
    accountId: account?.accountId || '',
    accessToken: '',
    refreshToken: '',
    pageId: account?.pageId || '',
  });

  const platformInfo = getPlatformInfo(form.platform);

  return (
    <Modal open onClose={onClose} title={account?.id ? 'تعديل الحساب' : 'ربط حساب جديد'}>
      <div className="space-y-4">
        {!account?.id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المنصة</label>
            <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm">
              {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.labelAr} ({p.label})</option>)}
            </select>
          </div>
        )}

        {account?.id && platformInfo && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <platformInfo.icon size={16} className={platformInfo.color} />
            <span>{platformInfo.labelAr}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الحساب</label>
          <input value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })}
            placeholder="مثال: صفحة المتجر الرسمية"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">معرّف الحساب (Account ID)</label>
          <input value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}
            placeholder="معرّف الحساب على المنصة"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Token</label>
          <input value={form.accessToken} onChange={e => setForm({ ...form, accessToken: e.target.value })}
            type="password" placeholder={account?.id ? 'اتركه فارغاً للإبقاء على القيمة الحالية' : 'أدخل التوكن'}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Page ID (اختياري)</label>
          <input value={form.pageId} onChange={e => setForm({ ...form, pageId: e.target.value })}
            placeholder="معرّف الصفحة (للفيسبوك)"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm" />
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={() => onSave(form)} disabled={isSaving || !form.accountName}
            className="btn-primary flex-1 text-sm">{isSaving ? 'جارٍ الحفظ...' : 'حفظ'}</button>
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">إلغاء</button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// Tab 2: Posts
// ═══════════════════════════════════════════════════════

function PostsTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showComposer, setShowComposer] = useState(false);

  const { data: accountsData } = useQuery({
    queryKey: ['social-media', 'accounts'],
    queryFn: () => socialMediaApi.getAccounts(),
  });

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['social-media', 'posts', page],
    queryFn: () => socialMediaApi.getPosts(page, 20),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => socialMediaApi.createPost(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['social-media', 'posts'] }); setShowComposer(false); toast.success('تم إنشاء المنشور'); },
    onError: () => toast.error('حدث خطأ'),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => socialMediaApi.publishPost(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['social-media', 'posts'] }); toast.success('تم النشر بنجاح'); },
    onError: () => toast.error('فشل النشر'),
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: number; scheduledAt: string }) => socialMediaApi.schedulePost(id, scheduledAt),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['social-media', 'posts'] }); toast.success('تم جدولة المنشور'); },
    onError: () => toast.error('حدث خطأ'),
  });

  const accounts = (accountsData?.data ?? []) as any[];
  const posts = (postsData?.data?.items ?? []) as any[];
  const totalCount = postsData?.data?.totalCount ?? 0;

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{totalCount} منشور</p>
        <button onClick={() => setShowComposer(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> إنشاء منشور
        </button>
      </div>

      {/* Posts table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs">
                <th className="text-right px-4 py-3 font-medium">المحتوى</th>
                <th className="text-right px-4 py-3 font-medium">النوع</th>
                <th className="text-right px-4 py-3 font-medium">المنصات</th>
                <th className="text-right px-4 py-3 font-medium">الحالة</th>
                <th className="text-right px-4 py-3 font-medium">التاريخ</th>
                <th className="text-right px-4 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">جارٍ التحميل...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">لا توجد منشورات بعد</td></tr>
              ) : posts.map((post: any) => (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3">
                    <p className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-xs">
                      {post.contentAr || post.content || '—'}
                    </p>
                    {post.hashtags && <p className="text-xs text-brand-500 mt-0.5">{post.hashtags}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600 dark:text-gray-400 text-xs">
                      {POST_TYPES.find(t => t.value === post.type)?.label ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(post.targets ?? []).map((t: any) => {
                        const p = getPlatformInfo(t.platform);
                        return p ? (
                          <span key={t.id} title={p.labelAr} className={`${p.color}`}>
                            <p.icon size={16} />
                          </span>
                        ) : null;
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">{statusBadge(post.status)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ar-SA') :
                     post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString('ar-SA') :
                     new Date(post.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {post.status === 1 && (
                        <>
                          <button onClick={() => publishMutation.mutate(post.id)} title="نشر الآن"
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950 transition">
                            <Send size={14} />
                          </button>
                          <ScheduleButton postId={post.id} onSchedule={(scheduledAt) => scheduleMutation.mutate({ id: post.id, scheduledAt })} />
                        </>
                      )}
                      {post.status === 2 && (
                        <button onClick={() => publishMutation.mutate(post.id)} title="نشر الآن"
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950 transition">
                          <Send size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > 20 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50">السابق</button>
            <span className="text-sm text-gray-500 dark:text-gray-400">صفحة {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={posts.length < 20}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50">التالي</button>
          </div>
        )}
      </div>

      {/* Composer Modal */}
      {showComposer && (
        <PostComposerModal
          accounts={accounts}
          onClose={() => setShowComposer(false)}
          onSave={(data) => createMutation.mutate(data)}
          isSaving={createMutation.isPending}
        />
      )}
    </div>
  );
}

function ScheduleButton({ postId, onSchedule }: { postId: number; onSchedule: (scheduledAt: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const [dateTime, setDateTime] = useState('');

  return (
    <>
      <button onClick={() => setShowPicker(true)} title="جدولة"
        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition">
        <Clock size={14} />
      </button>
      {showPicker && (
        <Modal open onClose={() => setShowPicker(false)} title="جدولة المنشور">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ ووقت النشر</label>
              <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { if (dateTime) { onSchedule(new Date(dateTime).toISOString()); setShowPicker(false); } }}
                disabled={!dateTime} className="btn-primary flex-1 text-sm">جدولة</button>
              <button onClick={() => setShowPicker(false)} className="btn-secondary flex-1 text-sm">إلغاء</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function PostComposerModal({ accounts, onClose, onSave, isSaving }: {
  accounts: any[];
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    content: '',
    contentAr: '',
    hashtags: '',
    type: 3,
    targetAccountIds: [] as number[],
    imageUrls: [] as string[],
    videoUrl: '',
  });

  const toggleAccount = (id: number) => {
    setForm(prev => ({
      ...prev,
      targetAccountIds: prev.targetAccountIds.includes(id)
        ? prev.targetAccountIds.filter(x => x !== id)
        : [...prev.targetAccountIds, id],
    }));
  };

  const activeAccounts = accounts.filter(a => a.isActive);

  return (
    <Modal open onClose={onClose} title="إنشاء منشور جديد" size="lg">
      <div className="space-y-4">
        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المحتوى بالعربية</label>
          <textarea value={form.contentAr} onChange={e => setForm({ ...form, contentAr: e.target.value })}
            rows={3} placeholder="اكتب محتوى المنشور بالعربية..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المحتوى بالإنجليزية (اختياري)</label>
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            rows={2} placeholder="English content (optional)..." dir="ltr"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm resize-none" />
        </div>

        {/* Hashtags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Hash size={14} className="inline ml-1" />هاشتاقات
          </label>
          <input value={form.hashtags} onChange={e => setForm({ ...form, hashtags: e.target.value })}
            placeholder="#متجر #عرض #خصم"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm" />
        </div>

        {/* Post Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع المنشور</label>
          <select value={form.type} onChange={e => setForm({ ...form, type: Number(e.target.value) })}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm">
            {POST_TYPES.filter(t => t.value !== 4).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Target Platforms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">المنصات المستهدفة</label>
          {activeAccounts.length === 0 ? (
            <p className="text-sm text-gray-400">لا توجد حسابات متصلة. اربط حساباً أولاً من تبويب "الحسابات".</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {activeAccounts.map((acct: any) => {
                const pInfo = getPlatformInfo(acct.platform);
                const selected = form.targetAccountIds.includes(acct.id);
                return (
                  <button key={acct.id} onClick={() => toggleAccount(acct.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                      selected
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}>
                    {pInfo && <pInfo.icon size={16} className={pInfo.color} />}
                    <span>{acct.accountName || pInfo?.labelAr || acct.platform}</span>
                    {selected && <CheckCircle2 size={14} className="text-brand-500 mr-auto" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSave(form)}
            disabled={isSaving || !form.contentAr || form.targetAccountIds.length === 0}
            className="btn-primary flex-1 text-sm"
          >
            {isSaving ? 'جارٍ الإنشاء...' : 'إنشاء المنشور'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">إلغاء</button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// Tab 3: Auto Post Rules
// ═══════════════════════════════════════════════════════

function AutoRulesTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editRule, setEditRule] = useState<any>(null);

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['social-media', 'auto-rules'],
    queryFn: () => socialMediaApi.getAutoRules(),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => socialMediaApi.saveAutoRule(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['social-media', 'auto-rules'] }); setShowForm(false); setEditRule(null); toast.success('تم حفظ القاعدة'); },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => socialMediaApi.deleteAutoRule(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['social-media', 'auto-rules'] }); toast.success('تم حذف القاعدة'); },
    onError: () => toast.error('حدث خطأ'),
  });

  const rules = (rulesData?.data ?? []) as any[];

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            أنشئ قواعد لنشر المحتوى تلقائياً عند إضافة منتجات أو عروض جديدة
          </p>
        </div>
        <button onClick={() => { setEditRule(null); setShowForm(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> إضافة قاعدة
        </button>
      </div>

      {/* Rules list */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">جارٍ التحميل...</div>
      ) : rules.length === 0 ? (
        <div className="card p-12 text-center">
          <Megaphone size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد قواعد نشر تلقائي</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">أضف قاعدة لنشر المحتوى تلقائياً على منصات التواصل</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule: any) => (
            <div key={rule.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={rule.isActive ? 'success' : 'default'}>
                      {rule.isActive ? 'مفعّل' : 'معطّل'}
                    </Badge>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {TRIGGER_EVENTS.find(e => e.value === rule.triggerEvent)?.label ?? rule.triggerEvent}
                    </span>
                  </div>

                  {/* Target Platforms */}
                  <div className="flex gap-1.5 mb-2">
                    {(rule.targetPlatforms ?? []).map((platform: string) => {
                      const pInfo = getPlatformInfo(platform);
                      return pInfo ? (
                        <span key={platform} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${pInfo.bg} ${pInfo.darkBg} ${pInfo.color}`}>
                          <pInfo.icon size={12} /> {pInfo.labelAr}
                        </span>
                      ) : null;
                    })}
                  </div>

                  {/* Template preview */}
                  {rule.contentTemplateAr && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mt-1">
                      {rule.contentTemplateAr}
                    </p>
                  )}

                  {/* Options */}
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    {rule.includeImage && <span className="flex items-center gap-1"><Image size={12} /> صورة</span>}
                    {rule.includePrice && <span className="flex items-center gap-1">💰 سعر</span>}
                    {rule.includeStoreLink && <span className="flex items-center gap-1">🔗 رابط</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditRule(rule); setShowForm(true); }}
                    className="p-1.5 text-gray-400 hover:text-brand-600 transition"><Pencil size={14} /></button>
                  <button onClick={() => { if (confirm('حذف هذه القاعدة؟')) deleteMutation.mutate(rule.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rule Form Modal */}
      {showForm && (
        <AutoRuleFormModal
          rule={editRule}
          onClose={() => { setShowForm(false); setEditRule(null); }}
          onSave={(data) => saveMutation.mutate(data)}
          isSaving={saveMutation.isPending}
        />
      )}
    </div>
  );
}

function AutoRuleFormModal({ rule, onClose, onSave, isSaving }: {
  rule: any;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    id: rule?.id || null,
    triggerEvent: rule?.triggerEvent || 'new_product',
    targetPlatforms: rule?.targetPlatforms || [],
    contentTemplate: rule?.contentTemplate || '',
    contentTemplateAr: rule?.contentTemplateAr || '',
    includeImage: rule?.includeImage ?? true,
    includePrice: rule?.includePrice ?? true,
    includeStoreLink: rule?.includeStoreLink ?? true,
    isActive: rule?.isActive ?? true,
  });

  const togglePlatform = (key: string) => {
    setForm(prev => ({
      ...prev,
      targetPlatforms: prev.targetPlatforms.includes(key)
        ? prev.targetPlatforms.filter((p: string) => p !== key)
        : [...prev.targetPlatforms, key],
    }));
  };

  return (
    <Modal open onClose={onClose} title={rule?.id ? 'تعديل القاعدة' : 'إضافة قاعدة نشر تلقائي'} size="lg">
      <div className="space-y-4">
        {/* Trigger Event */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحدث المُشغّل</label>
          <select value={form.triggerEvent} onChange={e => setForm({ ...form, triggerEvent: e.target.value })}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm">
            {TRIGGER_EVENTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>

        {/* Target Platforms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">المنصات المستهدفة</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => {
              const selected = form.targetPlatforms.includes(p.key);
              return (
                <button key={p.key} onClick={() => togglePlatform(p.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition ${
                    selected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                  <p.icon size={14} className={p.color} />
                  {p.labelAr}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Template */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">قالب المحتوى (عربي)</label>
          <textarea value={form.contentTemplateAr} onChange={e => setForm({ ...form, contentTemplateAr: e.target.value })}
            rows={3} placeholder="مثال: منتج جديد! {product_name} بسعر {price} فقط. تسوّق الآن: {store_link}"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm resize-none" />
          <p className="text-xs text-gray-400 mt-1">المتغيرات المتاحة: {'{product_name}'} {'{price}'} {'{store_link}'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">قالب المحتوى (إنجليزي - اختياري)</label>
          <textarea value={form.contentTemplate} onChange={e => setForm({ ...form, contentTemplate: e.target.value })}
            rows={2} placeholder="New product! {product_name} for only {price}. Shop now: {store_link}" dir="ltr"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm resize-none" />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">خيارات إضافية</label>
          {[
            { key: 'includeImage', label: 'إرفاق صورة المنتج' },
            { key: 'includePrice', label: 'إظهار السعر' },
            { key: 'includeStoreLink', label: 'إرفاق رابط المتجر' },
            { key: 'isActive', label: 'تفعيل القاعدة' },
          ].map(opt => (
            <button key={opt.key} onClick={() => setForm(prev => ({ ...prev, [opt.key]: !(prev as any)[opt.key] }))}
              className="flex items-center gap-3 w-full text-right">
              {(form as any)[opt.key] ? (
                <ToggleRight size={24} className="text-brand-500 shrink-0" />
              ) : (
                <ToggleLeft size={24} className="text-gray-300 dark:text-gray-600 shrink-0" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button onClick={() => onSave(form)}
            disabled={isSaving || !form.triggerEvent || form.targetPlatforms.length === 0}
            className="btn-primary flex-1 text-sm">{isSaving ? 'جارٍ الحفظ...' : 'حفظ'}</button>
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">إلغاء</button>
        </div>
      </div>
    </Modal>
  );
}
