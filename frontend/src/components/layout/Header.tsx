import { Bell, LogOut, ChevronDown, ShoppingCart, LayoutDashboard, Sun, Moon, Languages } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useLocaleStore } from '@/lib/i18n';
import { notificationsApi } from '@/lib/api/endpoints';
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
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const t = useLocaleStore((s) => s.t);
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

        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
          title={locale === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
          className="h-9 px-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs font-bold"
        >
          <Languages size={14} />
          {locale === 'ar' ? 'EN' : 'AR'}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? (t.console?.lightMode ?? 'Light Mode') : (t.console?.darkMode ?? 'Dark Mode')}
          className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <NotificationBell />

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

function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    notificationsApi.getUnreadCount().then(r => { if (r.success) setCount(r.data ?? 0); }).catch(() => {});
    const interval = setInterval(() => {
      notificationsApi.getUnreadCount().then(r => { if (r.success) setCount(r.data ?? 0); }).catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const toggle = async () => {
    if (!open) {
      const r = await notificationsApi.getMine(20);
      if (r.success) setNotifs(r.data ?? []);
    }
    setOpen(!open);
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setCount(0);
    setNotifs(ns => ns.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative">
      <button onClick={toggle} className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
        <Bell size={16} />
        {count > 0 && (
          <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{count > 9 ? '9+' : count}</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">الإشعارات</span>
              {count > 0 && <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline">قراءة الكل</button>}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifs.length === 0 ? (
                <p className="p-6 text-center text-gray-400 text-sm">لا توجد إشعارات</p>
              ) : notifs.map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 ${!n.isRead ? 'bg-brand-50/50 dark:bg-brand-950/30' : ''}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('ar')}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
