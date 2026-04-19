import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashierShiftsApi } from '@/lib/api/endpoints';
import type {
  CashierShiftDto, OpenShiftRequest, CloseShiftRequest, ShiftSummaryDto,
} from './types';

const keys = {
  all: ['cashier-shifts'] as const,
  current: ['cashier-shifts', 'current'] as const,
  history: (params?: any) => ['cashier-shifts', 'list', params] as const,
  summary: (id: number) => ['cashier-shifts', 'summary', id] as const,
};

export function useCurrentShift() {
  return useQuery({
    queryKey: keys.current,
    queryFn: () => cashierShiftsApi.current(),
    select: (r) => (r?.data ?? null) as CashierShiftDto | null,
    staleTime: 30_000,
  });
}

export function useShiftSummary(id: number | null | undefined) {
  return useQuery({
    queryKey: keys.summary(id ?? 0),
    queryFn: () => cashierShiftsApi.summary(id as number),
    enabled: !!id,
    select: (r) => r?.data as ShiftSummaryDto | null,
  });
}

export function useShiftsHistory(params?: { page?: number; pageSize?: number; from?: string; to?: string }) {
  return useQuery({
    queryKey: keys.history(params),
    queryFn: () => cashierShiftsApi.list(params),
    select: (r) => r?.data,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: keys.all });
}

export function useOpenShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OpenShiftRequest) => cashierShiftsApi.open(data),
    onSuccess: () => invalidate(qc),
  });
}

export function useCloseShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CloseShiftRequest) => cashierShiftsApi.close(data),
    onSuccess: () => invalidate(qc),
  });
}
