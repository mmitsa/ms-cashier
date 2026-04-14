export type PostingFailure = {
  id: number;
  sourceType: string;
  sourceId: number;
  operation: string;
  errorMessage: string;
  stackTrace: string | null;
  retryCount: number;
  lastRetryAt: string | null;
  isResolved: boolean;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
};

export type PostingFailureFilters = {
  resolved?: boolean;
  source?: string;
  page?: number;
  pageSize?: number;
};

export const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'كل المصادر' },
  { value: 'Invoice', label: 'الفواتير' },
  { value: 'Payroll', label: 'الرواتب' },
  { value: 'FinanceTransaction', label: 'حركات الخزينة' },
  { value: 'InstallmentPayment', label: 'أقساط' },
];

export const sourceLabels: Record<string, string> = {
  Invoice: 'فاتورة',
  Payroll: 'راتب',
  FinanceTransaction: 'حركة خزينة',
  InstallmentPayment: 'قسط',
};

export const sourceBadgeVariant: Record<string, 'info' | 'primary' | 'success' | 'warning' | 'default'> = {
  Invoice: 'info',
  Payroll: 'primary',
  FinanceTransaction: 'success',
  InstallmentPayment: 'warning',
};
