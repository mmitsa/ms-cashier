/**
 * Granular Permissions System
 * Controls access to every screen, action, and report
 */

// ─── Permission Keys ─────────────────────────────────────

export const PERMISSIONS = {
  // Dashboard
  dashboard_view: 'dashboard.view',
  dashboard_stats: 'dashboard.stats',

  // POS
  pos_access: 'pos.access',
  pos_sell: 'pos.sell',
  pos_discount: 'pos.discount',
  pos_return: 'pos.return',
  pos_void: 'pos.void',
  pos_price_override: 'pos.price_override',

  // Inventory / Products
  products_view: 'products.view',
  products_create: 'products.create',
  products_edit: 'products.edit',
  products_delete: 'products.delete',
  products_cost_view: 'products.cost_view',
  products_import: 'products.import',

  // Sales / Invoices
  sales_view: 'sales.view',
  sales_create: 'sales.create',
  sales_return: 'sales.return',
  sales_export: 'sales.export',

  // Customers & Suppliers
  contacts_view: 'contacts.view',
  contacts_create: 'contacts.create',
  contacts_edit: 'contacts.edit',
  contacts_delete: 'contacts.delete',
  contacts_balance: 'contacts.balance',

  // Finance
  finance_view: 'finance.view',
  finance_create_tx: 'finance.create_transaction',
  finance_accounts: 'finance.manage_accounts',

  // Reports
  reports_sales: 'reports.sales',
  reports_profit: 'reports.profit',
  reports_inventory: 'reports.inventory',
  reports_finance: 'reports.finance',
  reports_employees: 'reports.employees',
  reports_export: 'reports.export',

  // Warehouses
  warehouses_view: 'warehouses.view',
  warehouses_manage: 'warehouses.manage',
  warehouses_transfer: 'warehouses.transfer',

  // Employees
  employees_view: 'employees.view',
  employees_manage: 'employees.manage',
  employees_payroll: 'employees.payroll',
  employees_attendance: 'employees.attendance',

  // Branches
  branches_view: 'branches.view',
  branches_manage: 'branches.manage',

  // Waiter / Kitchen
  waiter_access: 'waiter.access',
  kitchen_access: 'kitchen.access',

  // Settings
  settings_view: 'settings.view',
  settings_business: 'settings.business',
  settings_payment: 'settings.payment',
  settings_zatca: 'settings.zatca',

  // User Management (store-level)
  users_view: 'users.view',
  users_manage: 'users.manage',
  users_permissions: 'users.permissions',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Permission Groups (for UI display) ──────────────────

export const PERMISSION_GROUPS = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    permissions: [
      { key: PERMISSIONS.dashboard_view, label: 'عرض لوحة التحكم' },
      { key: PERMISSIONS.dashboard_stats, label: 'عرض الإحصائيات المالية' },
    ],
  },
  {
    id: 'pos',
    label: 'نقطة البيع',
    permissions: [
      { key: PERMISSIONS.pos_access, label: 'الوصول لشاشة البيع' },
      { key: PERMISSIONS.pos_sell, label: 'إتمام عمليات البيع' },
      { key: PERMISSIONS.pos_discount, label: 'منح خصومات' },
      { key: PERMISSIONS.pos_return, label: 'مرتجعات البيع' },
      { key: PERMISSIONS.pos_void, label: 'إلغاء الفواتير' },
      { key: PERMISSIONS.pos_price_override, label: 'تعديل الأسعار يدوياً' },
    ],
  },
  {
    id: 'products',
    label: 'المنتجات والمخزون',
    permissions: [
      { key: PERMISSIONS.products_view, label: 'عرض المنتجات' },
      { key: PERMISSIONS.products_create, label: 'إضافة منتجات' },
      { key: PERMISSIONS.products_edit, label: 'تعديل المنتجات' },
      { key: PERMISSIONS.products_delete, label: 'حذف المنتجات' },
      { key: PERMISSIONS.products_cost_view, label: 'عرض أسعار التكلفة' },
      { key: PERMISSIONS.products_import, label: 'استيراد المنتجات' },
    ],
  },
  {
    id: 'sales',
    label: 'المبيعات',
    permissions: [
      { key: PERMISSIONS.sales_view, label: 'عرض الفواتير' },
      { key: PERMISSIONS.sales_create, label: 'إنشاء فواتير' },
      { key: PERMISSIONS.sales_return, label: 'إرجاع فواتير' },
      { key: PERMISSIONS.sales_export, label: 'تصدير البيانات' },
    ],
  },
  {
    id: 'contacts',
    label: 'العملاء والموردين',
    permissions: [
      { key: PERMISSIONS.contacts_view, label: 'عرض العملاء والموردين' },
      { key: PERMISSIONS.contacts_create, label: 'إضافة عملاء وموردين' },
      { key: PERMISSIONS.contacts_edit, label: 'تعديل البيانات' },
      { key: PERMISSIONS.contacts_delete, label: 'حذف العملاء والموردين' },
      { key: PERMISSIONS.contacts_balance, label: 'عرض الأرصدة' },
    ],
  },
  {
    id: 'finance',
    label: 'الحسابات والخزينة',
    permissions: [
      { key: PERMISSIONS.finance_view, label: 'عرض الحسابات' },
      { key: PERMISSIONS.finance_create_tx, label: 'تسجيل معاملات' },
      { key: PERMISSIONS.finance_accounts, label: 'إدارة الحسابات' },
    ],
  },
  {
    id: 'reports',
    label: 'التقارير',
    permissions: [
      { key: PERMISSIONS.reports_sales, label: 'تقارير المبيعات' },
      { key: PERMISSIONS.reports_profit, label: 'تقارير الأرباح' },
      { key: PERMISSIONS.reports_inventory, label: 'تقارير المخزون' },
      { key: PERMISSIONS.reports_finance, label: 'التقارير المالية' },
      { key: PERMISSIONS.reports_employees, label: 'تقارير الموظفين' },
      { key: PERMISSIONS.reports_export, label: 'تصدير التقارير' },
    ],
  },
  {
    id: 'warehouses',
    label: 'المخازن',
    permissions: [
      { key: PERMISSIONS.warehouses_view, label: 'عرض المخازن' },
      { key: PERMISSIONS.warehouses_manage, label: 'إدارة المخازن' },
      { key: PERMISSIONS.warehouses_transfer, label: 'تحويلات المخزون' },
    ],
  },
  {
    id: 'employees',
    label: 'الموظفين',
    permissions: [
      { key: PERMISSIONS.employees_view, label: 'عرض الموظفين' },
      { key: PERMISSIONS.employees_manage, label: 'إدارة الموظفين' },
      { key: PERMISSIONS.employees_payroll, label: 'الرواتب' },
      { key: PERMISSIONS.employees_attendance, label: 'الحضور والانصراف' },
    ],
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    permissions: [
      { key: PERMISSIONS.settings_view, label: 'عرض الإعدادات' },
      { key: PERMISSIONS.settings_business, label: 'تعديل بيانات المنشأة' },
      { key: PERMISSIONS.settings_payment, label: 'إدارة بوابات الدفع' },
      { key: PERMISSIONS.settings_zatca, label: 'إعدادات زاتكا' },
    ],
  },
  {
    id: 'users',
    label: 'إدارة المستخدمين',
    permissions: [
      { key: PERMISSIONS.users_view, label: 'عرض المستخدمين' },
      { key: PERMISSIONS.users_manage, label: 'إدارة المستخدمين' },
      { key: PERMISSIONS.users_permissions, label: 'تعديل الصلاحيات' },
    ],
  },
];

