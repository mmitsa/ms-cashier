// Shared formatting helpers for the accounting module.

const numberFmt = new Intl.NumberFormat('ar-SA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(n: number): string {
  if (!isFinite(n)) return '0.00';
  return numberFmt.format(n);
}

export const CURRENCY_SUFFIX = 'ر.س';

export function formatMoney(n: number): string {
  return `${formatAmount(n)} ${CURRENCY_SUFFIX}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function firstOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
