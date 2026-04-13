import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StoreProvider } from "@/lib/store-context";
import { Providers } from "./providers";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-sans-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MPOS - متجرك الإلكتروني",
  description: "تسوق أفضل المنتجات بأسعار مميزة",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const subdomain =
    headersList.get("x-store-subdomain") ||
    process.env.NEXT_PUBLIC_DEFAULT_STORE ||
    "sham-restaurant";

  return (
    <html lang="ar" dir="rtl" className={`${ibmPlexSansArabic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <StoreProvider subdomain={subdomain}>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </StoreProvider>
        </Providers>
      </body>
    </html>
  );
}
