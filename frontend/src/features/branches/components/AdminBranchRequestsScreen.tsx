import { useState } from 'react';
import {
  Building2, CheckCircle, XCircle, Clock, CreditCard,
  ChevronLeft, ChevronRight, Eye, PlayCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  useAdminBranchRequests, useReviewBranchRequest, useAdminActivateBranch,
} from '@/hooks/useApi';

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  AwaitingPayment: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700',
  Activated: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  Pending: 'قيد المراجعة',
  AwaitingPayment: 'بانتظار الدفع',
  Paid: 'تم الدفع',
  Activated: 'مفعل',
  Rejected: 'مرفوض',
};

const dataModeLabels: Record<string, string> = {
  SharedCatalog: 'مشترك',
  IndependentCatalog: 'مستقل',
};

export function AdminBranchRequestsScreen() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [detailModal, setDetailModal] = useState<any>(null);

  const { data, isLoading } = useAdminBranchRequests(page, 15, statusFilter || undefined);
  const reviewMut = useReviewBranchRequest();
  const activateMut = useAdminActivateBranch();

  const pagedResult = data?.data;
  const requests = pagedResult?.items ?? [];
  const totalPages = pagedResult ? Math.ceil(pagedResult.totalCount / pagedResult.pageSize) : 1;

  const filters = [
    { value: '', label: 'الكل' },
    { value: 'Pending', label: 'قيد المراجعة' },
    { value: 'AwaitingPayment', label: 'بانتظار الدفع' },
    { value: 'Paid', label: 'تم الدفع' },
    { value: 'Activated', label: 'مفعل' },
    { value: 'Rejected', label: 'مرفوض' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">طلبات فتح الفروع</h1>
        <p className="text-gray-500 text-sm mt-1">مراجعة والموافقة على طلبات فتح فروع جديدة من المتاجر</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد طلبات</h3>
            <p className="text-sm text-gray-500">لم يتم تقديم أي طلبات لفتح فروع جديدة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">المتجر</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">اسم الفرع</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">المدينة</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">النمط</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">الرسوم</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">الحالة</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">التاريخ</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{r.tenantName ?? '—'}</td>
                    <td className="py-3 px-4">{r.branchName}</td>
                    <td className="py-3 px-4 text-gray-600">{r.city || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{dataModeLabels[r.dataMode] ?? r.dataMode}</td>
                    <td className="py-3 px-4 font-medium">{r.requestedFee?.toFixed(2)} ر.س</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[r.status] ?? 'bg-gray-100'}`}>
                        {statusLabels[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString('ar-SA')}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setDetailModal(r)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                          <Eye size={15} />
                        </button>
                        {r.status === 'Pending' && (
                          <button onClick={() => setReviewModal(r)} className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 hover:bg-brand-200">
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {r.status === 'Paid' && (
                          <button
                            onClick={() => activateMut.mutate(r.id)}
                            className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200"
                          >
                            <PlayCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-gray-500">الصفحة {page} من {totalPages} ({pagedResult?.totalCount ?? 0} طلب)</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="w-9 h-9 rounded-lg border flex items-center justify-center disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="w-9 h-9 rounded-lg border flex items-center justify-center disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          request={reviewModal}
          onClose={() => setReviewModal(null)}
          onReview={(approve, notes) => {
            reviewMut.mutate(
              { requestId: reviewModal.id, data: { approve, adminNotes: notes } },
              { onSuccess: () => setReviewModal(null) }
            );
          }}
          isPending={reviewMut.isPending}
        />
      )}

      {/* Detail Modal */}
      {detailModal && <DetailModal request={detailModal} onClose={() => setDetailModal(null)} />}
    </div>
  );
}

function ReviewModal({ request, onClose, onReview, isPending }: {
  request: any;
  onClose: () => void;
  onReview: (approve: boolean, notes: string) => void;
  isPending: boolean;
}) {
  const [notes, setNotes] = useState('');

  return (
    <Modal open={true} onClose={onClose} title="مراجعة طلب فتح فرع" size="lg">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <p><span className="text-gray-500">المتجر:</span> <strong>{request.tenantName}</strong></p>
            <p><span className="text-gray-500">اسم الفرع:</span> <strong>{request.branchName}</strong></p>
            <p><span className="text-gray-500">المدينة:</span> {request.city || '—'}</p>
            <p><span className="text-gray-500">الهاتف:</span> {request.phone || '—'}</p>
            <p><span className="text-gray-500">المدير:</span> {request.managerName || '—'}</p>
            <p><span className="text-gray-500">النمط:</span> {dataModeLabels[request.dataMode]}</p>
            <p><span className="text-gray-500">الرسوم:</span> <strong>{request.requestedFee?.toFixed(2)} ر.س / شهر</strong></p>
          </div>
          {request.notes && <p className="mt-2 text-gray-600">{request.notes}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات الأدمن</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border rounded-xl text-sm resize-none"
            placeholder="ملاحظات اختيارية للمتجر..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onReview(false, notes)}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
          >
            <XCircle size={16} /> رفض
          </button>
          <button
            onClick={() => onReview(true, notes)}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle size={16} /> {isPending ? 'جاري المراجعة...' : 'موافقة (ينتظر الدفع)'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DetailModal({ request, onClose }: { request: any; onClose: () => void }) {
  return (
    <Modal open={true} onClose={onClose} title="تفاصيل الطلب" size="lg">
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="رقم الطلب" value={`#${request.id}`} />
          <InfoRow label="المتجر" value={request.tenantName ?? '—'} />
          <InfoRow label="اسم الفرع" value={request.branchName} />
          <InfoRow label="المدينة" value={request.city || '—'} />
          <InfoRow label="العنوان" value={request.address || '—'} />
          <InfoRow label="الهاتف" value={request.phone || '—'} />
          <InfoRow label="المدير" value={request.managerName || '—'} />
          <InfoRow label="نمط البيانات" value={dataModeLabels[request.dataMode] ?? request.dataMode} />
          <InfoRow label="الرسوم الشهرية" value={`${request.requestedFee?.toFixed(2)} ر.س`} />
          <InfoRow label="الحالة" value={statusLabels[request.status] ?? request.status} />
          <InfoRow label="تاريخ الطلب" value={new Date(request.createdAt).toLocaleDateString('ar-SA')} />
          {request.reviewedAt && <InfoRow label="تاريخ المراجعة" value={new Date(request.reviewedAt).toLocaleDateString('ar-SA')} />}
          {request.paidAt && <InfoRow label="تاريخ الدفع" value={new Date(request.paidAt).toLocaleDateString('ar-SA')} />}
          {request.paymentReference && <InfoRow label="مرجع الدفع" value={request.paymentReference} />}
        </div>
        {request.notes && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">ملاحظات المتجر:</p>
            <p>{request.notes}</p>
          </div>
        )}
        {request.adminNotes && (
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs text-amber-600 mb-1">ملاحظات الأدمن:</p>
            <p className="text-amber-800">{request.adminNotes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}
