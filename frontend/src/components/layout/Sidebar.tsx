import { useState, useCallback, useEffect } from 'react';
import {
  ShoppingCart, Package, Users, BarChart3, Settings, Home,
  Receipt, DollarSign, Warehouse, UserCheck, Building2,
  ChevronRight, ChevronLeft, ChevronDown, FileText, Shield, Fingerprint, Banknote,
  GitBranch, ClipboardCheck, UtensilsCrossed, ChefHat, MapPin, QrCode, CreditCard,
  LayoutGrid, Store, Utensils, Landmark, UserCog, ShieldCheck, Ruler, Gift,
  Megaphone, Globe, ScanLine, Code, BookOpen, AlertOctagon, Clock,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { MODULE_PERMISSIONS, type PermissionKey } from '@/lib/permissions/permissions';
import { hasPermission } from '@/lib/permissions/usePermissions';
import { useEnabledModules } from '@/hooks/useEnabledModules';

// ─── Types ───────────────────────────────────────────

interface ModuleItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  adminOnly?: boolean;
  permission?: PermissionKey;
  moduleKey?: string;
}

interface ModuleGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: ModuleItem[];
  adminOnly?: boolean;
}

// ─── Sidebar Groups ──────────────────────────────────

const sidebarGroups: ModuleGroup[] = [
  {
    id: 'main',
    label: 'الرئيسية',
    icon: LayoutGrid,
    items: [
      { id: 'dashboard', label: 'لوحة التحكم', icon: Home, permission: MODULE_PERMISSIONS.dashboard },
      { id: 'pos', label: 'نقطة البيع', icon: ShoppingCart, permission: MODULE_PERMISSIONS.pos },
    ],
  },
  {
    id: 'commerce',
    label: 'المبيعات والمخزون',
    icon: Store,
    items: [
      { id: 'sales', label: 'المبيعات', icon: Receipt, permission: MODULE_PERMISSIONS.sales, moduleKey: 'Sales' },
      { id: 'inventory', label: 'المخزون', icon: Package, permission: MODULE_PERMISSIONS.inventory, moduleKey: 'Inventory' },
      { id: 'warehouses', label: 'المخازن', icon: Warehouse, permission: MODULE_PERMISSIONS.warehouses, moduleKey: 'Inventory' },
      { id: 'units', label: 'وحدات القياس', icon: Ruler, permission: MODULE_PERMISSIONS.inventory, moduleKey: 'Inventory' },
      { id: 'customers', label: 'العملاء والموردين', icon: Users, permission: MODULE_PERMISSIONS.customers },
      { id: 'sales-reps', label: 'مندوبي المبيعات', icon: UserCheck, permission: MODULE_PERMISSIONS.sales, moduleKey: 'SalesReps' },
      { id: 'loyalty', label: 'نقاط الولاء', icon: Gift, permission: MODULE_PERMISSIONS.settings, moduleKey: 'Loyalty' },
      { id: 'rfid-inventory', label: 'جرد RFID و QR', icon: ScanLine, permission: MODULE_PERMISSIONS.inventory, moduleKey: 'Rfid' },
    ],
  },
  {
    id: 'restaurant',
    label: 'خدمة المطعم',
    icon: Utensils,
    items: [
      { id: 'floor-plan', label: 'مناطق التشغيل', icon: MapPin, permission: MODULE_PERMISSIONS.waiter, moduleKey: 'Restaurant' },
      { id: 'waiter', label: 'الويتر / الطلبات', icon: UtensilsCrossed, permission: MODULE_PERMISSIONS.waiter, moduleKey: 'Restaurant' },
      { id: 'kitchen', label: 'شاشة المطبخ', icon: ChefHat, permission: MODULE_PERMISSIONS.kitchen, moduleKey: 'Restaurant' },
      { id: 'qr-codes', label: 'QR طلب العملاء', icon: QrCode, permission: MODULE_PERMISSIONS.waiter, moduleKey: 'Restaurant' },
    ],
  },
  {
    id: 'finance',
    label: 'المالية والتقارير',
    icon: Landmark,
    items: [
      { id: 'finance', label: 'الحسابات والخزينة', icon: DollarSign, permission: MODULE_PERMISSIONS.finance, moduleKey: 'Finance' },
      { id: 'bank-accounts', label: 'الحسابات البنكية والصناديق', icon: Landmark, permission: MODULE_PERMISSIONS.finance, moduleKey: 'Finance' },
      { id: 'accounting', label: 'المحاسبة', icon: BookOpen, permission: MODULE_PERMISSIONS.finance, moduleKey: 'Finance' },
      { id: 'posting-failures', label: 'القيود الفاشلة', icon: AlertOctagon, adminOnly: true },
      { id: 'payroll', label: 'الرواتب والشيكات', icon: Banknote, permission: MODULE_PERMISSIONS.payroll, moduleKey: 'Payroll' },
      { id: 'payment-terminals', label: 'ماكينات الدفع', icon: CreditCard, permission: MODULE_PERMISSIONS.settings, moduleKey: 'Terminals' },
      { id: 'shifts-history', label: 'سجل الشيفتات', icon: Clock, permission: MODULE_PERMISSIONS.finance, moduleKey: 'Finance' },
      { id: 'reports', label: 'التقارير', icon: BarChart3, permission: MODULE_PERMISSIONS.reports, moduleKey: 'Reports' },
    ],
  },
  {
    id: 'hr',
    label: 'شؤون الموظفين',
    icon: UserCog,
    items: [
      { id: 'employees', label: 'الموظفين', icon: UserCheck, permission: MODULE_PERMISSIONS.employees, moduleKey: 'Employees' },
      { id: 'attendance', label: 'الحضور والانصراف', icon: Fingerprint, permission: MODULE_PERMISSIONS.attendance, moduleKey: 'Attendance' },
    ],
  },
  {
    id: 'online-store',
    label: 'المتجر الإلكتروني',
    icon: Globe,
    items: [
      { id: 'store-builder', label: 'المتجر الإلكتروني', icon: Globe, permission: MODULE_PERMISSIONS.settings, moduleKey: 'OnlineStore' },
    ],
  },
  {
    id: 'marketing',
    label: 'التسويق',
    icon: Megaphone,
    items: [
      { id: 'social-media', label: 'التواصل الاجتماعي', icon: Megaphone, permission: MODULE_PERMISSIONS.settings, moduleKey: 'SocialMedia' },
    ],
  },
  {
    id: 'developers',
    label: 'المطورين',
    icon: Code,
    items: [
      { id: 'api-management', label: 'إدارة API', icon: Code, permission: MODULE_PERMISSIONS.settings, moduleKey: 'Api' },
    ],
  },
  {
    id: 'admin',
    label: 'الإدارة',
    icon: ShieldCheck,
    items: [
      { id: 'branches', label: 'إدارة الفروع', icon: GitBranch, permission: MODULE_PERMISSIONS.branches, moduleKey: 'Branches' },
      { id: 'users', label: 'إدارة المستخدمين', icon: Shield },
      { id: 'settings', label: 'الإعدادات', icon: Settings, permission: MODULE_PERMISSIONS.settings },
    ],
  },
  {
    id: 'system',
    label: 'إدارة النظام',
    icon: Building2,
    adminOnly: true,
    items: [
      { id: 'tenants', label: 'إدارة المتاجر', icon: Building2, adminOnly: true },
      { id: 'subscriptions', label: 'طلبات الاشتراك', icon: FileText, adminOnly: true },
      { id: 'branchRequests', label: 'طلبات الفروع', icon: ClipboardCheck, adminOnly: true },
    ],
  },
];

