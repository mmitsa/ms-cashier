import {
  ShoppingCart, Package, Users, BarChart3, Settings, Home,
  Receipt, DollarSign, Warehouse, UserCheck, Building2,
  ChevronRight, ChevronLeft, FileText, Shield, Fingerprint, Banknote,
  GitBranch, ClipboardCheck, UtensilsCrossed, ChefHat, MapPin, QrCode, CreditCard,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { MODULE_PERMISSIONS, type PermissionKey } from '@/lib/permissions/permissions';
import { hasPermission } from '@/lib/permissions/usePermissions';

interface ModuleItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  adminOnly?: boolean;
  permission?: PermissionKey;
}

const modules: ModuleItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: Home, permission: MODULE_PERMISSIONS.dashboard },
  { id: 'pos', label: 'نقطة البيع', icon: ShoppingCart, permission: MODULE_PERMISSIONS.pos },
  { id: 'inventory', label: 'المخزون', icon: Package, permission: MODULE_PERMISSIONS.inventory },
  { id: 'sales', label: 'المبيعات', icon: Receipt, permission: MODULE_PERMISSIONS.sales },
  { id: 'customers', label: 'العملاء والموردين', icon: Users, permission: MODULE_PERMISSIONS.customers },
  { id: 'finance', label: 'الحسابات والخزينة', icon: DollarSign, permission: MODULE_PERMISSIONS.finance },
  { id: 'reports', label: 'التقارير', icon: BarChart3, permission: MODULE_PERMISSIONS.reports },
  { id: 'warehouses', label: 'المخازن', icon: Warehouse, permission: MODULE_PERMISSIONS.warehouses },
  { id: 'employees', label: 'الموظفين', icon: UserCheck, permission: MODULE_PERMISSIONS.employees },
  { id: 'attendance', label: 'الحضور والانصراف', icon: Fingerprint, permission: MODULE_PERMISSIONS.attendance },
  { id: 'payroll', label: 'الرواتب والشيكات', icon: Banknote, permission: MODULE_PERMISSIONS.payroll },
  { id: 'floor-plan', label: 'مناطق التشغيل', icon: MapPin, permission: MODULE_PERMISSIONS.waiter },
  { id: 'qr-codes', label: 'QR طلب العملاء', icon: QrCode, permission: MODULE_PERMISSIONS.waiter },
  { id: 'payment-terminals', label: 'ماكينات الدفع', icon: CreditCard, permission: MODULE_PERMISSIONS.settings },
  { id: 'waiter', label: 'الويتر / الطلبات', icon: UtensilsCrossed, permission: MODULE_PERMISSIONS.waiter },
  { id: 'kitchen', label: 'شاشة المطبخ', icon: ChefHat, permission: MODULE_PERMISSIONS.kitchen },
  { id: 'branches', label: 'إدارة الفروع', icon: GitBranch, permission: MODULE_PERMISSIONS.branches },
  { id: 'users', label: 'إدارة المستخدمين', icon: Shield },
  { id: 'tenants', label: 'إدارة المتاجر', icon: Building2, adminOnly: true },
  { id: 'subscriptions', label: 'طلبات الاشتراك', icon: FileText, adminOnly: true },
  { id: 'branchRequests', label: 'طلبات الفروع', icon: ClipboardCheck, adminOnly: true },
  { id: 'settings', label: 'الإعدادات', icon: Settings, permission: MODULE_PERMISSIONS.settings },
];

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
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
        collapsed && 'justify-center px-0',
        active
          ? 'bg-white text-brand-900 shadow-sm border border-gray-100'
          : 'text-gray-400 hover:text-white hover:bg-white/10'
      )}
    >
      <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
      {!collapsed && <span className="flex-1 text-right">{label}</span>}
      {!collapsed && badge && badge > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  const { sidebarOpen, activeModule, setActiveModule, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin';

  const visibleModules = modules.filter((m) => {
    if (m.adminOnly && !isSuperAdmin) return false;
    if (m.permission && !hasPermission(m.permission)) return false;
    return true;
  });

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
            <h2 className="text-white font-bold text-sm">MS Cashier</h2>
            <p className="text-gray-400 text-xs">نظام المبيعات الشامل</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {visibleModules.map((mod) => (
          <SidebarItem
            key={mod.id}
            icon={mod.icon}
            label={mod.label}
            active={activeModule === mod.id}
            onClick={() => setActiveModule(mod.id)}
            badge={mod.badge}
            collapsed={!sidebarOpen}
          />
        ))}
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
