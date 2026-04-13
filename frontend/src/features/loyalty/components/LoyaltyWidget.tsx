import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Star, ArrowDownCircle, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { loyaltyApi } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils/cn';

interface LoyaltyWidgetProps {
  contactId: number | null;
  contactName?: string;
  onDiscount?: (amount: number) => void;
}

export function LoyaltyWidget({ contactId, contactName, onDiscount }: LoyaltyWidgetProps) {
  const queryClient = useQueryClient();
  const [redeemAmount, setRedeemAmount] = useState('');
  const [showRedeem, setShowRedeem] = useState(false);

  const { data: programRes } = useQuery({
    queryKey: ['loyalty-program'],
    queryFn: () => loyaltyApi.getProgram(),
    staleTime: 60_000,
  });

  const { data: loyaltyRes, isLoading } = useQuery({
    queryKey: ['customer-loyalty', contactId],
    queryFn: () => loyaltyApi.getCustomerLoyalty(contactId!),
    enabled: !!contactId,
  });

  const program = programRes?.data;
  const loyalty = loyaltyRes?.success ? loyaltyRes.data : null;
  const notEnrolled = loyaltyRes && !loyaltyRes.success;

  const enrollMutation = useMutation({
    mutationFn: () => loyaltyApi.enrollCustomer(contactId!),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم تسجيل العميل في برنامج الولاء');
        queryClient.invalidateQueries({ queryKey: ['customer-loyalty', contactId] });
      } else {
        toast.error(res.errors?.[0] || 'حدث خطأ');
      }
    },
  });

  const redeemMutation = useMutation({
    mutationFn: (points: number) => loyaltyApi.redeemPoints(contactId!, points),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'تم الاستبدال بنجاح');
        queryClient.invalidateQueries({ queryKey: ['customer-loyalty', contactId] });
        onDiscount?.(res.data);
        setRedeemAmount('');
        setShowRedeem(false);
      } else {
        toast.error(res.errors?.[0] || 'حدث خطأ');
      }
    },
  });

  if (!contactId || !program || !program.isActive) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/30 p-3 flex items-center gap-2">
        <Loader2 size={14} className="animate-spin text-brand-500" />
        <span className="text-xs text-gray-500">تحميل نقاط الولاء...</span>
      </div>
    );
  }

  // Not enrolled — show enroll prompt
  if (notEnrolled) {
    return (
      <div className="rounded-xl border border-dashed border-brand-300 dark:border-brand-700 bg-brand-50/30 dark:bg-brand-950/20 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-brand-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {contactName || 'العميل'} غير مسجل في برنامج الولاء
            </span>
          </div>
          <button
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            {enrollMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'تسجيل'}
          </button>
        </div>
      </div>
    );
  }

  if (!loyalty) return null;

  const canRedeem = loyalty.currentPoints >= (program.minRedemptionPoints || 0);
  const redeemValue = program.redemptionValue || 0;

  return (
    <div className="rounded-xl border border-brand-200 dark:border-brand-800 bg-gradient-to-l from-brand-50 to-white dark:from-brand-950/50 dark:to-gray-900 p-3 space-y-2">
      {/* Points Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
            <Star size={14} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">نقاط الولاء</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {loyalty.currentPoints?.toLocaleString('ar-SA')}
              <span className="text-[10px] font-normal text-gray-400 mr-1">نقطة</span>
            </p>
          </div>
        </div>

        {canRedeem && !showRedeem && (
          <button
            onClick={() => setShowRedeem(true)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition',
              'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800'
            )}
          >
            <Sparkles size={12} />
            استبدال
          </button>
        )}

        {!canRedeem && (
          <span className="text-[10px] text-gray-400">
            الحد الأدنى: {program.minRedemptionPoints}
          </span>
        )}
      </div>

      {/* Redeem Input */}
      {showRedeem && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="number"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            placeholder={`عدد النقاط (حد أقصى ${loyalty.currentPoints})`}
            min={program.minRedemptionPoints}
            max={loyalty.currentPoints}
            className="input text-xs flex-1 py-1.5"
          />
          <button
            onClick={() => {
              const pts = parseInt(redeemAmount);
              if (!pts || pts <= 0) { toast.error('أدخل عدد نقاط صحيح'); return; }
              redeemMutation.mutate(pts);
            }}
            disabled={redeemMutation.isPending}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {redeemMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'تأكيد'}
          </button>
          <button
            onClick={() => { setShowRedeem(false); setRedeemAmount(''); }}
            className="px-2 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs transition"
          >
            إلغاء
          </button>
        </div>
      )}

      {showRedeem && redeemAmount && parseInt(redeemAmount) > 0 && (
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
          خصم متوقع: {((parseInt(redeemAmount) || 0) * redeemValue).toFixed(2)} ر.س
        </p>
      )}
    </div>
  );
}
