import { Bell, LogOut, ChevronDown, ShoppingCart, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { modules } from './Sidebar';
import { hasPermission } from '@/lib/permissions/usePermissions';
import { PERMISSIONS } from '@/lib/permissions/permissions';

const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'مدير النظام',
  Admin: 'مدير المتجر',
  Manager: 'مشرف',
  Cashier: 'كاشير',
  Accountant: 'محاسب',
  Warehouse: 'أمين مستودع',
};

export function Header() {
  const activeModule = useUIStore((s) => s.activeModule);
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showMenu, setShowMenu] = useState(false);

  const currentModule = modules.find((m) => m.id === activeModule);
  const canAccessPOS = hasPermission(PERMISSIONS.pos_access);
  const isInPOS = activeModule === 'pos';
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
      {/* Left: current module name + breadcrumb */}
      <div className="flex items-center gap-3">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base">{currentModule?.label || 'MPOS'}</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">الكونسول الإداري</span>
      </div>

      <div className="flex items-center gap-2">
        {/* POS quick switch button */}
        {canAccessPOS && !isInPOS && (
          <button
            onClick={() => setActiveModule('pos')}
            className="flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition shadow-sm"
          >
            <ShoppingCart size={14} />
            نقطة البيع
          </button>
        )}

        {/* Back to console from POS */}
        {isInPOS && (
          <button
            onClick={() => setActiveModule('dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <LayoutDashboard size={14} />
            الكونسول
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
          className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <button className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Bell size={16} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xs">
              {(user?.fullName || 'م')[0]}
            </div>
            <div className="hidden md:block text-right">
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-tight">{user?.fullName || 'المدير'}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{ROLE_LABELS[user?.role || ''] || user?.role || 'مستخدم'}</p>
            </div>
            <ChevronDown size={12} className="text-gray-400 hidden md:block" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-dark-soft border border-gray-100 dark:border-gray-700 z-50 py-2">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">@{user?.username}</p>
                  <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5 font-medium">{ROLE_LABELS[user?.role || ''] || user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  <LogOut size={16} />
                  تسجيل الخروج
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
