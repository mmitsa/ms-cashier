// ============================================================
// Cashier Shifts — Types
// ============================================================

export type CashierShiftDto = {
  id: number;
  userId: string;
  userName?: string;
  warehouseId?: number | null;
  warehouseName?: string | null;
  openingCash: number;
  actualCash?: number | null;
  expectedCash?: number | null;
  difference?: number | null;
  totalSales?: number | null;
  totalCashSales?: number | null;
  totalCardSales?: number | null;
  invoiceCount?: number | null;
  status: 'Open' | 'Closed' | string;
  openedAt: string;
  closedAt?: string | null;
  notes?: string | null;
};

export type OpenShiftRequest = {
  openingCash: number;
  warehouseId?: number;
  notes?: string;
};

export type CloseShiftRequest = {
  actualCash: number;
  notes?: string;
};

export type ShiftSummaryDto = {
  expectedCash: number;
  actualCash: number;
  difference: number;
  totalSales: number;
  totalCashSales: number;
  totalCardSales: number;
  invoiceCount: number;
};
