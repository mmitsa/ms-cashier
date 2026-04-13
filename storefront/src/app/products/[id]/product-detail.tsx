"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  Minus,
  Plus,
  ChevronRight,
  Check,
  Package,
} from "lucide-react";
import { useCartStore } from "@/lib/cart";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export function ProductDetail({
  product,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const displayPrice = selectedVariant
    ? selectedVariant.price
    : product.salePrice ?? product.price;
  const hasDiscount =
    !selectedVariant && product.salePrice && product.salePrice < product.price;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: displayPrice,
        image: product.image,
        variantId: selectedVariant?.id,
        variantName: selectedVariant?.name,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
        <Link href="/" className="hover:text-primary-600 transition-colors">
          الرئيسية
        </Link>
        <ChevronRight className="h-3 w-3 rotate-180" />
        <Link
          href="/products"
          className="hover:text-primary-600 transition-colors"
        >
          المنتجات
        </Link>
        <ChevronRight className="h-3 w-3 rotate-180" />
        <span className="text-[var(--foreground)] font-medium line-clamp-1">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl bg-[var(--muted)] overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
              <Package className="h-24 w-24 opacity-20" />
            </div>
          )}

          {hasDiscount && (
            <span className="absolute top-4 start-4 rounded-lg bg-red-500 px-3 py-1 text-sm font-bold text-white">
              تخفيض
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {product.categoryName && (
            <span className="text-sm text-primary-600 font-medium mb-2">
              {product.categoryName}
            </span>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold mb-4">
            {product.name}
          </h1>

          {product.description && (
            <p className="text-[var(--muted-foreground)] leading-relaxed mb-6">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-primary-600">
              {displayPrice.toFixed(2)} ر.س
            </span>
            {hasDiscount && (
              <span className="text-lg text-[var(--muted-foreground)] line-through">
                {product.price.toFixed(2)} ر.س
              </span>
            )}
          </div>

          {/* Variants */}
          {product.hasVariants && product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <label className="text-sm font-semibold mb-3 block">
                اختر النوع
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      selectedVariant?.id === variant.id
                        ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-primary-600"
                        : "hover:border-primary-300 text-[var(--muted-foreground)]"
                    }`}
                  >
                    {variant.name}
                    <span className="ms-2 text-xs">
                      {variant.price.toFixed(2)} ر.س
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <label className="text-sm font-semibold mb-3 block">الكمية</label>
            <div className="inline-flex items-center rounded-lg border">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center hover:bg-[var(--muted)] transition-colors rounded-s-lg"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex h-10 w-12 items-center justify-center border-x text-sm font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center hover:bg-[var(--muted)] transition-colors rounded-e-lg"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white transition-all ${
              added
                ? "bg-green-600"
                : "bg-primary-600 hover:bg-primary-700 active:scale-[0.98]"
            }`}
          >
            {added ? (
              <>
                <Check className="h-5 w-5" />
                تمت الإضافة
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" />
                أضف للسلة - {(displayPrice * quantity).toFixed(2)} ر.س
              </>
            )}
          </button>

          {product.sku && (
            <p className="text-xs text-[var(--muted-foreground)] mt-4">
              رمز المنتج: {product.sku}
            </p>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-6">منتجات مشابهة</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
