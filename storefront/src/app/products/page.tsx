import { headers } from "next/headers";
import { storefrontFetch } from "@/lib/api";
import type { Product, Category } from "@/lib/types";
import { ProductsContent } from "./products-content";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const headersList = await headers();
  const subdomain =
    headersList.get("x-store-subdomain") ||
    process.env.NEXT_PUBLIC_DEFAULT_STORE ||
    "sham-restaurant";

  const params = await searchParams;
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : "";
  const search = typeof params.search === "string" ? params.search : "";
  const page = typeof params.page === "string" ? params.page : "1";

  const query = new URLSearchParams();
  query.set("page", page);
  query.set("pageSize", "12");
  if (categoryId) query.set("categoryId", categoryId);
  if (search) query.set("search", search);

  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    [products, categories] = await Promise.all([
      storefrontFetch<Product[]>(subdomain, `/products?${query.toString()}`).catch(
        () => []
      ),
      storefrontFetch<Category[]>(subdomain, "/categories").catch(() => []),
    ]);
  } catch {
    // fallback
  }

  return (
    <ProductsContent
      products={products}
      categories={categories}
      currentCategoryId={categoryId}
      currentSearch={search}
      currentPage={Number(page)}
    />
  );
}
