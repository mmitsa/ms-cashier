import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/types/api.types';
import type {
  TrialBalanceDto, IncomeStatementDto, BalanceSheetDto, ContactStatementDto,
  ChartOfAccountNode,
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

// ==================== Chart of Accounts ====================

export type ChartOfAccountsResult = {
  accounts: ChartOfAccountNode[];
  notAvailable: boolean;
};

async function fetchChartOfAccounts(): Promise<ChartOfAccountsResult> {
  try {
    const res = await apiClient.get<ApiResponse<ChartOfAccountNode[]>>(
      '/accounting/chart-of-accounts'
    );
    return { accounts: res.data.data ?? [], notAvailable: false };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      // eslint-disable-next-line no-console
      console.warn('[accounting] Chart of Accounts endpoint not available yet (404)');
      return { accounts: [], notAvailable: true };
    }
    throw err;
  }
}

export function useChartOfAccounts() {
  return useQuery({
    queryKey: ['accounting', 'chart-of-accounts'],
    queryFn: fetchChartOfAccounts,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export type CreateChartOfAccountInput = {
  parentId: number | null;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
};

export function useCreateChartOfAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChartOfAccountInput) =>
      apiClient
        .post<ApiResponse<ChartOfAccountNode>>('/accounting/chart-of-accounts', input)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'chart-of-accounts'] });
    },
  });
}

export type UpdateChartOfAccountInput = {
  nameAr?: string;
  nameEn?: string | null;
  description?: string | null;
  isActive?: boolean;
};

export function useUpdateChartOfAccount(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateChartOfAccountInput) =>
      apiClient
        .patch<ApiResponse<ChartOfAccountNode>>(`/accounting/chart-of-accounts/${id}`, input)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting', 'chart-of-accounts'] });
    },
  });
}
