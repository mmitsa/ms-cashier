import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  RefreshCw, CheckCircle2, ChevronDown, ChevronUp, AlertOctagon, X,
  ChevronRight, ChevronLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import {
  usePostingFailures, useRetryPostingFailure, useResolvePostingFailure,
} from '../api';
import {
  SOURCE_OPTIONS, sourceBadgeVariant, sourceLabels,
  type PostingFailure,
} from '../types';

type ResolvedFilter = 'all' | 'unresolved' | 'resolved';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ar-SA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export function PostingFailuresList() {
  const [resolvedFilter, setResolvedFilter] = useState<ResolvedFilter>('unresolved');
  const [source, setSource] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [expandedError, setExpandedError] = useState<number | null>(null);
  const [detailRow, setDetailRow] = useState<PostingFailure | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const filters = {
    resolved: resolvedFilter === 'all' ? undefined : resolvedFilter === 'resolved',
    source: source || undefined,
    page,
    pageSize,
  };

  const { data, isLoading, isFetching, dataUpdatedAt } = usePostingFailures(filters);
  const retry = useRetryPostingFailure();
  const resolve = useResolvePostingFailure();

  const items: PostingFailure[] = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const isFresh = dataUpdatedAt > 0 && Date.now() - dataUpdatedAt < 35_000;

  const handleRetry = async (id: number) => {
    try {
      await retry.mutateAsync(id);
      toast.success('تمت إعادة المحاولة بنجاح');
    } catch {
      toast.error('فشلت إعادة المحاولة');
    }
  };

  const handleResolve = async (id: number) => {
    if (!resolveNotes.trim()) {
      toast.error('يرجى إدخال ملاحظات الحل');
      return;
    }
    try {
      await resolve.mutateAsync({ id, notes: resolveNotes.trim() });
      toast.success('تم تسجيل الحل');
      setResolvingId(null);
      setResolveNotes('');
    } catch {
      toast.error('تعذر حفظ الحل');
    }
  };

  const chipClass = (active: boolean) => cn(
    'px-3 py-1.5 rounded-lg text-xs font-semibold transition',
    active
      ? 'bg-brand-600 text-white'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={chipClass(resolvedFilter === 'all')}
            onClick={() => { setResolvedFilter('all'); setPage(1); }}
          >
            الكل
          </button>
          <button
            className={chipClass(resolvedFilter === 'unresolved')}
            onClick={() => { setResolvedFilter('unresolved'); setPage(1); }}
          >
            غير محلول
          </button>
          <button
            className={chipClass(resolvedFilter === 'resolved')}
            onClick={() => { setResolvedFilter('resolved'); setPage(1); }}
          >
            محلول
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          <select
            value={source}
            onChange={(e) => { setSource(e.target.value); setPage(1); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0 focus:ring-2 focus:ring-brand-500"
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isFresh ? 'bg-emerald-500' : 'bg-gray-400',
              isFetching && 'animate-pulse'
            )}
          />
          <span>{isFresh ? 'مباشر' : 'غير محدث'}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-gray-400 text-sm">جارٍ التحميل...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-4">
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            لا توجد قيود فاشلة. كل شيء على ما يرام ✓
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            لم يتم تسجيل أي فشل ترحيل ضمن الفلاتر المحددة.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-xs">
              <tr>
                <th className="text-right px-4 py-3 font-semibold">التاريخ</th>
                <th className="text-right px-4 py-3 font-semibold">النوع</th>
                <th className="text-right px-4 py-3 font-semibold">العملية</th>
                <th className="text-right px-4 py-3 font-semibold">الخطأ</th>
                <th className="text-right px-4 py-3 font-semibold">المحاولات</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((f) => {
                const isExpanded = expandedError === f.id;
                const isResolving = resolvingId === f.id;
                const variant = sourceBadgeVariant[f.sourceType] ?? 'default';
                const label = sourceLabels[f.sourceType] ?? f.sourceType;
                return (
                  <tr
                    key={f.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td
                      className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer"
                      onClick={() => setDetailRow(f)}
                    >
                      {formatDate(f.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={variant}>{label} #{f.sourceId}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {f.operation}
                    </td>
                    <td className="px-4 py-3 text-red-700 dark:text-red-400 max-w-md">
                      <button
                        onClick={() => setExpandedError(isExpanded ? null : f.id)}
                        className="text-right w-full hover:underline font-mono text-xs flex items-start gap-1"
                      >
                        <span className="shrink-0 mt-0.5">
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </span>
                        <span className="flex-1">
                          {isExpanded ? f.errorMessage : truncate(f.errorMessage, 80)}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">
                      {f.retryCount}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={f.isResolved ? 'success' : 'danger'}>
                        {f.isResolved ? 'محلول' : 'غير محلول'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {f.isResolved ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : isResolving ? (
                        <div className="flex items-start gap-2">
                          <textarea
                            value={resolveNotes}
                            onChange={(e) => setResolveNotes(e.target.value)}
                            placeholder="ملاحظات الحل..."
                            rows={2}
                            className="flex-1 min-w-[180px] text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-500"
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              disabled={resolve.isPending}
                              onClick={() => handleResolve(f.id)}
                              className="px-2 py-1 text-[11px] rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                              تأكيد
                            </button>
                            <button
                              onClick={() => { setResolvingId(null); setResolveNotes(''); }}
                              className="px-2 py-1 text-[11px] rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRetry(f.id)}
                            disabled={retry.isPending}
                            title="إعادة المحاولة"
                            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900 transition disabled:opacity-50"
                          >
                            <RefreshCw size={12} className={retry.isPending ? 'animate-spin' : ''} />
                            إعادة المحاولة
                          </button>
                          <button
                            onClick={() => { setResolvingId(f.id); setResolveNotes(''); }}
                            title="حل يدوياً"
                            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
                          >
                            <CheckCircle2 size={12} />
                            حل يدوياً
                          </button>
                        </div>
                      )}
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
          <span>
            عرض {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} من {totalCount}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center"
            >
              <ChevronRight size={14} />
            </button>
            <span className="px-3 font-semibold">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Detail side panel */}
      {detailRow && (
        <DetailPanel failure={detailRow} onClose={() => setDetailRow(null)} />
      )}
    </div>
  );
}

// ─── DetailPanel ────────────────────────────────────

function DetailPanel({ failure, onClose }: { failure: PostingFailure; onClose: () => void }) {
  const [showStack, setShowStack] = useState(false);
  const label = sourceLabels[failure.sourceType] ?? failure.sourceType;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
      <aside
        dir="rtl"
        className="fixed top-0 left-0 h-full w-full max-w-xl z-50 bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <AlertOctagon size={18} className="text-red-500" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              تفاصيل الفشل #{failure.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="النوع" value={`${label} #${failure.sourceId}`} />
            <InfoRow label="العملية" value={failure.operation} />
            <InfoRow label="التاريخ" value={formatDate(failure.createdAt)} />
            <InfoRow label="عدد المحاولات" value={String(failure.retryCount)} />
            <InfoRow
              label="آخر محاولة"
              value={failure.lastRetryAt ? formatDate(failure.lastRetryAt) : '—'}
            />
            <InfoRow
              label="الحالة"
              value={failure.isResolved ? 'محلول' : 'غير محلول'}
            />
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              رسالة الخطأ
            </h4>
            <pre className="text-xs p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 whitespace-pre-wrap font-mono border border-red-100 dark:border-red-900">
              {failure.errorMessage}
            </pre>
          </div>

          {failure.stackTrace && (
            <div>
              <button
                onClick={() => setShowStack((s) => !s)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {showStack ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Stack Trace
              </button>
              {showStack && (
                <pre className="mt-2 text-[11px] p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto border border-gray-100 dark:border-gray-700">
                  {failure.stackTrace}
                </pre>
              )}
            </div>
          )}

          {failure.isResolved && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                ملاحظات الحل
              </h4>
              <div className="text-xs p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                {failure.resolutionNotes || '—'}
              </div>
              {failure.resolvedAt && (
                <p className="text-[11px] text-gray-500 mt-1">
                  تم الحل في {formatDate(failure.resolvedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{value}</div>
    </div>
  );
}
