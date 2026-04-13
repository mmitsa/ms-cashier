import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gift, Save, Users, Star, TrendingUp, Award, Loader2,
  ArrowDownCircle, ArrowUpCircle, Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { loyaltyApi } from '@/lib/api/endpoints';
import { formatCurrency } from '@/lib/utils/cn';

export function LoyaltySettingsScreen() {
  const queryClient = useQueryClient();

  // ── Data ──────────────────────────────────────────
  const { data: programRes, isLoading: loadingProgram } = useQuery({
    queryKey: ['loyalty-program'],
    queryFn: () => loyaltyApi.getProgram(),
  });

  const { data: dashboardRes, isLoading: loadingDashboard } = useQuery({
    queryKey: ['loyalty-dashboard'],
    queryFn: () => loyaltyApi.getDashboard(),
  });

  const program = programRes?.data;
  const dashboard = dashboardRes?.data;

  // ── Form State ────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    pointsPerCurrency: 1,
    redemptionValue: 0.01,
    minRedemptionPoints: 100,
    pointsExpireDays: 0,
    isActive: true,
  });

  useEffect(() => {
    if (program) {
      setForm({
        name: program.name ?? '',
        pointsPerCurrency: program.pointsPerCurrency ?? 1,
        redemptionValue: program.redemptionValue ?? 0.01,
        minRedemptionPoints: program.minRedemptionPoints ?? 100,
        pointsExpireDays: program.pointsExpireDays ?? 0,
        isActive: program.isActive ?? true,
      });
    }
  }, [program]);

  const saveMutation = useMutation({
    mutationFn: () => loyaltyApi.saveProgram(form),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم حفظ برنامج الولاء بنجاح');
        queryClient.invalidateQueries({ queryKey: ['loyalty-program'] });
        queryClient.invalidateQueries({ queryKey: ['loyalty-dashboard'] });
      } else {
        toast.error(res.errors?.[0] || 'حدث خطأ');
      }
    },
    onError: () => toast.error('حدث خطأ في الاتصال'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('يرجى إدخال اسم البرنامج'); return; }
    if (form.pointsPerCurrency <= 0) { toast.error('نقاط لكل وحدة عملة يجب أن تكون أكبر من 0'); return; }
    if (form.redemptionValue <= 0) { toast.error('قيمة الاستبدال يجب أن تكون أكبر من 0'); return; }
    saveMutation.mutate();
  };

  if (loadingProgram) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Gift size={28} className="text-brand-600" />
            برنامج نقاط الولاء
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            إعداد وإدارة برنامج مكافآت العملاء بالنقاط
          </p>
        </div>
        {program && (
          <Badge variant={program.isActive ? 'success' : 'warning'}>
            {program.isActive ? 'مفعّل' : 'معطّل'}
          </Badge>
        )}
      </div>

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={Users} label="إجمالي الأعضاء" value={dashboard.totalMembers} color="bg-brand-600" />
          <StatCard icon={Star} label="أعضاء نشطون" value={dashboard.activeMembers} color="bg-emerald-600" />
          <StatCard icon={ArrowUpCircle} label="نقاط مُكتسبة" value={dashboard.totalPointsIssued?.toLocaleString('ar-SA')} color="bg-blue-600" />
          <StatCard icon={ArrowDownCircle} label="نقاط مُستبدلة" value={dashboard.totalPointsRedeemed?.toLocaleString('ar-SA')} color="bg-purple-600" />
          <StatCard icon={Award} label="نقاط حالية" value={dashboard.totalPointsActive?.toLocaleString('ar-SA')} color="bg-amber-600" />
          <StatCard icon={TrendingUp} label="قيمة الاستبدال" value={formatCurrency(dashboard.totalRedemptionValue ?? 0)} color="bg-red-600" />
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 card p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">إعدادات البرنامج</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم البرنامج</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="برنامج مكافآت المتجر"
              className="input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نقاط لكل وحدة عملة</label>
              <input
                type="number"
                step="0.01"
                value={form.pointsPerCurrency}
                onChange={(e) => setForm({ ...form, pointsPerCurrency: parseFloat(e.target.value) || 0 })}
                className="input w-full"
              />
              <p className="text-xs text-gray-400 mt-1">مثال: 1 = نقطة لكل ريال</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">قيمة النقطة عند الاستبدال</label>
              <input
                type="number"
                step="0.001"
                value={form.redemptionValue}
                onChange={(e) => setForm({ ...form, redemptionValue: parseFloat(e.target.value) || 0 })}
                className="input w-full"
              />
              <p className="text-xs text-gray-400 mt-1">مثال: 0.01 = كل نقطة تساوي 0.01 ريال</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحد الأدنى للاستبدال (نقاط)</label>
              <input
                type="number"
                value={form.minRedemptionPoints}
                onChange={(e) => setForm({ ...form, minRedemptionPoints: parseInt(e.target.value) || 0 })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">صلاحية النقاط (أيام)</label>
              <input
                type="number"
                value={form.pointsExpireDays}
                onChange={(e) => setForm({ ...form, pointsExpireDays: parseInt(e.target.value) || 0 })}
                className="input w-full"
              />
              <p className="text-xs text-gray-400 mt-1">0 = لا تنتهي</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">البرنامج مفعّل</span>
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="btn-primary flex items-center gap-2 text-sm w-full justify-center"
          >
            {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ الإعدادات
          </button>
        </form>

        {/* Top Customers */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Crown size={18} className="text-amber-500" />
            أفضل العملاء
          </h2>

          {loadingDashboard ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : !dashboard?.topCustomers?.length ? (
            <p className="text-gray-400 text-sm text-center py-8">لا يوجد أعضاء بعد</p>
          ) : (
            <div className="space-y-3">
              {dashboard.topCustomers.map((c: any, i: number) => (
                <div key={c.contactId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                    i === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                    i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                    'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {c.contactName || `عميل #${c.contactId}`}
                    </p>
                    <p className="text-xs text-gray-400">إجمالي مكتسب: {c.totalEarnedPoints?.toLocaleString('ar-SA')}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{c.currentPoints?.toLocaleString('ar-SA')}</p>
                    <p className="text-[10px] text-gray-400">نقطة</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
