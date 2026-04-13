import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, X,
  Store, Phone, Mail, MapPin, User, CreditCard, MessageSquare,
  ChevronLeft, ChevronRight, Filter, Eye, ThumbsUp, ThumbsDown, Copy,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────

interface SubscriptionRequestDto {
  id: number;
  storeName: string;
  businessType?: string;
  ownerName: string;
  phone: string;
  email?: string;
  address?: string;
  city: string;
  vatNumber: string;
  planId: number;
  planName?: string;
  adminUsername: string;
  adminFullName: string;
  notes?: string;
  status: number;
  adminNotes?: string;
  approvedTenantId?: string;
  createdAt: string;
  reviewedAt?: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// ─── API ─────────────────────────────────────────────────

const subsApi = {
  getAll: (page: number, pageSize: number, status?: number) =>
    apiClient.get<{ data: PagedResult<SubscriptionRequestDto> }>('/subscriptions/requests', { params: { page, pageSize, status } }),
  review: (id: number, data: { approved: boolean; adminNotes?: string }) =>
    apiClient.post<{ success: boolean; data: SubscriptionRequestDto; message: string }>(`/subscriptions/requests/${id}/review`, data),
};

// ─── Constants ───────────────────────────────────────────

const STATUS_FALLBACK = { label: 'غير معروف', variant: 'default' as const, icon: Clock };
const STATUS_MAP: Record<number, { label: string; variant: 'default' | 'success' | 'danger'; icon: typeof Clock }> = {
  1: { label: 'في الانتظار', variant: 'default', icon: Clock },
  2: { label: 'مقبول', variant: 'success', icon: CheckCircle2 },
  3: { label: 'مرفوض', variant: 'danger', icon: XCircle },
};

// ─── Main Component ──────────────────────────────────────

export function SubscriptionRequestsScreen() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequestDto | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const pageSize = 20;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['subscription-requests', page, pageSize, statusFilter],
    queryFn: () => subsApi.getAll(page, pageSize, statusFilter),
    select: (res) => res.data.data,
  });

  const requests = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const pendingCount = requests.filter(r => r.status === 1).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">طلبات الاشتراك</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة ومراجعة طلبات الاشتراك الجديدة</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm font-medium">
            <Clock size={16} />
            {pendingCount} طلب بانتظار المراجعة
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter ?? ''}
            onChange={(e) => { setStatusFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none text-sm bg-white dark:bg-gray-900 dark:text-gray-100 min-w-[160px]"
          >
            <option value="">كل الطلبات</option>
            <option value={1}>في الانتظار</option>
            <option value={2}>مقبول</option>
            <option value={3}>مرفوض</option>
          </select>
          <span className="text-sm text-gray-400">إجمالي: {totalCount} طلب</span>
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
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد طلبات اشتراك</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">#</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المتجر</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المالك</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الهاتف</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المدينة</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الباقة</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الحالة</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">التاريخ</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const status = STATUS_MAP[req.status] ?? STATUS_FALLBACK;
                    const StatusIcon = status.icon;
                    return (
                      <tr key={req.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-400">#{req.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                              {req.storeName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm block">{req.storeName}</span>
                              <span className="text-xs text-gray-400">{req.businessType}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{req.ownerName}</td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400" dir="ltr">{req.phone}</td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{req.city}</td>
                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{req.planName}</td>
                        <td className="py-3 px-4">
                          <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon size={12} />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">{formatDate(new Date(req.createdAt))}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                              title="عرض التفاصيل"
                            >
                              <Eye size={16} />
                            </button>
                            {req.status === 1 && (
                              <button
                                onClick={() => { setSelectedRequest(req); setShowReviewModal(true); }}
                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition"
                                title="مراجعة"
                              >
                                <FileText size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">صفحة {page} من {totalPages}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition">
                    <ChevronRight size={18} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition">
                    <ChevronLeft size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedRequest && !showReviewModal && (
        <DetailDrawer request={selectedRequest} onClose={() => setSelectedRequest(null)} onReview={() => setShowReviewModal(true)} />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          onClose={() => { setShowReviewModal(false); setSelectedRequest(null); }}
        />
      )}
    </div>
  );
}

// ─── Detail Drawer ───────────────────────────────────────

function DetailDrawer({ request: r, onClose, onReview }: { request: SubscriptionRequestDto; onClose: () => void; onReview: () => void }) {
  const status = STATUS_MAP[r.status] ?? STATUS_FALLBACK;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">تفاصيل الطلب #{r.id}</h2>
            <Badge variant={status.variant} className="mt-1">{status.label}</Badge>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <Info icon={Store} label="المتجر" value={r.storeName} />
            <Info icon={User} label="المالك" value={r.ownerName} />
            <Info icon={Phone} label="الهاتف" value={r.phone} />
            <Info icon={Mail} label="الإيميل" value={r.email || 'غير محدد'} />
            <Info icon={MapPin} label="المدينة" value={r.city} />
            <Info icon={CreditCard} label="الرقم الضريبي" value={r.vatNumber} />
            <Info icon={CreditCard} label="الباقة" value={r.planName || `باقة ${r.planId}`} />
            <Info icon={User} label="اسم المستخدم" value={r.adminUsername} />
          </div>
          {r.notes && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1"><MessageSquare size={12} className="inline ml-1" />ملاحظات العميل</p>
              <p className="text-gray-700 dark:text-gray-300">{r.notes}</p>
            </div>
          )}
          {r.adminNotes && (
            <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-3">
              <p className="text-xs text-blue-400 mb-1">ملاحظات المدير</p>
              <p className="text-blue-700">{r.adminNotes}</p>
            </div>
          )}
          <p className="text-xs text-gray-400">تاريخ الطلب: {new Date(r.createdAt).toLocaleString('ar-SA')}</p>
          {r.reviewedAt && <p className="text-xs text-gray-400">تاريخ المراجعة: {new Date(r.reviewedAt).toLocaleString('ar-SA')}</p>}

          {r.status === 1 && (
            <button onClick={onReview} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition mt-2">
              مراجعة الطلب
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><Icon size={12} />{label}</p>
      <p className="font-medium text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

// ─── Review Modal ────────────────────────────────────────

function ReviewModal({ request: r, onClose }: { request: SubscriptionRequestDto; onClose: () => void }) {
  const qc = useQueryClient();
  const [adminNotes, setAdminNotes] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  const approveMutation = useMutation({
    mutationFn: () => subsApi.review(r.id, { approved: true, adminNotes }),
    onSuccess: (res) => {
      const msg = res.data.message || '';
      // Extract temp password from message
      const pwMatch = msg.match(/كلمة المرور المؤقتة:\s*(.+)/);
      if (pwMatch && pwMatch[1]) {
        setTempPassword(pwMatch[1].trim());
      } else {
        toast.success('تم قبول الطلب وتفعيل المتجر!');
        qc.invalidateQueries({ queryKey: ['subscription-requests'] });
        onClose();
      }
      qc.invalidateQueries({ queryKey: ['subscription-requests'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.errors?.[0] || 'فشل قبول الطلب');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => subsApi.review(r.id, { approved: false, adminNotes }),
    onSuccess: () => {
      toast.success('تم رفض الطلب');
      qc.invalidateQueries({ queryKey: ['subscription-requests'] });
      onClose();
    },
    onError: () => toast.error('فشل رفض الطلب'),
  });

  const copyPassword = () => {
    navigator.clipboard.writeText(`اسم المستخدم: ${r.adminUsername}\nكلمة المرور: ${tempPassword}`);
    toast.success('تم نسخ بيانات الدخول');
  };

  if (tempPassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md" dir="rtl" onClick={e => e.stopPropagation()}>
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">تم تفعيل المتجر بنجاح!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">أرسل بيانات الدخول لصاحب المتجر:</p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-right space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">المتجر:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{r.storeName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">اسم المستخدم:</span>
                <span className="font-mono font-bold text-indigo-600" dir="ltr">{r.adminUsername}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">كلمة المرور:</span>
                <span className="font-mono font-bold text-red-600" dir="ltr">{tempPassword}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">الفترة التجريبية:</span>
                <span className="font-bold text-green-600">14 يوم</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={copyPassword} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                <Copy size={16} />
                نسخ بيانات الدخول
              </button>
              <button onClick={onClose} className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">مراجعة طلب #{r.id}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">المتجر:</span><span className="font-bold dark:text-gray-100">{r.storeName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">المالك:</span><span className="font-bold dark:text-gray-100">{r.ownerName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">الباقة:</span><span className="font-bold dark:text-gray-100">{r.planName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">اسم المستخدم:</span><span className="font-mono font-bold dark:text-gray-100" dir="ltr">{r.adminUsername}</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ملاحظات المدير (اختياري)</label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 focus:border-indigo-500 outline-none text-sm resize-none"
              placeholder="أي ملاحظات..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {approveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
              قبول وتفعيل
            </button>
            <button
              onClick={() => rejectMutation.mutate()}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {rejectMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ThumbsDown size={16} />}
              رفض
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
