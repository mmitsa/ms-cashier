import { headers } from "next/headers";
import { storefrontFetch } from "@/lib/api";
import type { Product, Category, Banner } from "@/lib/types";
import { HomeContent } from "./home-content";

export default async function HomePage() {
  const headersList = await headers();
  const subdomain =
    headersList.get("x-store-subdomain") ||
    process.env.NEXT_PUBLIC_DEFAULT_STORE ||
    "sham-restaurant";

  let banners: Banner[] = [];
  let categories: Category[] = [];
  let products: Product[] = [];

  try {
    [banners, categories, products] = await Promise.all([
      storefrontFetch<Banner[]>(subdomain, "/banners").catch(() => []),
      storefrontFetch<Category[]>(subdomain, "/categories").catch(() => []),
      storefrontFetch<Product[]>(subdomain, "/products?page=1&pageSize=8").catch(
        () => []
      ),
    ]);
  } catch {
    // Fallback to empty data
  }

  return (
    <HomeContent
      banners={banners}
      categories={categories}
      products={products}
    />
  );
}
