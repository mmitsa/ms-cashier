"use client";

import Link from "next/link";
import { ShoppingCart, Menu, X, Search, Store } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/lib/cart";
import { CartDrawer } from "./CartDrawer";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-[var(--card)] backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-primary-700 dark:text-primary-300">
                MPOS
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-[var(--muted-foreground)] hover:text-primary-600 transition-colors"
              >
                الرئيسية
              </Link>
              <Link
                href="/products"
                className="text-sm font-medium text-[var(--muted-foreground)] hover:text-primary-600 transition-colors"
              >
                المنتجات
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors"
              >
                <Search className="h-5 w-5 text-[var(--muted-foreground)]" />
              </Link>

              <button
                onClick={() => setCartOpen(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-[var(--muted-foreground)]" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </button>

              <button
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t bg-[var(--card)]">
            <nav className="flex flex-col px-4 py-3 gap-1">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                الرئيسية
              </Link>
              <Link
                href="/products"
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                المنتجات
              </Link>
              <Link
                href="/cart"
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                سلة التسوق
              </Link>
            </nav>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
