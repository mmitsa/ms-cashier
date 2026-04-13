"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";
import { useCartStore } from "@/lib/cart";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } =
    useCartStore();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <ShoppingBag className="h-20 w-20 text-[var(--muted-foreground)] opacity-20 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2">سلة التسوق فارغة</h1>
        <p className="text-[var(--muted-foreground)] mb-6">
          لم تقم بإضافة أي منتجات بعد
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          تصفح المنتجات
          <ArrowRight className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">سلة التسوق</h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
        >
          إفراغ السلة
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const key = item.variantId
              ? `${item.id}-${item.variantId}`
              : item.id;
            return (
              <div
                key={key}
                className="flex gap-4 rounded-xl border bg-[var(--card)] p-4"
              >
                <div className="relative h-24 w-24 shrink-0 rounded-lg bg-[var(--muted)] overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
                      <ShoppingCart className="h-8 w-8 opacity-20" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.id}`}
                    className="text-sm sm:text-base font-semibold hover:text-primary-600 transition-colors line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  {item.variantName && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {item.variantName}
                    </p>
                  )}
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {item.price.toFixed(2)} ر.س للواحدة
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center rounded-lg border">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1,
                            item.variantId
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center hover:bg-[var(--muted)] transition-colors rounded-s-lg"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="flex h-8 w-10 items-center justify-center border-x text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1,
                            item.variantId
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center hover:bg-[var(--muted)] transition-colors rounded-e-lg"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-primary-600">
                        {(item.price * item.quantity).toFixed(2)} ر.س
                      </span>
                      <button
                        onClick={() => removeItem(item.id, item.variantId)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border bg-[var(--card)] p-6">
            <h2 className="text-lg font-bold mb-4">ملخص الطلب</h2>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">
                  المجموع الفرعي
                </span>
                <span className="font-medium">{total.toFixed(2)} ر.س</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">التوصيل</span>
                <span className="font-medium text-green-600">مجاني</span>
              </div>
              <hr />
              <div className="flex items-center justify-between">
                <span className="font-semibold">الإجمالي</span>
                <span className="text-xl font-bold text-primary-600">
                  {total.toFixed(2)} ر.س
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="flex w-full items-center justify-center rounded-xl bg-primary-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              إتمام الشراء
            </Link>

            <Link
              href="/products"
              className="flex w-full items-center justify-center rounded-xl border mt-3 px-6 py-3 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              متابعة التسوق
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
