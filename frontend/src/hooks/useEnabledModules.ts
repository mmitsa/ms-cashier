import { useQuery } from '@tanstack/react-query';
import { tenantModulesApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';

export function useEnabledModules() {
  const user = useAuthStore((s) => s.user);
  const enabled = !!user && user.role !== 'SuperAdmin';

  const { data } = useQuery({
    queryKey: ['my-tenant-modules'],
    queryFn: () => tenantModulesApi.getMine(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const modules = data?.data ?? [];
  const enabledSet = new Set(modules.filter((m) => m.isEnabled).map((m) => m.key));

  const isModuleEnabled = (key?: string | null) => {
    if (!key) return true;
    if (!user) return false;
    if (user.role === 'SuperAdmin') return true;
    if (modules.length === 0) return true;
    return enabledSet.has(key);
  };

  return { modules, isModuleEnabled };
}
