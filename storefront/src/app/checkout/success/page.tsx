"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Home, ShoppingBag } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";
  const total = searchParams.get("total") || "0";

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="flex justify-center mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-3">
        تم استلام طلبك بنجاح!
      </h1>
      <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed">
        شكراً لك! تم تسجيل طلبك وسنتواصل معك قريباً لتأكيد التفاصيل.
      </p>

      {orderNumber && (
        <div className="rounded-xl border bg-[var(--card)] p-6 mb-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">رقم الطلب</span>
              <span className="font-bold text-primary-600 text-lg">
                #{orderNumber}
              </span>
            </div>
            {total !== "0" && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">
                  إجمالي الطلب
                </span>
                <span className="font-semibold">{total} ر.س</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">
                طريقة الدفع
              </span>
              <span className="font-medium">الدفع عند الاستلام</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Home className="h-4 w-4" />
          الرئيسية
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />
          متابعة التسوق
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">جاري تحميل تفاصيل الطلب...</h1>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