// Flat modules list — backward compatible export for Header.tsx
const modules: ModuleItem[] = sidebarGroups.flatMap((g) => g.items);

// ─── localStorage persistence ────────────────────────

const STORAGE_KEY = 'sidebar-collapsed-groups';

function loadCollapsedGroups(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persistCollapsedGroups(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

// ─── SidebarItem ─────────────────────────────────────

function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
  collapsed,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  collapsed: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
        collapsed && 'justify-center px-0',
        active
          ? 'bg-white text-brand-900 shadow-sm border border-gray-100'
          : 'text-gray-400 hover:text-white hover:bg-white/10'
      )}
    >
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
      {!collapsed && <span className="flex-1 text-right">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── SidebarGroupHeader ──────────────────────────────

function SidebarGroupHeader({
  icon: Icon,
  label,
  sidebarCollapsed,
  isOpen,
  onToggle,
  hasActiveItem,
}: {
  icon: LucideIcon;
  label: string;
  sidebarCollapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
  hasActiveItem: boolean;
}) {
  // In collapsed sidebar mode: show a thin divider instead of a text header
  if (sidebarCollapsed) {
    return (
      <div className="flex justify-center py-2">
        <div className="w-8 border-t border-white/10" />
      </div>
    );
  }

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 mt-2 mb-0.5 rounded-lg text-[11px] font-bold tracking-wider transition-colors group',
        hasActiveItem && !isOpen
          ? 'text-brand-400'
          : 'text-gray-500 hover:text-gray-300'
      )}
    >
      <Icon size={14} strokeWidth={1.5} className="shrink-0" />
      <span className="flex-1 text-right">{label}</span>
      {hasActiveItem && !isOpen && (
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
      )}
      <ChevronDown
        size={12}
        className={cn(
          'shrink-0 transition-transform duration-200 opacity-0 group-hover:opacity-100',
          !isOpen && '-rotate-90',
          (hasActiveItem && !isOpen) && 'opacity-100'
        )}
      />
    </button>
  );
}

