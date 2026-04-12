/**
 * Permissions Hook & Guard
 * Checks user permissions at runtime for UI access control
 */

import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { PermissionKey } from './permissions';
import { ROLE_DEFAULTS } from './permissions';

// Cache the user's permissions from the API
export function useUserPermissions() {
  const user = useAuthStore((s) => s.user);

  const { data: serverPermissions } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/users/${user!.id}`);
        return (res.data?.data?.permissions || []) as { permission: string; isGranted: boolean }[];
      } catch {
        return [];
      }
    },
    enabled: !!user && user.role !== 'SuperAdmin',
    staleTime: 300_000, // 5 minutes
  });

  return {
    permissions: serverPermissions || [],
    role: user?.role || 'Cashier',
    isSuperAdmin: user?.role === 'SuperAdmin',
    isAdmin: user?.role === 'Admin' || user?.role === 'SuperAdmin',
  };
}

export function useHasPermission(permission: PermissionKey): boolean {
  const user = useAuthStore((s) => s.user);

  // SuperAdmin & Admin have all permissions
  if (!user) return false;
  if (user.role === 'SuperAdmin' || user.role === 'Admin') return true;

  // Check from JWT claims (permissions stored in localStorage for speed)
  const stored = getStoredPermissions();
  if (stored.length > 0) {
    const found = stored.find((p) => p.permission === permission);
    if (found) return found.isGranted;
  }

  // Fallback to role defaults
  const rolePerms = ROLE_DEFAULTS[user.role] || [];
  return rolePerms.includes(permission);
}

export function useCanAccess(permissions: PermissionKey[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  if (user.role === 'SuperAdmin' || user.role === 'Admin') return true;

  return permissions.some((p) => {
    const stored = getStoredPermissions();
    if (stored.length > 0) {
      const found = stored.find((sp) => sp.permission === p);
      if (found) return found.isGranted;
    }
    const rolePerms = ROLE_DEFAULTS[user.role] || [];
    return rolePerms.includes(p);
  });
}

// Store permissions in localStorage for fast offline access
export function storePermissions(perms: { permission: string; isGranted: boolean }[]) {
  try {
    localStorage.setItem('ms_user_permissions', JSON.stringify(perms));
  } catch { /* ignore */ }
}

function getStoredPermissions(): { permission: string; isGranted: boolean }[] {
  try {
    const raw = localStorage.getItem('ms_user_permissions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Quick check function (non-hook, for imperative use)
export function hasPermission(permission: PermissionKey): boolean {
  const authState = useAuthStore.getState();
  const user = authState.user;
  if (!user) return false;
  if (user.role === 'SuperAdmin' || user.role === 'Admin') return true;

  const stored = getStoredPermissions();
  if (stored.length > 0) {
    const found = stored.find((p) => p.permission === permission);
    if (found) return found.isGranted;
  }

  const rolePerms = ROLE_DEFAULTS[user.role] || [];
  return rolePerms.includes(permission);
}
