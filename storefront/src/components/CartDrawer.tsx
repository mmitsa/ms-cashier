"use client";

import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart";
import { AnimatePresence, motion } from "framer-motion";

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const total = getTotal();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 start-0 z-50 w-full max-w-md bg-[var(--card)] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary-600" />
                سلة التسوق
              </h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)]">
                  <ShoppingBag className="h-16 w-16 opacity-20 mb-4" />
                  <p className="text-sm">سلة التسوق فارغة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const key = item.variantId
                      ? `${item.id}-${item.variantId}`
                      : item.id;
                    return (
                      <div
                        key={key}
                        className="flex gap-3 rounded-lg border p-3"
                      >
                        <div className="relative h-16 w-16 shrink-0 rounded-md bg-[var(--muted)] overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
                              <ShoppingBag className="h-6 w-6 opacity-20" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium line-clamp-1">
                            {item.name}
                          </h4>
                          {item.variantName && (
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {item.variantName}
                            </p>
                          )}
                          <p className="text-sm font-bold text-primary-600 mt-1">
                            {(item.price * item.quantity).toFixed(2)} ر.س
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity - 1,
                                  item.variantId
                                )
                              }
                              className="flex h-6 w-6 items-center justify-center rounded border hover:bg-[var(--muted)] transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">
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
                              className="flex h-6 w-6 items-center justify-center rounded border hover:bg-[var(--muted)] transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>

                            <button
                              onClick={() =>
                                removeItem(item.id, item.variantId)
                              }
                              className="mr-auto flex h-6 w-6 items-center justify-center rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    المجموع
                  </span>
                  <span className="text-lg font-bold text-primary-600">
                    {total.toFixed(2)} ر.س
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href="/cart"
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center rounded-lg border border-primary-600 px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-600/10 transition-colors"
                  >
                    عرض السلة
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                  >
                    إتمام الشراء
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