// ─── Sidebar ─────────────────────────────────────────

export function Sidebar() {
  const { sidebarOpen, activeModule, setActiveModule, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const { isModuleEnabled } = useEnabledModules();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(loadCollapsedGroups);

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      persistCollapsedGroups(next);
      return next;
    });
  }, []);

  // Auto-expand group when navigating to a module inside a collapsed group
  useEffect(() => {
    setCollapsedGroups((prev) => {
      const group = sidebarGroups.find((g) =>
        g.items.some((item) => item.id === activeModule)
      );
      if (group && prev.has(group.id)) {
        const next = new Set(prev);
        next.delete(group.id);
        persistCollapsedGroups(next);
        return next;
      }
      return prev;
    });
  }, [activeModule]);

  // Filter groups and items by permissions
  const visibleGroups = sidebarGroups
    .filter((group) => {
      if (group.adminOnly && !isSuperAdmin) return false;
      return group.items.some((item) => {
        if (item.adminOnly && !isSuperAdmin) return false;
        if (item.permission && !hasPermission(item.permission)) return false;
        if (!isModuleEnabled(item.moduleKey)) return false;
        return true;
      });
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.adminOnly && !isSuperAdmin) return false;
        if (item.permission && !hasPermission(item.permission)) return false;
        if (!isModuleEnabled(item.moduleKey)) return false;
        return true;
      }),
    }));

  return (
    <aside
      className={cn(
        'bg-gradient-to-b from-gray-900 via-brand-950 to-gray-900 flex flex-col transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
          M
        </div>
        {sidebarOpen && (
          <div>
            <h2 className="text-white font-bold text-sm">MPOS</h2>
            <p className="text-gray-400 text-xs">نظام المبيعات الشامل</p>
          </div>
        )}
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {visibleGroups.map((group, idx) => {
          const isOpen = !collapsedGroups.has(group.id);
          const hasActiveItem = group.items.some(
            (item) => item.id === activeModule
          );

          return (
            <div key={group.id} className={cn(idx === 0 && '-mt-1')}>
              <SidebarGroupHeader
                icon={group.icon}
                label={group.label}
                sidebarCollapsed={!sidebarOpen}
                isOpen={isOpen}
                onToggle={() => toggleGroup(group.id)}
                hasActiveItem={hasActiveItem}
              />

              {/* Animated collapse/expand using CSS grid trick */}
              <div
                className="grid transition-[grid-template-rows] duration-200 ease-out"
                style={{
                  gridTemplateRows: isOpen || !sidebarOpen ? '1fr' : '0fr',
                }}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-0.5 pb-0.5">
                    {group.items.map((item) => (
                      <SidebarItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        active={activeModule === item.id}
                        onClick={() => setActiveModule(item.id)}
                        badge={item.badge}
                        collapsed={!sidebarOpen}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <div className="p-3">
        <button
          onClick={toggleSidebar}
          className="w-full py-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
        >
          {sidebarOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}

export { modules };