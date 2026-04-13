"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Banknote,
  Loader2,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { useStore } from "@/lib/store-context";
import { storefrontPost } from "@/lib/api";
import type { CreateOrderRequest, Order } from "@/lib/types";

export default function CheckoutPage() {
  const router = useRouter();
  const { subdomain } = useStore();
  const { items, getTotal, clearCart } = useCartStore();
  const total = getTotal();

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    notes: "",
    paymentMethod: "cod",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.customerName.trim()) {
      setError("الرجاء إدخال الاسم");
      return;
    }
    if (!form.customerPhone.trim()) {
      setError("الرجاء إدخال رقم الهاتف");
      return;
    }
    if (items.length === 0) {
      setError("السلة فارغة");
      return;
    }

    setLoading(true);
    try {
      const orderData: CreateOrderRequest = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail || undefined,
        deliveryAddress: form.deliveryAddress || undefined,
        notes: form.notes || undefined,
        paymentMethod: form.paymentMethod,
        items: items.map((item) => ({
          productId: item.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      };

      const order = await storefrontPost<Order, CreateOrderRequest>(
        subdomain,
        "/orders",
        orderData
      );

      clearCart();
      router.push(`/checkout/success?orderNumber=${order.orderNumber}&total=${total.toFixed(2)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء الطلب");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <ShoppingBag className="h-20 w-20 text-[var(--muted-foreground)] opacity-20 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2">السلة فارغة</h1>
        <p className="text-[var(--muted-foreground)]">
          أضف منتجات للسلة أولاً
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">إتمام الشراء</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="rounded-xl border bg-[var(--card)] p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" />
                معلومات العميل
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    الاسم الكامل *
                  </label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(e) =>
                        updateField("customerName", e.target.value)
                      }
                      placeholder="أدخل اسمك"
                      required
                      className="w-full rounded-lg border ps-10 pe-4 py-2.5 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    رقم الهاتف *
                  </label>
                  <div className="relative">
                    <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                    <input
                      type="tel"
                      value={form.customerPhone}
                      onChange={(e) =>
                        updateField("customerPhone", e.target.value)
                      }
                      placeholder="05xxxxxxxx"
                      required
                      dir="ltr"
                      className="w-full rounded-lg border ps-10 pe-4 py-2.5 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-end"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-1.5 block">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                    <input
                      type="email"
                      value={form.customerEmail}
                      onChange={(e) =>
                        updateField("customerEmail", e.target.value)
                      }
                      placeholder="example@email.com"
                      dir="ltr"
                      className="w-full rounded-lg border ps-10 pe-4 py-2.5 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-end"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="rounded-xl border bg-[var(--card)] p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                عنوان التوصيل
              </h2>
              <textarea
                value={form.deliveryAddress}
                onChange={(e) =>
                  updateField("deliveryAddress", e.target.value)
                }
                placeholder="أدخل عنوان التوصيل بالتفصيل..."
                rows={3}
                className="w-full rounded-lg border px-4 py-2.5 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Payment Method */}
            <div className="rounded-xl border bg-[var(--card)] p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-600" />
                طريقة الدفع
              </h2>

              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                    form.paymentMethod === "cod"
                      ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-600"
                      : "hover:border-primary-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={form.paymentMethod === "cod"}
                    onChange={(e) =>
                      updateField("paymentMethod", e.target.value)
                    }
                    className="accent-primary-600"
                  />
                  <Banknote className="h-5 w-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium">الدفع عند الاستلام</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      ادفع نقداً عند استلام الطلب
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-xl border bg-[var(--card)] p-6">
              <h2 className="text-lg font-bold mb-4">ملاحظات إضافية</h2>
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="أضف ملاحظات للطلب..."
                rows={2}
                className="w-full rounded-lg border px-4 py-2.5 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border bg-[var(--card)] p-6">
              <h2 className="text-lg font-bold mb-4">ملخص الطلب</h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const key = item.variantId
                    ? `${item.id}-${item.variantId}`
                    : item.id;
                  return (
                    <div key={key} className="flex gap-3">
                      <div className="relative h-12 w-12 shrink-0 rounded-md bg-[var(--muted)] overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
                            <ShoppingBag className="h-4 w-4 opacity-30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {item.quantity} x {item.price.toFixed(2)} ر.س
                        </p>
                      </div>
                      <span className="text-sm font-medium shrink-0">
                        {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <hr className="my-4" />

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    المجموع الفرعي
                  </span>
                  <span>{total.toFixed(2)} ر.س</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    التوصيل
                  </span>
                  <span className="text-green-600">مجاني</span>
                </div>
                <hr />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">الإجمالي</span>
                  <span className="text-xl font-bold text-primary-600">
                    {total.toFixed(2)} ر.س
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 mb-4 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    جاري إنشاء الطلب...
                  </>
                ) : (
                  "تأكيد الطلب"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
