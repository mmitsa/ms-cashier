import { Store } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-[var(--card)] mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-primary-700 dark:text-primary-300">
                MPOS
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              متجرك الإلكتروني المفضل. نقدم لك أفضل المنتجات بأسعار تنافسية وخدمة توصيل سريعة.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-[var(--muted-foreground)] hover:text-primary-600 transition-colors"
                >
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-sm text-[var(--muted-foreground)] hover:text-primary-600 transition-colors"
                >
                  المنتجات
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="text-sm text-[var(--muted-foreground)] hover:text-primary-600 transition-colors"
                >
                  سلة التسوق
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold mb-4">تواصل معنا</h3>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li>البريد: info@mpos.app</li>
              <li>الهاتف: +966 50 000 0000</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-xs text-[var(--muted-foreground)]">
          <p>&copy; {new Date().getFullYear()} MPOS. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
