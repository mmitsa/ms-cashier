import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/types/api.types';
import type {
  TrialBalanceDto, IncomeStatementDto, BalanceSheetDto, ContactStatementDto,
} from './types';

export const accountingApi = {
  getTrialBalance: (fromDate: string, toDate: string, branchId?: number) =>
    apiClient
      .get<ApiResponse<TrialBalanceDto>>('/accounting/reports/trial-balance', {
        params: { fromDate, toDate, branchId },
      })
      .then((r) => r.data),

  getIncomeStatement: (fromDate: string, toDate: string, branchId?: number) =>
    apiClient
      .get<ApiResponse<IncomeStatementDto>>('/accounting/reports/income-statement', {
        params: { fromDate, toDate, branchId },
      })
      .then((r) => r.data),

  getBalanceSheet: (asOfDate: string, branchId?: number) =>
    apiClient
      .get<ApiResponse<BalanceSheetDto>>('/accounting/reports/balance-sheet', {
        params: { asOfDate, branchId },
      })
      .then((r) => r.data),

  getContactStatement: (contactId: number, fromDate: string, toDate: string) =>
    apiClient
      .get<ApiResponse<ContactStatementDto>>(`/accounting/reports/contacts/${contactId}/statement`, {
        params: { fromDate, toDate },
      })
      .then((r) => r.data),
};

export function useTrialBalance(fromDate: string, toDate: string, branchId?: number) {
  return useQuery({
    queryKey: ['accounting', 'trial-balance', fromDate, toDate, branchId],
    queryFn: () => accountingApi.getTrialBalance(fromDate, toDate, branchId),
    select: (r) => r.data,
    enabled: !!fromDate && !!toDate,
  });
}

export function useIncomeStatement(fromDate: string, toDate: string, branchId?: number) {
  return useQuery({
    queryKey: ['accounting', 'income-statement', fromDate, toDate, branchId],
    queryFn: () => accountingApi.getIncomeStatement(fromDate, toDate, branchId),
    select: (r) => r.data,
    enabled: !!fromDate && !!toDate,
  });
}

export function useBalanceSheet(asOfDate: string, branchId?: number) {
  return useQuery({
    queryKey: ['accounting', 'balance-sheet', asOfDate, branchId],
    queryFn: () => accountingApi.getBalanceSheet(asOfDate, branchId),
    select: (r) => r.data,
    enabled: !!asOfDate,
  });
}

export function useContactStatement(contactId: number | undefined, fromDate: string, toDate: string) {
  return useQuery({
    queryKey: ['accounting', 'contact-statement', contactId, fromDate, toDate],
    queryFn: () => accountingApi.getContactStatement(contactId!, fromDate, toDate),
    select: (r) => r.data,
    enabled: !!contactId && !!fromDate && !!toDate,
  });
}
