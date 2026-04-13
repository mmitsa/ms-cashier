"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { Product, Category } from "@/lib/types";

export function ProductsContent({
  products,
  categories,
  currentCategoryId,
  currentSearch,
  currentPage,
}: {
  products: Product[];
  categories: Category[];
  currentCategoryId: string;
  currentSearch: string;
  currentPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [showFilters, setShowFilters] = useState(false);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      params.delete("page");
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput });
  };

  const handleCategoryClick = (categoryId: string) => {
    updateParams({
      categoryId: categoryId === currentCategoryId ? "" : categoryId,
    });
  };

  const navigatePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/products?${params.toString()}`);
  };

  const hasMore = products.length >= 12;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">المنتجات</h1>

        {/* Search & Filter Bar */}
        <div className="flex gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full rounded-lg border ps-10 pe-4 py-2.5 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateParams({ search: "" });
                }}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            فلترة
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar - Categories */}
        <aside
          className={`${
            showFilters ? "block" : "hidden"
          } lg:block w-full lg:w-56 shrink-0`}
        >
          <div className="sticky top-20 rounded-xl border bg-[var(--card)] p-4">
            <h3 className="text-sm font-semibold mb-3">الأقسام</h3>
            <div className="space-y-1">
              <button
                onClick={() => handleCategoryClick("")}
                className={`w-full text-start rounded-lg px-3 py-2 text-sm transition-colors ${
                  !currentCategoryId
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium"
                    : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
                }`}
              >
                الكل
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full text-start rounded-lg px-3 py-2 text-sm transition-colors ${
                    currentCategoryId === cat.id
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium"
                      : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {cat.name}
                  {cat.productCount !== undefined && (
                    <span className="ms-1 text-xs opacity-60">
                      ({cat.productCount})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Active Filters */}
          {(currentCategoryId || currentSearch) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {currentSearch && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300">
                  بحث: {currentSearch}
                  <button onClick={() => updateParams({ search: "" })}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {currentCategoryId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300">
                  {categories.find((c) => c.id === currentCategoryId)?.name || "قسم"}
                  <button onClick={() => handleCategoryClick("")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="h-16 w-16 text-[var(--muted-foreground)] opacity-20 mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد منتجات</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                حاول تغيير معايير البحث أو تصفح الأقسام الأخرى
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => navigatePage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--muted)] transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </button>
                <span className="text-sm text-[var(--muted-foreground)]">
                  صفحة {currentPage}
                </span>
                <button
                  onClick={() => navigatePage(currentPage + 1)}
                  disabled={!hasMore}
                  className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--muted)] transition-colors"
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
