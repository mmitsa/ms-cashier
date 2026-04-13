import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const searchParams = request.nextUrl.searchParams;

  let subdomain = process.env.NEXT_PUBLIC_DEFAULT_STORE || "sham-restaurant";

  const storeParam = searchParams.get("store");
  if (storeParam) {
    subdomain = storeParam;
  } else {
    const parts = hostname.split(".");
    if (parts.length >= 3) {
      subdomain = parts[0];
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-store-subdomain", subdomain);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