// ─── Module-to-Permission mapping ────────────────────────

export const MODULE_PERMISSIONS: Record<string, PermissionKey> = {
  dashboard: PERMISSIONS.dashboard_view,
  pos: PERMISSIONS.pos_access,
  inventory: PERMISSIONS.products_view,
  sales: PERMISSIONS.sales_view,
  customers: PERMISSIONS.contacts_view,
  finance: PERMISSIONS.finance_view,
  reports: PERMISSIONS.reports_sales,
  warehouses: PERMISSIONS.warehouses_view,
  employees: PERMISSIONS.employees_view,
  attendance: PERMISSIONS.employees_attendance,
  payroll: PERMISSIONS.employees_payroll,
  branches: PERMISSIONS.branches_view,
  waiter: PERMISSIONS.waiter_access,
  kitchen: PERMISSIONS.kitchen_access,
  settings: PERMISSIONS.settings_view,
};

// ─── Role defaults ───────────────────────────────────────

export const ROLE_DEFAULTS: Record<string, PermissionKey[]> = {
  Admin: Object.values(PERMISSIONS),
  Manager: [
    PERMISSIONS.dashboard_view, PERMISSIONS.dashboard_stats,
    PERMISSIONS.pos_access, PERMISSIONS.pos_sell, PERMISSIONS.pos_discount, PERMISSIONS.pos_return,
    PERMISSIONS.products_view, PERMISSIONS.products_create, PERMISSIONS.products_edit, PERMISSIONS.products_cost_view,
    PERMISSIONS.sales_view, PERMISSIONS.sales_create, PERMISSIONS.sales_return, PERMISSIONS.sales_export,
    PERMISSIONS.contacts_view, PERMISSIONS.contacts_create, PERMISSIONS.contacts_edit, PERMISSIONS.contacts_balance,
    PERMISSIONS.finance_view, PERMISSIONS.finance_create_tx,
    PERMISSIONS.reports_sales, PERMISSIONS.reports_profit, PERMISSIONS.reports_inventory, PERMISSIONS.reports_export,
    PERMISSIONS.warehouses_view, PERMISSIONS.warehouses_transfer,
    PERMISSIONS.employees_view, PERMISSIONS.employees_attendance,
    PERMISSIONS.branches_view,
    PERMISSIONS.settings_view,
    PERMISSIONS.users_view,
  ],
  Cashier: [
    PERMISSIONS.dashboard_view,
    PERMISSIONS.pos_access, PERMISSIONS.pos_sell,
    PERMISSIONS.products_view,
    PERMISSIONS.sales_view,
    PERMISSIONS.contacts_view,
  ],
  Accountant: [
    PERMISSIONS.dashboard_view, PERMISSIONS.dashboard_stats,
    PERMISSIONS.sales_view, PERMISSIONS.sales_export,
    PERMISSIONS.finance_view, PERMISSIONS.finance_create_tx, PERMISSIONS.finance_accounts,
    PERMISSIONS.reports_sales, PERMISSIONS.reports_profit, PERMISSIONS.reports_finance, PERMISSIONS.reports_export,
    PERMISSIONS.contacts_view, PERMISSIONS.contacts_balance,
  ],
  Warehouse: [
    PERMISSIONS.dashboard_view,
    PERMISSIONS.products_view, PERMISSIONS.products_edit,
    PERMISSIONS.warehouses_view, PERMISSIONS.warehouses_manage, PERMISSIONS.warehouses_transfer,
    PERMISSIONS.reports_inventory,
  ],
};
