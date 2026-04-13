import { headers } from "next/headers";
import { storefrontFetch } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductDetail } from "./product-detail";

type Params = Promise<{ id: string }>;

export default async function ProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const headersList = await headers();
  const subdomain =
    headersList.get("x-store-subdomain") ||
    process.env.NEXT_PUBLIC_DEFAULT_STORE ||
    "sham-restaurant";

  let product: Product | null = null;
  let relatedProducts: Product[] = [];

  try {
    product = await storefrontFetch<Product>(subdomain, `/products/${id}`);

    if (product?.categoryId) {
      relatedProducts = await storefrontFetch<Product[]>(
        subdomain,
        `/products?categoryId=${product.categoryId}&pageSize=4`
      ).catch(() => []);
      relatedProducts = relatedProducts.filter((p) => p.id !== id);
    }
  } catch {
    // fallback
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">المنتج غير موجود</h1>
        <p className="text-[var(--muted-foreground)]">
          عذراً، لم نتمكن من العثور على هذا المنتج
        </p>
      </div>
    );
  }

  return <ProductDetail product={product} relatedProducts={relatedProducts} />;
}
