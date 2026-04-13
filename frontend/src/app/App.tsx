import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api/client';
import {
  Lock, CreditCard, WifiOff, RefreshCw, CloudOff, Cloud,
  LogOut, User, Calculator, Receipt, Users as UsersIcon, BarChart3,
  Printer, Scale, Search, ScanBarcode, Clock, Maximize, Minimize,
  ShoppingCart, ChevronDown,
} from 'lucide-react';
import { LandingPage } from '@/features/landing/LandingPage';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { POSScreen } from '@/features/pos/components/POSScreen';
import { DashboardScreen } from '@/features/dashboard/components/DashboardScreen';
import { InventoryScreen } from '@/features/inventory/components/InventoryScreen';
import { SalesScreen } from '@/features/sales/components/SalesScreen';
import { CustomersScreen } from '@/features/customers/components/CustomersScreen';
import { FinanceScreen } from '@/features/finance/components/FinanceScreen';
import { ReportsScreen } from '@/features/reports/components/ReportsScreen';
import { WarehousesScreen } from '@/features/warehouses/components/WarehousesScreen';
import { UnitsScreen } from '@/features/units/components/UnitsScreen';
import { SalesRepsScreen } from '@/features/sales-reps/components/SalesRepsScreen';
import { EmployeesScreen } from '@/features/employees/components/EmployeesScreen';
import { SettingsScreen } from '@/features/settings/components/SettingsScreen';
import { TenantsScreen } from '@/features/tenants/components/TenantsScreen';
import { SubscriptionRequestsScreen } from '@/features/subscriptions/components/SubscriptionRequestsScreen';
import { UserManagementScreen } from '@/features/users/components/UserManagementScreen';
import { AttendanceScreen } from '@/features/attendance/components/AttendanceScreen';
import { PayrollScreen } from '@/features/payroll/components/PayrollScreen';
import { BranchesScreen } from '@/features/branches/components/BranchesScreen';
import { AdminBranchRequestsScreen } from '@/features/branches/components/AdminBranchRequestsScreen';
import { LoyaltySettingsScreen } from '@/features/loyalty/components/LoyaltySettingsScreen';
import { WaiterScreen } from '@/features/waiter/components/WaiterScreen';
import { KitchenDisplayScreen } from '@/features/waiter/components/KitchenDisplayScreen';
import FloorPlanScreen from '@/features/floor/components/FloorPlanScreen';
import QrManagementScreen from '@/features/qr/components/QrManagementScreen';
import TerminalManagementScreen from '@/features/terminals/components/TerminalManagementScreen';
import CustomerOrderApp from '@/features/customer/components/CustomerOrderApp';
import CustomerDisplayPage from '@/features/customer-display/CustomerDisplayPage';
import { SocialMediaScreen } from '@/features/social-media/components/SocialMediaScreen';
import { StoreBuilderScreen } from '@/features/online-store/components/StoreBuilderScreen';
import { RfidManagementScreen } from '@/features/rfid-inventory/components/RfidManagementScreen';
import { ApiManagementScreen } from '@/features/api-management/components/ApiManagementScreen';
import { initSyncEngine, destroySyncEngine, syncAll, onSyncStatusChange, type SyncStatus } from '@/lib/offline/syncEngine';
import { hasPermission } from '@/lib/permissions/usePermissions';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { InstallPrompt } from '@/components/ui/InstallPrompt';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

// ═══════════════════════════════════════════════════════════
// Console (Admin) Module Map
// ═══════════════════════════════════════════════════════════

const consoleModules: Record<string, React.FC> = {
  dashboard: DashboardScreen,
  pos: POSScreen,
  inventory: InventoryScreen,
  sales: SalesScreen,
  customers: CustomersScreen,
  finance: FinanceScreen,
  reports: ReportsScreen,
  warehouses: WarehousesScreen,
  units: UnitsScreen,
  'sales-reps': SalesRepsScreen,
  employees: EmployeesScreen,
  attendance: AttendanceScreen,
  payroll: PayrollScreen,
  settings: SettingsScreen,
  tenants: TenantsScreen,
  subscriptions: SubscriptionRequestsScreen,
  users: UserManagementScreen,
  'floor-plan': FloorPlanScreen,
  'qr-codes': QrManagementScreen,
  'payment-terminals': TerminalManagementScreen,
  waiter: WaiterScreen,
  kitchen: KitchenDisplayScreen,
  branches: BranchesScreen,
  branchRequests: AdminBranchRequestsScreen,
  loyalty: LoyaltySettingsScreen,
  'social-media': SocialMediaScreen,
  'store-builder': StoreBuilderScreen,
  'rfid-inventory': RfidManagementScreen,
  'api-management': ApiManagementScreen,
};

