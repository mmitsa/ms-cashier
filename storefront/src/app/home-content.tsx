"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Grid3X3 } from "lucide-react";
import { HeroBanner } from "@/components/HeroBanner";
import { ProductCard } from "@/components/ProductCard";
import type { Product, Category, Banner } from "@/lib/types";

export function HomeContent({
  banners,
  categories,
  products,
}: {
  banners: Banner[];
  categories: Category[];
  products: Product[];
}) {
  return (
    <div className="space-y-12 pb-12">
      {/* Hero Banner */}
      <HeroBanner banners={banners} />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">الأقسام</h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                className="group flex flex-col items-center gap-3 rounded-xl border bg-[var(--card)] p-4 hover:shadow-md hover:border-primary-200 transition-all"
              >
                <div className="relative h-16 w-16 rounded-full bg-primary-50 dark:bg-primary-900/20 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover rounded-full"
                      sizes="64px"
                    />
                  ) : (
                    <Grid3X3 className="h-7 w-7 text-primary-500" />
                  )}
                </div>
                <span className="text-sm font-medium text-center line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">منتجات مميزة</h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {products.length === 0 && categories.length === 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Grid3X3 className="h-16 w-16 text-[var(--muted-foreground)] opacity-30 mb-4" />
            <h2 className="text-xl font-bold mb-2">مرحباً بك في المتجر</h2>
            <p className="text-[var(--muted-foreground)]">
              سيتم إضافة المنتجات قريباً. تابعنا!
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
