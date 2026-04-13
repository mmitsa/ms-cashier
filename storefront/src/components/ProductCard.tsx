"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: displayPrice,
      image: product.image,
    });
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block rounded-xl border bg-[var(--card)] overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-square bg-[var(--muted)] overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
            <ShoppingCart className="h-12 w-12 opacity-20" />
          </div>
        )}

        {hasDiscount && (
          <span className="absolute top-2 start-2 rounded-md bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            تخفيض
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-[var(--card-foreground)] line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-primary-600">
              {displayPrice.toFixed(2)} ر.س
            </span>
            {hasDiscount && (
              <span className="text-xs text-[var(--muted-foreground)] line-through">
                {product.price.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors shrink-0"
            aria-label="أضف للسلة"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