// ═══════════════════════════════════════════════════════════
// Offline Status Bar (shared)
// ═══════════════════════════════════════════════════════════

function OfflineStatusBar({ compact = false }: { compact?: boolean }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    initSyncEngine();
    const unsub = onSyncStatusChange(setSyncStatus);
    return () => { unsub(); destroySyncEngine(); };
  }, []);

  if (!syncStatus) return null;
  if (syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.pendingCount === 0) return null;

  if (compact) {
    // Compact mode for cashier toolbar
    return (
      <div className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg ${
        !syncStatus.isOnline ? 'bg-amber-500 text-white' : syncStatus.isSyncing ? 'bg-blue-500 text-white' : 'bg-amber-100 text-amber-800'
      }`}>
        {!syncStatus.isOnline ? <><WifiOff size={11} /> أوفلاين</> :
         syncStatus.isSyncing ? <><RefreshCw size={11} className="animate-spin" /> مزامنة</> :
         <><CloudOff size={11} /> {syncStatus.pendingCount}</>}
      </div>
    );
  }

  return (
    <div className={`px-4 py-1.5 flex items-center justify-between text-xs shrink-0 ${
      !syncStatus.isOnline ? 'bg-amber-500 text-white' :
      syncStatus.isSyncing ? 'bg-blue-500 text-white' :
      syncStatus.pendingCount > 0 ? 'bg-amber-100 text-amber-800 border-b border-amber-200' :
      'bg-green-100 text-green-800'
    }`}>
      <div className="flex items-center gap-2">
        {!syncStatus.isOnline ? (
          <><WifiOff size={13} /> <span className="font-bold">أوفلاين</span> — يتم حفظ البيانات محلياً وستُزامَن عند عودة الإنترنت</>
        ) : syncStatus.isSyncing ? (
          <><RefreshCw size={13} className="animate-spin" /> <span className="font-bold">جارٍ المزامنة...</span> {syncStatus.currentItem && `(${syncStatus.currentItem})`}</>
        ) : syncStatus.pendingCount > 0 ? (
          <><CloudOff size={13} /> <span className="font-bold">{syncStatus.pendingCount} عنصر بانتظار المزامنة</span></>
        ) : (
          <><Cloud size={13} /> متصل</>
        )}
      </div>
      <div className="flex items-center gap-2">
        {syncStatus.syncedCount > 0 && <span className="opacity-70">تمت مزامنة {syncStatus.syncedCount}</span>}
        {syncStatus.isOnline && syncStatus.pendingCount > 0 && !syncStatus.isSyncing && (
          <button onClick={() => syncAll()} className="px-2 py-0.5 bg-white/20 rounded font-bold hover:bg-white/30 transition">مزامنة الآن</button>
        )}
        {syncStatus.lastSyncAt && (
          <span className="opacity-60">آخر مزامنة: {new Date(syncStatus.lastSyncAt).toLocaleTimeString('ar-SA')}</span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Trial / Expired Banner (shared)
// ═══════════════════════════════════════════════════════════

function TrialBanner() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: tenantData } = useQuery({
    queryKey: ['my-tenant-status'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/dashboard', { params: { date: new Date().toISOString() } });
        return res.data;
      } catch (err: any) {
        if (err?.response?.status === 403) {
          const msg = err?.response?.data?.errors?.[0] || '';
          if (msg.includes('انتهت') || msg.includes('Expired') || msg.includes('إيقاف') || msg.includes('تجريبية'))
            return { __expired: true, __message: msg };
        }
        return null;
      }
    },
    retry: false, staleTime: 60_000,
    enabled: !!user && user.role !== 'SuperAdmin',
  });

  if (!tenantData || user?.role === 'SuperAdmin') return null;
  if (!(tenantData as any)?.__expired) return null;

  const msg = (tenantData as any).__message || 'انتهت الفترة التجريبية';
  return (
    <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3">
        <Lock size={18} />
        <div>
          <p className="font-bold text-sm">{msg}</p>
          <p className="text-red-200 text-xs">تواصل مع الإدارة لدفع الاشتراك وإعادة التفعيل.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a href="tel:+966500000000" className="px-4 py-1.5 bg-white text-red-600 font-bold rounded-lg text-xs hover:bg-red-50 transition flex items-center gap-1">
          <CreditCard size={14} /> تواصل للدفع
        </a>
        <button onClick={() => { logout(); window.location.reload(); }} className="px-4 py-1.5 border border-white/30 text-white rounded-lg text-xs hover:bg-white/10 transition">خروج</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CASHIER LAYOUT — Full-screen POS with compact toolbar
// ═══════════════════════════════════════════════════════════

function CashierLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showMenu, setShowMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200" dir="rtl"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif" }}>

      {/* ── Cashier Top Bar ── */}
      <div className="h-12 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0">
        {/* Left: Logo + Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xs">M</div>
            <span className="font-bold text-sm hidden sm:inline">MPOS</span>
          </div>
          <div className="w-px h-5 bg-gray-700" />
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <ShoppingCart size={13} />
            <span className="font-medium">نقطة البيع</span>
          </div>
          <OfflineStatusBar compact />
        </div>

        {/* Center: Clock */}
        <div className="flex items-center gap-2.5">
          <Clock size={16} className="text-brand-400" />
          <span className="font-mono font-bold text-base text-white tracking-wide">{timeStr}</span>
          <span className="text-gray-300 text-sm font-medium hidden sm:inline">• {dateStr}</span>
        </div>

        {/* Right: Quick tools + User */}
        <div className="flex items-center gap-1.5">
          {/* Quick tool buttons */}
          <button onClick={toggleFullscreen} title={isFullscreen ? 'خروج ملء الشاشة' : 'ملء الشاشة'}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition">
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* User */}
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 transition">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-[10px]">
                {(user?.fullName || 'م')[0]}
              </div>
              <span className="text-xs font-medium text-gray-300 hidden md:inline">{user?.fullName}</span>
              <ChevronDown size={12} className="text-gray-500" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute left-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:shadow-dark-soft border border-gray-100 dark:border-gray-700 z-50 py-1 text-gray-900 dark:text-gray-100" dir="rtl">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user?.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">@{user?.username}</p>
                    <p className="text-[10px] text-brand-600 dark:text-brand-400 font-bold mt-0.5">كاشير</p>
                  </div>
                  <button onClick={() => { logout(); window.location.reload(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition">
                    <LogOut size={15} /> تسجيل الخروج
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Install Prompt + Trial Banner ── */}
      <InstallPrompt />
      <TrialBanner />

      {/* ── POS Content (full screen) ── */}
      <div className="flex-1 overflow-hidden">
        <POSScreen />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ADMIN CONSOLE LAYOUT — Sidebar + Header + Content
// ═══════════════════════════════════════════════════════════

function ConsoleLayout() {
  const activeModule = useUIStore((s) => s.activeModule);
  const user = useAuthStore((s) => s.user);

  // If user navigates to POS in console mode, show it in console context
  const ActiveComponent = consoleModules[activeModule] || DashboardScreen;

  // Default to dashboard for non-POS roles
  useEffect(() => {
    if (!user) return;
    const role = user.role;
    // Set initial module based on role
    if (role === 'SuperAdmin' && activeModule === 'pos') {
      useUIStore.getState().setActiveModule('dashboard');
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200" dir="rtl"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif" }}>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <InstallPrompt />
        <OfflineStatusBar />
        <TrialBanner />
        <Header />
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// APP — Routes based on auth + role
// ═══════════════════════════════════════════════════════════

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [showLogin, setShowLogin] = useState(false);

  // Check if this is a customer display page (public, no auth)
  const isCustomerDisplayPage = window.location.pathname === '/customer-display';

  // Check if this is a customer order page (public)
  const isCustomerOrderPage = window.location.pathname.startsWith('/order/');

  // Determine layout: Cashier gets POS-only, everyone else gets console
  const isCashierOnly = user?.role === 'Cashier';

  // If customer display page, render only the customer display
  if (isCustomerDisplayPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <CustomerDisplayPage />
      </QueryClientProvider>
    );
  }

  // If customer order page, render only the customer app
  if (isCustomerOrderPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <CustomerOrderApp />
        <Toaster position="top-center" toastOptions={{ duration: 2000, style: { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } }} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif" }}>
        {isAuthenticated ? (
          isCashierOnly ? <CashierLayout /> : <ConsoleLayout />
        ) : showLogin ? (
          <LoginScreen onBack={() => setShowLogin(false)} />
        ) : (
          <LandingPage onLogin={() => setShowLogin(true)} />
        )}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { direction: 'rtl', fontFamily: "'IBM Plex Sans Arabic', sans-serif", borderRadius: '12px', padding: '12px 16px' },
            success: { style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' } },
            error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
          }}
        />
      </div>
    </QueryClientProvider>
  );
}
