import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postingFailuresApi } from '@/lib/api/endpoints';
import type { PostingFailure, PostingFailureFilters } from './types';

const keys = {
  all: ['posting-failures'] as const,
  list: (filters: PostingFailureFilters) => ['posting-failures', 'list', filters] as const,
};

export function usePostingFailures(filters: PostingFailureFilters) {
  return useQuery({
    queryKey: keys.list(filters),
    queryFn: () => postingFailuresApi.list(filters),
    refetchInterval: 30_000,
    select: (r) => {
      const payload = r.data as unknown as {
        items?: PostingFailure[];
        totalCount?: number;
        pageNumber?: number;
        page?: number;
        pageSize?: number;
        totalPages?: number;
      } | PostingFailure[] | undefined;

      if (Array.isArray(payload)) {
        return {
          items: payload,
          totalCount: payload.length,
          page: 1,
          pageSize: payload.length || 20,
          totalPages: 1,
        };
      }
      return {
        items: payload?.items ?? [],
        totalCount: payload?.totalCount ?? 0,
        page: payload?.pageNumber ?? payload?.page ?? 1,
        pageSize: payload?.pageSize ?? 20,
        totalPages: payload?.totalPages ?? 1,
      };
    },
  });
}

export function useRetryPostingFailure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postingFailuresApi.retry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useResolvePostingFailure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      postingFailuresApi.resolve(id, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
