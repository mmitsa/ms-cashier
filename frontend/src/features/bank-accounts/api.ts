import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/lib/api/endpoints';
import type { CreateBankAccountDto, UpdateBankAccountDto } from './types';

const keys = {
  all: ['finance', 'accounts'] as const,
  detail: (id: number) => ['finance', 'accounts', id] as const,
};

export function useBankAccounts() {
  return useQuery({
    queryKey: keys.all,
    queryFn: () => financeApi.getAccounts(),
    select: (r) => r.data ?? [],
  });
}

export function useBankAccount(id: number | null) {
  return useQuery({
    queryKey: keys.detail(id ?? 0),
    queryFn: () => financeApi.getAccount(id as number),
    enabled: !!id,
    select: (r) => r.data,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['finance'] });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBankAccountDto) => financeApi.createBankAccount(data),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBankAccountDto }) =>
      financeApi.updateBankAccount(id, data),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeactivateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeApi.deactivateAccount(id),
    onSuccess: () => invalidate(qc),
  });
}

export function useActivateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeApi.activateAccount(id),
    onSuccess: () => invalidate(qc),
  });
}
