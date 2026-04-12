import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' ج.م';
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG').format(num);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getPaymentMethodLabel(method: number): string {
  const labels: Record<number, string> = {
    1: 'كاش',
    2: 'فيزا',
    3: 'انستاباي',
    4: 'آجل',
    5: 'تقسيط',
  };
  return labels[method] ?? 'غير محدد';
}

export function getPaymentStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    1: 'مدفوع',
    2: 'جزئي',
    3: 'غير مدفوع',
  };
  return labels[status] ?? 'غير محدد';
}

export function getInvoiceTypeLabel(type: number): string {
  const labels: Record<number, string> = {
    1: 'بيع',
    2: 'مرتجع بيع',
    3: 'شراء',
    4: 'مرتجع شراء',
  };
  return labels[type] ?? 'غير محدد';
}

export function getPriceTypeLabel(priceType: number): string {
  const labels: Record<number, string> = {
    1: 'قطاعي',
    2: 'جملة نصفي',
    3: 'جملة',
  };
  return labels[priceType] ?? 'غير محدد';
}

export function getPriceByType(
  product: { retailPrice: number; halfWholesalePrice?: number; wholesalePrice?: number },
  priceType: 'retail' | 'half' | 'wholesale'
): number {
  switch (priceType) {
    case 'half': return product.halfWholesalePrice ?? product.retailPrice;
    case 'wholesale': return product.wholesalePrice ?? product.retailPrice;
    default: return product.retailPrice;
  }
}
