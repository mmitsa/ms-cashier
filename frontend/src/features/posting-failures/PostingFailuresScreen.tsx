import { AlertOctagon, CheckCircle2, TrendingUp } from 'lucide-react';
import { usePostingFailures } from './api';
import { PostingFailuresList } from './components/PostingFailuresList';

function StatCard({
  label, value, icon: Icon, tone,
}: {
  label: string;
  value: string;
  icon: typeof AlertOctagon;
  tone: 'red' | 'emerald' | 'brand';
}) {
  const toneClasses = {
    red: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
    brand: 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400',
  }[tone];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${toneClasses} flex items-center justify-center shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export function PostingFailuresScreen() {
  const { data: unresolvedData } = usePostingFailures({ resolved: false, page: 1, pageSize: 1 });
  const { data: resolvedData } = usePostingFailures({ resolved: true, page: 1, pageSize: 200 });

  const unresolvedCount = unresolvedData?.totalCount ?? 0;

  // Last 30 days resolved count
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const recentResolved = (resolvedData?.items ?? []).filter((f) => {
    const t = f.resolvedAt ? new Date(f.resolvedAt).getTime() : 0;
    return t > 0 && now - t <= THIRTY_DAYS;
  });
  const resolved30dCount = recentResolved.length;

  // Retry success rate: resolved items that had at least one retry / total resolved
  const retried = recentResolved.filter((f) => f.retryCount > 0);
  const retrySuccessRate = retried.length > 0
    ? Math.round((retried.length / Math.max(1, recentResolved.length)) * 100)
    : 0;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
          <AlertOctagon size={22} className="text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            القيود المحاسبية الفاشلة
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
            مراقبة وإعادة محاولة القيود التي فشل ترحيلها تلقائياً.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="غير محلول"
          value={String(unresolvedCount)}
          icon={AlertOctagon}
          tone="red"
        />
        <StatCard
          label="محلول (آخر 30 يوم)"
          value={String(resolved30dCount)}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="نسبة نجاح إعادة المحاولة"
          value={`${retrySuccessRate}%`}
          icon={TrendingUp}
          tone="brand"
        />
      </div>

      <PostingFailuresList />
    </div>
  );
}
