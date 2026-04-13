const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api/v1";

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  errors?: string[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
};

export async function storefrontFetch<T>(
  subdomain: string,
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}/storefront/${subdomain}${path}`, {
    next: { revalidate: 60 },
    ...options,
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.errors?.[0] || "حدث خطأ");
  return json.data;
}

export async function storefrontPost<T, B = unknown>(
  subdomain: string,
  path: string,
  body: B
): Promise<T> {
  const res = await fetch(`${API_BASE}/storefront/${subdomain}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.errors?.[0] || "حدث خطأ");
  return json.data;
}

export function getSubdomain(hostname: string, searchParams?: URLSearchParams): string {
  const storeParam = searchParams?.get("store");
  if (storeParam) return storeParam;

  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }

  return process.env.NEXT_PUBLIC_DEFAULT_STORE || "sham-restaurant";
}
