import { apiClient } from './client';
import type {
  ApiResponse, PagedResult, LoginRequest, LoginResponse,
  ProductDto, CreateProductRequest, UpdateProductRequest, ProductSearchRequest,
  CategoryDto, CreateInvoiceRequest, InvoiceDto, InvoiceItemRequest,
  InvoiceSearchRequest, ContactDto, CreateContactRequest,
  WarehouseDto, FinanceAccountDto, FinanceTransactionDto,
  EmployeeDto, CreateEmployeeRequest, InstallmentDto,
  DashboardDto, CreateProductRequest as CreateProduct,
  TenantDto, CreateTenantRequest, UpdateTenantRequest, TenantSearchParams,
  UnitDto, CreateUnitRequest, UpdateUnitRequest,
  SalesRepDto, CreateSalesRepRequest, UpdateSalesRepRequest,
  SalesRepTransactionDto, CollectPaymentRequest, SalesRepCommissionDto, SalesRepSummaryDto,
  ProductWithVariantsDto, SetVariantOptionsRequest, GenerateVariantsRequest, UpdateVariantRequest, ProductVariantDto,
} from '@/types/api.types';

// ==================== Auth ====================
export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data).then(r => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh', { refreshToken }).then(r => r.data),

  changePassword: (oldPassword: string, newPassword: string) =>
    apiClient.post<ApiResponse<boolean>>('/auth/change-password', { oldPassword, newPassword }).then(r => r.data),
};

// ==================== Products ====================
export const productsApi = {
  search: (params: ProductSearchRequest) =>
    apiClient.get<ApiResponse<PagedResult<ProductDto>>>('/products/search', { params }).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<ProductDto>>(`/products/${id}`).then(r => r.data),

  getByBarcode: (barcode: string) =>
    apiClient.get<ApiResponse<ProductDto>>(`/products/barcode/${barcode}`).then(r => r.data),

  create: (data: CreateProductRequest) =>
    apiClient.post<ApiResponse<ProductDto>>('/products', data).then(r => r.data),

  update: (id: number, data: UpdateProductRequest) =>
    apiClient.put<ApiResponse<ProductDto>>(`/products/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/products/${id}`).then(r => r.data),

  getLowStock: () =>
    apiClient.get<ApiResponse<Array<{ id: number; name: string; barcode?: string; quantity: number; minStock: number }>>>('/products/low-stock').then(r => r.data),
};

// ==================== Units ====================
export const unitsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<UnitDto[]>>('/units').then(r => r.data),

  create: (data: CreateUnitRequest) =>
    apiClient.post<ApiResponse<UnitDto>>('/units', data).then(r => r.data),

  update: (id: number, data: UpdateUnitRequest) =>
    apiClient.put<ApiResponse<UnitDto>>(`/units/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/units/${id}`).then(r => r.data),

  convert: (fromUnitId: number, toUnitId: number, quantity: number) =>
    apiClient.get<ApiResponse<number>>('/units/convert', { params: { fromUnitId, toUnitId, quantity } }).then(r => r.data),
};

// ==================== Sales Reps ====================
export const salesRepsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<SalesRepDto[]>>('/sales-reps').then(r => r.data),
  getMine: () =>
    apiClient.get<ApiResponse<SalesRepDto>>('/sales-reps/mine').then(r => r.data),
  getById: (id: number) =>
    apiClient.get<ApiResponse<SalesRepDto>>(`/sales-reps/${id}`).then(r => r.data),
  getSummary: () =>
    apiClient.get<ApiResponse<SalesRepSummaryDto>>('/sales-reps/summary').then(r => r.data),
  create: (data: CreateSalesRepRequest) =>
    apiClient.post<ApiResponse<SalesRepDto>>('/sales-reps', data).then(r => r.data),
  update: (id: number, data: UpdateSalesRepRequest) =>
    apiClient.put<ApiResponse<SalesRepDto>>(`/sales-reps/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/sales-reps/${id}`).then(r => r.data),
  getLedger: (id: number, from?: string, to?: string) =>
    apiClient.get<ApiResponse<SalesRepTransactionDto[]>>(`/sales-reps/${id}/ledger`, { params: { from, to } }).then(r => r.data),
  collectPayment: (id: number, data: CollectPaymentRequest) =>
    apiClient.post<ApiResponse<SalesRepTransactionDto>>(`/sales-reps/${id}/collect-payment`, data).then(r => r.data),
  getCommissions: (id: number) =>
    apiClient.get<ApiResponse<SalesRepCommissionDto[]>>(`/sales-reps/${id}/commissions`).then(r => r.data),
  calculateCommission: (id: number, month: number, year: number) =>
    apiClient.post<ApiResponse<SalesRepCommissionDto>>(`/sales-reps/${id}/commissions/calculate?month=${month}&year=${year}`).then(r => r.data),
  payCommission: (commissionId: number, data: { amount: number; notes?: string }) =>
    apiClient.post<ApiResponse<SalesRepCommissionDto>>(`/sales-reps/commissions/${commissionId}/pay`, data).then(r => r.data),
};

// ==================== Store Settings ====================
export const storeSettingsApi = {
  get: () => apiClient.get<ApiResponse<any>>('/store-settings').then(r => r.data),
  save: (data: any) => apiClient.put<ApiResponse<any>>('/store-settings', data).then(r => r.data),
  getCurrencies: () => apiClient.get<ApiResponse<any[]>>('/store-settings/currencies').then(r => r.data),
  saveCurrency: (id: number | null, data: any) =>
    id ? apiClient.put<ApiResponse<any>>(`/store-settings/currencies/${id}`, data).then(r => r.data)
       : apiClient.post<ApiResponse<any>>('/store-settings/currencies', data).then(r => r.data),
  deleteCurrency: (id: number) => apiClient.delete<ApiResponse<boolean>>(`/store-settings/currencies/${id}`).then(r => r.data),
  getTax: () => apiClient.get<ApiResponse<any>>('/store-settings/tax').then(r => r.data),
  saveTax: (data: any) => apiClient.put<ApiResponse<any>>('/store-settings/tax', data).then(r => r.data),
};

// ==================== Integrations ====================
export const integrationsApi = {
  getCatalog: () => apiClient.get<ApiResponse<any[]>>('/integrations/catalog').then(r => r.data),
  getAll: () => apiClient.get<ApiResponse<any[]>>('/integrations').then(r => r.data),
  save: (id: number | null, data: any) =>
    id ? apiClient.put<ApiResponse<any>>(`/integrations/${id}`, data).then(r => r.data)
       : apiClient.post<ApiResponse<any>>('/integrations', data).then(r => r.data),
  delete: (id: number) => apiClient.delete<ApiResponse<boolean>>(`/integrations/${id}`).then(r => r.data),
  toggle: (id: number) => apiClient.post<ApiResponse<boolean>>(`/integrations/${id}/toggle`).then(r => r.data),
  test: (id: number) => apiClient.post<ApiResponse<boolean>>(`/integrations/${id}/test`).then(r => r.data),
};

// ==================== Notifications ====================
export const notificationsApi = {
  getMine: (limit = 50) => apiClient.get<ApiResponse<any[]>>('/notifications', { params: { limit } }).then(r => r.data),
  getUnreadCount: () => apiClient.get<ApiResponse<number>>('/notifications/unread-count').then(r => r.data),
  markRead: (id: number) => apiClient.post<ApiResponse<boolean>>(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => apiClient.post<ApiResponse<boolean>>('/notifications/read-all').then(r => r.data),
};

// ==================== Categories ====================
export const categoriesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<CategoryDto[]>>('/categories').then(r => r.data),

  create: (data: { name: string; parentId?: number; sortOrder?: number }) =>
    apiClient.post<ApiResponse<CategoryDto>>('/categories', data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/categories/${id}`).then(r => r.data),
};

// ==================== Invoices ====================
export const invoicesApi = {
  createSale: (data: CreateInvoiceRequest) =>
    apiClient.post<ApiResponse<InvoiceDto>>('/invoices/sale', data).then(r => r.data),

  createPurchase: (data: CreateInvoiceRequest) =>
    apiClient.post<ApiResponse<InvoiceDto>>('/invoices/purchase', data).then(r => r.data),

  createReturn: (id: number, items: InvoiceItemRequest[]) =>
    apiClient.post<ApiResponse<InvoiceDto>>(`/invoices/${id}/return`, items).then(r => r.data),

  search: (params: InvoiceSearchRequest) =>
    apiClient.get<ApiResponse<PagedResult<InvoiceDto>>>('/invoices/search', { params }).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<InvoiceDto>>(`/invoices/${id}`).then(r => r.data),
};

// ==================== Contacts ====================
export const contactsApi = {
  search: (params: { search?: string; type?: number; page?: number; pageSize?: number }) =>
    apiClient.get<ApiResponse<PagedResult<ContactDto>>>('/contacts/search', { params }).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<ContactDto>>(`/contacts/${id}`).then(r => r.data),

  create: (data: CreateContactRequest) =>
    apiClient.post<ApiResponse<ContactDto>>('/contacts', data).then(r => r.data),

  update: (id: number, data: CreateContactRequest) =>
    apiClient.put<ApiResponse<ContactDto>>(`/contacts/${id}`, data).then(r => r.data),

  getBalance: (id: number) =>
    apiClient.get<ApiResponse<number>>(`/contacts/${id}/balance`).then(r => r.data),

  recordPayment: (id: number, amount: number, accountId: number) =>
    apiClient.post<ApiResponse<boolean>>(`/contacts/${id}/payment`, { amount, accountId }).then(r => r.data),
};

// ==================== Warehouses ====================
export const warehousesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<WarehouseDto[]>>('/warehouses').then(r => r.data),

  create: (data: { name: string; location?: string; isMain: boolean }) =>
    apiClient.post<ApiResponse<WarehouseDto>>('/warehouses', data).then(r => r.data),

  transfer: (data: { fromWarehouseId: number; toWarehouseId: number; notes?: string; items: Array<{ productId: number; quantity: number }> }) =>
    apiClient.post<ApiResponse<boolean>>('/warehouses/transfer', data).then(r => r.data),
};

// ==================== Inventory ====================
export const inventoryApi = {
  getByWarehouse: (warehouseId: number, search?: string) =>
    apiClient.get<ApiResponse<ProductDto[]>>(`/inventory/${warehouseId}`, { params: { search } }).then(r => r.data),

  adjust: (data: { productId: number; warehouseId: number; newQuantity: number; notes?: string }) =>
    apiClient.post<ApiResponse<boolean>>('/inventory/adjust', data).then(r => r.data),

  getMovements: (productId: number, from: string, to: string, page = 1, pageSize = 50) =>
    apiClient.get<ApiResponse<PagedResult<FinanceTransactionDto>>>(`/inventory/${productId}/movements`, {
      params: { from, to, page, pageSize },
    }).then(r => r.data),

  getProductStock: (productId: number) =>
    apiClient.get<ApiResponse<any[]>>(`/inventory/product/${productId}/stock`).then(r => r.data),

  getDashboard: () =>
    apiClient.get<ApiResponse<any>>('/inventory/dashboard').then(r => r.data),
};

// ==================== Finance ====================
export const financeApi = {
  getAccounts: () =>
    apiClient.get<ApiResponse<FinanceAccountDto[]>>('/finance/accounts').then(r => r.data),

  createAccount: (data: { name: string; accountType: number }) =>
    apiClient.post<ApiResponse<FinanceAccountDto>>('/finance/accounts', data).then(r => r.data),

  getAccount: (id: number) =>
    apiClient.get<ApiResponse<FinanceAccountDto>>(`/finance/accounts/${id}`).then(r => r.data),

  createBankAccount: (data: {
    name: string;
    accountType: number;
    bankName?: string | null;
    accountNumber?: string | null;
    iban?: string | null;
    isPrimary?: boolean;
    initialBalance?: number;
  }) =>
    apiClient.post<ApiResponse<FinanceAccountDto>>('/finance/accounts', data).then(r => r.data),

  updateBankAccount: (id: number, data: {
    name: string;
    accountType: number;
    bankName?: string | null;
    accountNumber?: string | null;
    iban?: string | null;
    isPrimary?: boolean;
  }) =>
    apiClient.put<ApiResponse<FinanceAccountDto>>(`/finance/accounts/${id}`, data).then(r => r.data),

  deactivateAccount: (id: number) =>
    apiClient.post<ApiResponse<boolean>>(`/finance/accounts/${id}/deactivate`, {}).then(r => r.data),

  activateAccount: (id: number) =>
    apiClient.post<ApiResponse<boolean>>(`/finance/accounts/${id}/activate`, {}).then(r => r.data),

  recordTransaction: (data: { accountId: number; transactionType: number; category?: string; amount: number; description?: string }) =>
    apiClient.post<ApiResponse<FinanceTransactionDto>>('/finance/transactions', data).then(r => r.data),

  getTransactions: (params: { accountId?: number; from?: string; to?: string; page?: number; pageSize?: number }) =>
    apiClient.get<ApiResponse<PagedResult<FinanceTransactionDto>>>('/finance/transactions', { params }).then(r => r.data),

  getTotalBalance: () =>
    apiClient.get<ApiResponse<number>>('/finance/total-balance').then(r => r.data),
};

// ==================== Employees ====================
export const employeesApi = {
  getAll: (activeOnly?: boolean) =>
    apiClient.get<ApiResponse<any[]>>('/employees', { params: { activeOnly } }).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/employees/${id}`).then(r => r.data),

  create: (data: any) =>
    apiClient.post<ApiResponse<any>>('/employees', data).then(r => r.data),

  update: (id: number, data: any) =>
    apiClient.put<ApiResponse<any>>(`/employees/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/employees/${id}`).then(r => r.data),
};

// ==================== Salary Config ====================
export const salaryConfigApi = {
  getByEmployee: (employeeId: number) =>
    apiClient.get<ApiResponse<any[]>>(`/salary-configs/employee/${employeeId}`).then(r => r.data),

  create: (data: any) =>
    apiClient.post<ApiResponse<any>>('/salary-configs', data).then(r => r.data),

  update: (id: number, data: any) =>
    apiClient.put<ApiResponse<any>>(`/salary-configs/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/salary-configs/${id}`).then(r => r.data),
};

// ==================== Attendance Devices ====================
export const attendanceDevicesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<any[]>>('/attendance-devices').then(r => r.data),

  save: (id: number | null, data: any) =>
    id ? apiClient.put<ApiResponse<any>>(`/attendance-devices/${id}`, data).then(r => r.data)
       : apiClient.post<ApiResponse<any>>('/attendance-devices', data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/attendance-devices/${id}`).then(r => r.data),

  testConnection: (id: number) =>
    apiClient.post<ApiResponse<boolean>>(`/attendance-devices/${id}/test`).then(r => r.data),

  syncDevice: (id: number) =>
    apiClient.post<ApiResponse<any>>(`/attendance-devices/${id}/sync`).then(r => r.data),

  syncAll: () =>
    apiClient.post<ApiResponse<any>>('/attendance-devices/sync-all').then(r => r.data),
};

// ==================== Attendance ====================
export const attendanceApi = {
  manualPunch: (data: any) =>
    apiClient.post<ApiResponse<any>>('/attendance/punch', data).then(r => r.data),

  getDailySummary: (params: any) =>
    apiClient.get<ApiResponse<any>>('/attendance/daily', { params }).then(r => r.data),

  getMonthSummary: (month: number, year: number, employeeId?: number) =>
    apiClient.get<ApiResponse<any[]>>('/attendance/monthly', { params: { month, year, employeeId } }).then(r => r.data),

  getPunches: (employeeId: number, dateFrom: string, dateTo: string) =>
    apiClient.get<ApiResponse<any[]>>(`/attendance/punches/${employeeId}`, { params: { dateFrom, dateTo } }).then(r => r.data),

  deletePunch: (punchId: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/attendance/punch/${punchId}`).then(r => r.data),
};

// ==================== Payroll ====================
export const payrollApi = {
  generate: (data: { month: number; year: number; employeeIds?: number[] }) =>
    apiClient.post<ApiResponse<any[]>>('/payroll/generate', data).then(r => r.data),

  approve: (payrollIds: number[]) =>
    apiClient.post<ApiResponse<boolean>>('/payroll/approve', { payrollIds }).then(r => r.data),

  pay: (data: any) =>
    apiClient.post<ApiResponse<any>>('/payroll/pay', data).then(r => r.data),

  getAll: (params: any) =>
    apiClient.get<ApiResponse<any>>('/payroll', { params }).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/payroll/${id}`).then(r => r.data),

  getPayslip: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/payroll/${id}/payslip`).then(r => r.data),

  getMonthlyHistory: (year?: number) =>
    apiClient.get<ApiResponse<any[]>>('/payroll/history', { params: { year } }).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/payroll/${id}`).then(r => r.data),
};

// ==================== Installments ====================
export const installmentsApi = {
  getActive: () =>
    apiClient.get<ApiResponse<InstallmentDto[]>>('/installments/active').then(r => r.data),

  create: (data: { invoiceId: number; contactId: number; downPayment: number; numberOfPayments: number; startDate: string }) =>
    apiClient.post<ApiResponse<InstallmentDto>>('/installments', data).then(r => r.data),

  recordPayment: (id: number, paymentNumber: number, amount: number) =>
    apiClient.post<ApiResponse<boolean>>(`/installments/${id}/pay/${paymentNumber}`, { amount }).then(r => r.data),

  getOverdue: () =>
    apiClient.get<ApiResponse<InstallmentDto[]>>('/installments/overdue').then(r => r.data),
};

// ==================== Dashboard ====================
export const dashboardApi = {
  get: (date?: string) =>
    apiClient.get<ApiResponse<DashboardDto>>('/dashboard', { params: { date } }).then(r => r.data),
};

// ==================== Reports ====================
export const reportsApi = {
  sales: (from: string, to: string, categoryId?: number, contactId?: number) =>
    apiClient.get<ApiResponse<any>>('/reports/sales', { params: { from, to, categoryId, contactId } }).then(r => r.data),

  profit: (from: string, to: string, productId?: number) =>
    apiClient.get<ApiResponse<any>>('/reports/profit', { params: { from, to, productId } }).then(r => r.data),
};

// ==================== Admin Tenants ====================
export const tenantsApi = {
  search: (params: TenantSearchParams) =>
    apiClient.get<ApiResponse<PagedResult<TenantDto>>>('/admin/tenants', { params }).then(r => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<TenantDto>>(`/admin/tenants/${id}`).then(r => r.data),

  create: (data: CreateTenantRequest) =>
    apiClient.post<ApiResponse<TenantDto>>('/admin/tenants', data).then(r => r.data),

  update: (id: string, data: UpdateTenantRequest) =>
    apiClient.put<ApiResponse<TenantDto>>(`/admin/tenants/${id}`, data).then(r => r.data),

  suspend: (id: string) =>
    apiClient.post<ApiResponse<boolean>>(`/admin/tenants/${id}/suspend`).then(r => r.data),

  activate: (id: string) =>
    apiClient.post<ApiResponse<boolean>>(`/admin/tenants/${id}/activate`).then(r => r.data),
};

// ==================== Tenant Modules ====================
export type TenantModuleDto = {
  key: string;
  nameAr: string;
  category: string;
  isEnabled: boolean;
  enabledAt?: string | null;
};

export type TenantModuleToggle = { key: string; isEnabled: boolean };

export const tenantModulesApi = {
  getForTenant: (tenantId: string) =>
    apiClient.get<ApiResponse<TenantModuleDto[]>>(`/admin/tenants/${tenantId}/modules`).then(r => r.data),

  updateForTenant: (tenantId: string, modules: TenantModuleToggle[]) =>
    apiClient.put<ApiResponse<TenantModuleDto[]>>(`/admin/tenants/${tenantId}/modules`, { modules }).then(r => r.data),

  getMine: () =>
    apiClient.get<ApiResponse<TenantModuleDto[]>>('/tenant/modules').then(r => r.data),
};

// ==================== Users ====================
export const usersApi = {
  getAll: () =>
    apiClient.get<ApiResponse<any[]>>('/users').then(r => r.data),

  create: (data: { username: string; password: string; fullName: string; phone?: string; email?: string; role: string; permissions?: string[] }) =>
    apiClient.post<ApiResponse<any>>('/users', data).then(r => r.data),

  update: (id: string, data: { fullName?: string; phone?: string; email?: string; role?: string; password?: string }) =>
    apiClient.put<ApiResponse<any>>(`/users/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<boolean>>(`/users/${id}`).then(r => r.data),

  toggleActive: (id: string) =>
    apiClient.post<ApiResponse<boolean>>(`/users/${id}/toggle-active`).then(r => r.data),

  updatePermissions: (id: string, permissions: Array<{ permission: string; isGranted: boolean }>) =>
    apiClient.put<ApiResponse<boolean>>(`/users/${id}/permissions`, permissions).then(r => r.data),
};

// ==================== ZATCA ====================
export const zatcaApi = {
  reportInvoice: (invoiceId: number) =>
    apiClient.post<ApiResponse<boolean>>(`/zatca/${invoiceId}/report`).then(r => r.data),

  clearInvoice: (invoiceId: number) =>
    apiClient.post<ApiResponse<boolean>>(`/zatca/${invoiceId}/clear`).then(r => r.data),

  getQr: (invoiceId: number) =>
    apiClient.get<ApiResponse<string>>(`/zatca/${invoiceId}/qr`).then(r => r.data),

  getXml: (invoiceId: number) =>
    apiClient.get<ApiResponse<string>>(`/zatca/${invoiceId}/xml`).then(r => r.data),
};

// ============================================================
// Branch Management
// ============================================================

export const branchesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<any[]>>('/branches').then(r => r.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/branches/${id}`).then(r => r.data),

  getSummary: () =>
    apiClient.get<ApiResponse<any>>('/branches/summary').then(r => r.data),

  getPlanInfo: () =>
    apiClient.get<ApiResponse<any>>('/branches/plan-info').then(r => r.data),

  update: (id: number, data: any) =>
    apiClient.put<ApiResponse<any>>(`/branches/${id}`, data).then(r => r.data),

  suspend: (id: number) =>
    apiClient.post<ApiResponse<boolean>>(`/branches/${id}/suspend`).then(r => r.data),

  activate: (id: number) =>
    apiClient.post<ApiResponse<boolean>>(`/branches/${id}/activate`).then(r => r.data),

  assignWarehouse: (data: { warehouseId: number; branchId: number }) =>
    apiClient.post<ApiResponse<boolean>>('/branches/assign-warehouse', data).then(r => r.data),

  unassignWarehouse: (warehouseId: number) =>
    apiClient.post<ApiResponse<boolean>>(`/branches/unassign-warehouse/${warehouseId}`).then(r => r.data),

  // Branch requests (tenant-side)
  createRequest: (data: any) =>
    apiClient.post<ApiResponse<any>>('/branches/requests', data).then(r => r.data),

  getMyRequests: () =>
    apiClient.get<ApiResponse<any[]>>('/branches/requests/mine').then(r => r.data),

  recordPayment: (requestId: number, data: { paymentReference: string }) =>
    apiClient.post<ApiResponse<any>>(`/branches/requests/${requestId}/pay`, data).then(r => r.data),
};

// Admin Branch Requests
export const adminBranchRequestsApi = {
  getAll: (page = 1, size = 20, status?: string) =>
    apiClient.get<ApiResponse<any>>('/admin/branch-requests', { params: { page, size, status } }).then(r => r.data),

  review: (requestId: number, data: { approve: boolean; adminNotes?: string }) =>
    apiClient.post<ApiResponse<any>>(`/admin/branch-requests/${requestId}/review`, data).then(r => r.data),

  activate: (requestId: number) =>
    apiClient.post<ApiResponse<any>>(`/admin/branch-requests/${requestId}/activate`).then(r => r.data),
};

// ============================================================
// Restaurant Tables
// ============================================================

export const tablesApi = {
  getAll: (branchId?: number) =>
    apiClient.get<ApiResponse<any[]>>('/tables', { params: branchId ? { branchId } : {} }).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/tables/${id}`).then(r => r.data),

  create: (data: any) =>
    apiClient.post<ApiResponse<any>>('/tables', data).then(r => r.data),

  update: (id: number, data: any) =>
    apiClient.put<ApiResponse<any>>(`/tables/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/tables/${id}`).then(r => r.data),

  updateStatus: (id: number, status: string) =>
    apiClient.put<ApiResponse<any>>(`/tables/${id}/status`, { status }).then(r => r.data),
};

// ============================================================
// Dine / Waiter Orders
// ============================================================

export const dineOrdersApi = {
  create: (data: any) =>
    apiClient.post<ApiResponse<any>>('/dine-orders', data).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/dine-orders/${id}`).then(r => r.data),

  getActive: () =>
    apiClient.get<ApiResponse<any[]>>('/dine-orders/active').then(r => r.data),

  getByTable: (tableId: number) =>
    apiClient.get<ApiResponse<any[]>>(`/dine-orders/table/${tableId}`).then(r => r.data),

  addItems: (id: number, data: any) =>
    apiClient.post<ApiResponse<any>>(`/dine-orders/${id}/add-items`, data).then(r => r.data),

  sendToKitchen: (id: number) =>
    apiClient.post<ApiResponse<any>>(`/dine-orders/${id}/send-kitchen`).then(r => r.data),

  markServed: (id: number) =>
    apiClient.post<ApiResponse<any>>(`/dine-orders/${id}/serve`).then(r => r.data),

  cancel: (id: number) =>
    apiClient.post<ApiResponse<any>>(`/dine-orders/${id}/cancel`).then(r => r.data),

  bill: (id: number, data: any) =>
    apiClient.post<ApiResponse<any>>(`/dine-orders/${id}/bill`, data).then(r => r.data),

  // Kitchen
  getKitchenBoard: () =>
    apiClient.get<ApiResponse<any[]>>('/dine-orders/kitchen').then(r => r.data),

  updateItemStatus: (itemId: number, kitchenStatus: string) =>
    apiClient.put<ApiResponse<boolean>>(`/dine-orders/items/${itemId}/status`, { kitchenStatus }).then(r => r.data),

  markAllReady: (id: number) =>
    apiClient.post<ApiResponse<boolean>>(`/dine-orders/${id}/all-ready`).then(r => r.data),

  getKitchenStats: () =>
    apiClient.get<ApiResponse<any>>('/dine-orders/kitchen/stats').then(r => r.data),

  getCompleted: (limit = 20) =>
    apiClient.get<ApiResponse<any[]>>('/dine-orders/kitchen/completed', { params: { limit } }).then(r => r.data),

  recall: (id: number) =>
    apiClient.post<ApiResponse<boolean>>(`/dine-orders/${id}/recall`).then(r => r.data),
};

// ============================================================
// Floor Sections (Zones)
// ============================================================

export const floorSectionsApi = {
  getOverview: (branchId?: number) =>
    apiClient.get<ApiResponse<any>>('/floor-sections/overview', { params: { branchId } }).then(r => r.data),

  getAll: (branchId?: number) =>
    apiClient.get<ApiResponse<any[]>>('/floor-sections', { params: { branchId } }).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/floor-sections/${id}`).then(r => r.data),

  create: (data: any) =>
    apiClient.post<ApiResponse<any>>('/floor-sections', data).then(r => r.data),

  update: (id: number, data: any) =>
    apiClient.put<ApiResponse<any>>(`/floor-sections/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/floor-sections/${id}`).then(r => r.data),

  reorder: (sectionIds: number[]) =>
    apiClient.post<ApiResponse<boolean>>('/floor-sections/reorder', sectionIds).then(r => r.data),

  assignTable: (sectionId: number, tableId: number) =>
    apiClient.post<ApiResponse<boolean>>(`/floor-sections/${sectionId}/tables/${tableId}`).then(r => r.data),

  removeTable: (sectionId: number, tableId: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/floor-sections/${sectionId}/tables/${tableId}`).then(r => r.data),
};

// ============================================================
// QR Config (store owner)
// ============================================================

export const qrConfigApi = {
  getAll: () => apiClient.get<ApiResponse<any[]>>('/qr-configs').then(r => r.data),
  create: (data: any) => apiClient.post<ApiResponse<any>>('/qr-configs', data).then(r => r.data),
  update: (id: number, data: any) => apiClient.put<ApiResponse<any>>(`/qr-configs/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete<ApiResponse<boolean>>(`/qr-configs/${id}`).then(r => r.data),
  regenerate: (id: number) => apiClient.post<ApiResponse<boolean>>(`/qr-configs/${id}/regenerate`).then(r => r.data),
};

// ============================================================
// Customer Public API (no auth — used by customer-facing app)
// ============================================================

const publicApi = apiClient; // same base URL

export const customerApi = {
  getMenu: (qrCode: string) =>
    publicApi.get<ApiResponse<any>>(`/public/customer/menu/${qrCode}`).then(r => r.data),

  startSession: (qrCode: string, data: any) =>
    publicApi.post<ApiResponse<any>>(`/public/customer/session/${qrCode}`, data).then(r => r.data),

  getCart: (token: string) =>
    publicApi.get<ApiResponse<any>>('/public/customer/cart', { headers: { 'X-Session-Token': token } }).then(r => r.data),

  addToCart: (token: string, data: any) =>
    publicApi.post<ApiResponse<any>>('/public/customer/cart/items', data, { headers: { 'X-Session-Token': token } }).then(r => r.data),

  updateCartItem: (token: string, itemId: number, data: any) =>
    publicApi.put<ApiResponse<any>>(`/public/customer/cart/items/${itemId}`, data, { headers: { 'X-Session-Token': token } }).then(r => r.data),

  removeCartItem: (token: string, itemId: number) =>
    publicApi.delete<ApiResponse<any>>(`/public/customer/cart/items/${itemId}`, { headers: { 'X-Session-Token': token } }).then(r => r.data),

  submitOrder: (token: string, data: any) =>
    publicApi.post<ApiResponse<any>>('/public/customer/order/submit', data, { headers: { 'X-Session-Token': token } }).then(r => r.data),

  getOrderStatus: (token: string, orderId: number) =>
    publicApi.get<ApiResponse<any>>(`/public/customer/order/${orderId}/status`, { headers: { 'X-Session-Token': token } }).then(r => r.data),

  getOrders: (token: string) =>
    publicApi.get<ApiResponse<any[]>>('/public/customer/orders', { headers: { 'X-Session-Token': token } }).then(r => r.data),
};

// ============================================================
// Loyalty — برنامج نقاط الولاء
// ============================================================

export const loyaltyApi = {
  getProgram: () =>
    apiClient.get<ApiResponse<any>>('/loyalty/program').then(r => r.data),

  saveProgram: (data: { name: string; pointsPerCurrency: number; redemptionValue: number; minRedemptionPoints: number; pointsExpireDays: number; isActive: boolean }) =>
    apiClient.post<ApiResponse<any>>('/loyalty/program', data).then(r => r.data),

  getCustomerLoyalty: (contactId: number) =>
    apiClient.get<ApiResponse<any>>(`/loyalty/customer/${contactId}`).then(r => r.data),

  enrollCustomer: (contactId: number) =>
    apiClient.post<ApiResponse<any>>(`/loyalty/customer/${contactId}/enroll`).then(r => r.data),

  earnPoints: (contactId: number, invoiceId: number, totalAmount: number) =>
    apiClient.post<ApiResponse<any>>(`/loyalty/customer/${contactId}/earn`, null, { params: { invoiceId, totalAmount } }).then(r => r.data),

  redeemPoints: (contactId: number, points: number) =>
    apiClient.post<ApiResponse<any>>(`/loyalty/customer/${contactId}/redeem`, { points }).then(r => r.data),

  getTransactions: (contactId: number, page = 1, pageSize = 20) =>
    apiClient.get<ApiResponse<any>>(`/loyalty/customer/${contactId}/transactions`, { params: { page, pageSize } }).then(r => r.data),

  getDashboard: () =>
    apiClient.get<ApiResponse<any>>('/loyalty/dashboard').then(r => r.data),
};

// ============================================================
// Payment Terminals
// ============================================================

export const paymentTerminalsApi = {
  getAll: () => apiClient.get<ApiResponse<any[]>>('/payment-terminals').then(r => r.data),
  getById: (id: number) => apiClient.get<ApiResponse<any>>(`/payment-terminals/${id}`).then(r => r.data),
  create: (data: any) => apiClient.post<ApiResponse<any>>('/payment-terminals', data).then(r => r.data),
  update: (id: number, data: any) => apiClient.put<ApiResponse<any>>(`/payment-terminals/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete<ApiResponse<boolean>>(`/payment-terminals/${id}`).then(r => r.data),
  setDefault: (id: number) => apiClient.post<ApiResponse<boolean>>(`/payment-terminals/${id}/set-default`).then(r => r.data),
  ping: (id: number) => apiClient.post<ApiResponse<boolean>>(`/payment-terminals/${id}/ping`).then(r => r.data),

  // Payment ops
  initiatePayment: (data: any) => apiClient.post<ApiResponse<any>>('/payment-terminals/pay', data).then(r => r.data),
  checkTxnStatus: (txnId: number) => apiClient.get<ApiResponse<any>>(`/payment-terminals/txn/${txnId}/status`).then(r => r.data),
  cancelPayment: (txnId: number) => apiClient.post<ApiResponse<any>>(`/payment-terminals/txn/${txnId}/cancel`).then(r => r.data),
  refundPayment: (txnId: number, amount?: number) => apiClient.post<ApiResponse<any>>(`/payment-terminals/txn/${txnId}/refund`, null, { params: { amount } }).then(r => r.data),

  // History
  getTransactions: (params?: any) => apiClient.get<ApiResponse<any[]>>('/payment-terminals/txn', { params }).then(r => r.data),
  reconcile: (id: number) => apiClient.post<ApiResponse<any>>(`/payment-terminals/${id}/reconcile`).then(r => r.data),
};

// ============================================================
// Subscription Requests
// ============================================================

export const subscriptionsApi = {
  submit: (data: any) => apiClient.post<ApiResponse<any>>('/subscription/request', data).then(r => r.data),
  getAll: (params?: any) => apiClient.get<ApiResponse<any>>('/subscription/requests', { params }).then(r => r.data),
  review: (id: number, data: any) => apiClient.post<ApiResponse<any>>(`/subscription/requests/${id}/review`, data).then(r => r.data),
};

// ============================================================
// Payment Gateways (Admin Config)
// ============================================================

export const paymentGatewayApi = {
  getConfigs: () => apiClient.get<ApiResponse<any[]>>('/payment-gateway/configs').then(r => r.data),
  saveConfig: (data: any) => apiClient.post<ApiResponse<any>>('/payment-gateway/configs', data).then(r => r.data),
  deleteConfig: (id: number) => apiClient.delete<ApiResponse<boolean>>(`/payment-gateway/configs/${id}`).then(r => r.data),
  test: (id: number) => apiClient.post<ApiResponse<any>>(`/payment-gateway/configs/${id}/test`).then(r => r.data),
  initiatePayment: (data: any) => apiClient.post<ApiResponse<any>>('/payment-gateway/pay', data).then(r => r.data),
  checkStatus: (paymentId: number) => apiClient.get<ApiResponse<any>>(`/payment-gateway/pay/${paymentId}/status`).then(r => r.data),
};

// ============================================================
// OTP Service (Admin Config)
// ============================================================

export const otpApi = {
  getConfigs: () => apiClient.get<ApiResponse<any[]>>('/otp/configs').then(r => r.data),
  saveConfig: (data: any) => apiClient.post<ApiResponse<any>>('/otp/configs', data).then(r => r.data),
  deleteConfig: (id: number) => apiClient.delete<ApiResponse<boolean>>(`/otp/configs/${id}`).then(r => r.data),
  test: (id: number) => apiClient.post<ApiResponse<any>>(`/otp/configs/${id}/test`).then(r => r.data),
  send: (data: { phone: string; purpose: string }) => apiClient.post<ApiResponse<any>>('/otp/send', data).then(r => r.data),
  verify: (data: { phone: string; code: string; purpose: string }) => apiClient.post<ApiResponse<any>>('/otp/verify', data).then(r => r.data),
};

// ============================================================
// CSV Import/Export
// ============================================================

export type CsvImportResult = {
  totalRows: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  errors: { row: number; field: string; value: string; message: string }[];
  warnings: string[];
};

export const importExportApi = {
  importProducts: (file: File, warehouseId: number, skipDuplicates = true) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<CsvImportResult>>(
      `/import-export/import/products?warehouseId=${warehouseId}&skipDuplicates=${skipDuplicates}`,
      form, { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data);
  },

  importContacts: (file: File, skipDuplicates = true) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<CsvImportResult>>(
      `/import-export/import/contacts?skipDuplicates=${skipDuplicates}`,
      form, { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data);
  },

  importCategories: (file: File, skipDuplicates = true) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<CsvImportResult>>(
      `/import-export/import/categories?skipDuplicates=${skipDuplicates}`,
      form, { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data);
  },

  exportProducts: (categoryId?: number, activeOnly = true) =>
    apiClient.get('/import-export/export/products', {
      params: { categoryId, activeOnly }, responseType: 'blob',
    }).then(r => r.data),

  exportContacts: (activeOnly = true) =>
    apiClient.get('/import-export/export/contacts', {
      params: { activeOnly }, responseType: 'blob',
    }).then(r => r.data),

  exportCategories: () =>
    apiClient.get('/import-export/export/categories', { responseType: 'blob' }).then(r => r.data),

  downloadTemplate: (type: 'Products' | 'Contacts' | 'Categories') => {
    const typeNum = type === 'Products' ? 1 : type === 'Contacts' ? 2 : 3;
    return apiClient.get(`/import-export/template/${typeNum}`, { responseType: 'blob' }).then(r => r.data);
  },
};

// ============================================================
// Product Variants
// ============================================================

export const productVariantsApi = {
  getProductVariants: (productId: number) =>
    apiClient.get<ApiResponse<ProductWithVariantsDto>>(`/product-variants/${productId}`).then(r => r.data),

  setOptions: (data: SetVariantOptionsRequest) =>
    apiClient.post<ApiResponse<ProductWithVariantsDto>>('/product-variants/options', data).then(r => r.data),

  generate: (data: GenerateVariantsRequest) =>
    apiClient.post<ApiResponse<ProductWithVariantsDto>>('/product-variants/generate', data).then(r => r.data),

  update: (variantId: number, data: UpdateVariantRequest) =>
    apiClient.put<ApiResponse<ProductVariantDto>>(`/product-variants/${variantId}`, data).then(r => r.data),

  delete: (variantId: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/product-variants/${variantId}`).then(r => r.data),

  getByBarcode: (barcode: string) =>
    apiClient.get<ApiResponse<ProductVariantDto>>(`/product-variants/barcode/${barcode}`).then(r => r.data),
};

// ============================================================
// Online Store
// ============================================================

export const onlineStoreApi = {
  // Store settings
  getSettings: () =>
    apiClient.get<ApiResponse<any>>('/online-store').then(r => r.data),

  updateSettings: (data: any) =>
    apiClient.put<ApiResponse<any>>('/online-store', data).then(r => r.data),

  // Banners
  getBanners: () =>
    apiClient.get<ApiResponse<any[]>>('/online-store/banners').then(r => r.data),

  saveBanner: (data: any) =>
    apiClient.post<ApiResponse<any>>('/online-store/banners', data).then(r => r.data),

  deleteBanner: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/online-store/banners/${id}`).then(r => r.data),

  // Orders
  getOrders: (params: { page?: number; pageSize?: number; status?: number; search?: string }) =>
    apiClient.get<ApiResponse<PagedResult<any>>>('/online-store/orders', { params }).then(r => r.data),

  getOrderById: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/online-store/orders/${id}`).then(r => r.data),

  updateOrderStatus: (id: number, status: number) =>
    apiClient.put<ApiResponse<any>>(`/online-store/orders/${id}/status`, { status }).then(r => r.data),

  // Payment configs
  getPaymentConfigs: () =>
    apiClient.get<ApiResponse<any[]>>('/online-store/payment-configs').then(r => r.data),

  savePaymentConfig: (data: any) =>
    apiClient.post<ApiResponse<any>>('/online-store/payment-configs', data).then(r => r.data),

  // Shipping configs
  getShippingConfigs: () =>
    apiClient.get<ApiResponse<any[]>>('/online-store/shipping-configs').then(r => r.data),

  saveShippingConfig: (data: any) =>
    apiClient.post<ApiResponse<any>>('/online-store/shipping-configs', data).then(r => r.data),

  // Dashboard
  getDashboard: () =>
    apiClient.get<ApiResponse<any>>('/online-store/dashboard').then(r => r.data),
};

// ============================================================
// Social Media
// ============================================================

export const socialMediaApi = {
  // Accounts
  getAccounts: () =>
    apiClient.get<ApiResponse<any[]>>('/social-media/accounts').then(r => r.data),

  saveAccount: (data: any) =>
    apiClient.post<ApiResponse<any>>('/social-media/accounts', data).then(r => r.data),

  deleteAccount: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/social-media/accounts/${id}`).then(r => r.data),

  // Posts
  getPosts: (page = 1, pageSize = 20) =>
    apiClient.get<ApiResponse<any>>('/social-media/posts', { params: { page, pageSize } }).then(r => r.data),

  createPost: (data: any) =>
    apiClient.post<ApiResponse<any>>('/social-media/posts', data).then(r => r.data),

  schedulePost: (id: number, scheduledAt: string) =>
    apiClient.post<ApiResponse<any>>(`/social-media/posts/${id}/schedule`, { postId: id, scheduledAt }).then(r => r.data),

  publishPost: (id: number) =>
    apiClient.post<ApiResponse<any>>(`/social-media/posts/${id}/publish`).then(r => r.data),

  // Auto Post Rules
  getAutoRules: () =>
    apiClient.get<ApiResponse<any[]>>('/social-media/auto-rules').then(r => r.data),

  saveAutoRule: (data: any) =>
    apiClient.post<ApiResponse<any>>('/social-media/auto-rules', data).then(r => r.data),

  deleteAutoRule: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/social-media/auto-rules/${id}`).then(r => r.data),
};

// ============================================================
// RFID & QR Inventory
// ============================================================

export const rfidInventoryApi = {
  // RFID Tags
  getTags: (productId?: number) =>
    apiClient.get<ApiResponse<any[]>>('/rfid-inventory/tags', { params: productId ? { productId } : {} }).then(r => r.data),

  createTag: (data: { productId: number; productVariantId?: number; rfidTagId: string; tagType: string; warehouseId?: number; shelfLocation?: string }) =>
    apiClient.post<ApiResponse<any>>('/rfid-inventory/tags', data).then(r => r.data),

  deleteTag: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/rfid-inventory/tags/${id}`).then(r => r.data),

  getTagByRfid: (rfidTagId: string) =>
    apiClient.get<ApiResponse<any>>(`/rfid-inventory/tags/rfid/${rfidTagId}`).then(r => r.data),

  // QR Codes
  getQrCodes: (warehouseId?: number) =>
    apiClient.get<ApiResponse<any[]>>('/rfid-inventory/qr-codes', { params: warehouseId ? { warehouseId } : {} }).then(r => r.data),

  createQrCode: (data: { warehouseId: number; qrType: string; locationCode: string; description?: string }) =>
    apiClient.post<ApiResponse<any>>('/rfid-inventory/qr-codes', data).then(r => r.data),

  deleteQrCode: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/rfid-inventory/qr-codes/${id}`).then(r => r.data),

  generateQrData: (warehouseId: number, type: string, locationCode: string) =>
    apiClient.get<ApiResponse<string>>('/rfid-inventory/qr-codes/generate', { params: { warehouseId, type, locationCode } }).then(r => r.data),

  // Scan Sessions
  startSession: (data: { warehouseId: number; sessionType: string }) =>
    apiClient.post<ApiResponse<any>>('/rfid-inventory/sessions/start', data).then(r => r.data),

  recordScan: (sessionId: number, data: { rfidTagId: string; scannedLocation?: string }) =>
    apiClient.post<ApiResponse<any>>(`/rfid-inventory/sessions/${sessionId}/scan`, data).then(r => r.data),

  completeSession: (sessionId: number) =>
    apiClient.post<ApiResponse<any>>(`/rfid-inventory/sessions/${sessionId}/complete`).then(r => r.data),

  getSessionResults: (sessionId: number) =>
    apiClient.get<ApiResponse<any>>(`/rfid-inventory/sessions/${sessionId}/results`).then(r => r.data),

  getSessions: (params?: { warehouseId?: number; page?: number; pageSize?: number }) =>
    apiClient.get<ApiResponse<any>>('/rfid-inventory/sessions', { params }).then(r => r.data),

  // QR Count
  startQrCount: (warehouseId: number) =>
    apiClient.post<ApiResponse<any>>('/rfid-inventory/qr-count/start', { warehouseId, sessionType: 'qr_count' }).then(r => r.data),

  recordQrScan: (sessionId: number, data: { productId: number; quantity: number }) =>
    apiClient.post<ApiResponse<any>>(`/rfid-inventory/qr-count/${sessionId}/scan`, data).then(r => r.data),

  completeQrCount: (sessionId: number) =>
    apiClient.post<ApiResponse<any>>(`/rfid-inventory/qr-count/${sessionId}/complete`).then(r => r.data),
};

// ============================================================
// Public API Management
// ============================================================

export const publicApiManagementApi = {
  // API Keys
  getKeys: () =>
    apiClient.get<ApiResponse<any[]>>('/api-management/keys').then(r => r.data),

  createKey: (data: { name: string; scopes?: string[]; expiresAt?: string }) =>
    apiClient.post<ApiResponse<any>>('/api-management/keys', data).then(r => r.data),

  revokeKey: (id: number) =>
    apiClient.post<ApiResponse<boolean>>(`/api-management/keys/${id}/revoke`).then(r => r.data),

  // Webhooks
  getWebhooks: () =>
    apiClient.get<ApiResponse<any[]>>('/api-management/webhooks').then(r => r.data),

  createWebhook: (data: { url: string; events: string[] }) =>
    apiClient.post<ApiResponse<any>>('/api-management/webhooks', data).then(r => r.data),

  updateWebhook: (id: number, data: { url?: string; events?: string[]; isActive?: boolean }) =>
    apiClient.put<ApiResponse<any>>(`/api-management/webhooks/${id}`, data).then(r => r.data),

  deleteWebhook: (id: number) =>
    apiClient.delete<ApiResponse<boolean>>(`/api-management/webhooks/${id}`).then(r => r.data),

  getDeliveries: (subscriptionId: number, page = 1, pageSize = 20) =>
    apiClient.get<ApiResponse<any>>(`/api-management/webhooks/${subscriptionId}/deliveries`, { params: { page, pageSize } }).then(r => r.data),

  testWebhook: (subscriptionId: number) =>
    apiClient.post<ApiResponse<any>>(`/api-management/webhooks/${subscriptionId}/test`).then(r => r.data),
};

// ==================== Accounting ====================
export const accountingApi = {
  getTrialBalance: (fromDate: string, toDate: string, branchId?: number) =>
    apiClient.get<ApiResponse<any>>('/accounting/reports/trial-balance', { params: { fromDate, toDate, branchId } }).then(r => r.data),

  getIncomeStatement: (fromDate: string, toDate: string, branchId?: number) =>
    apiClient.get<ApiResponse<any>>('/accounting/reports/income-statement', { params: { fromDate, toDate, branchId } }).then(r => r.data),

  getBalanceSheet: (asOfDate: string, branchId?: number) =>
    apiClient.get<ApiResponse<any>>('/accounting/reports/balance-sheet', { params: { asOfDate, branchId } }).then(r => r.data),

  getContactStatement: (contactId: number, fromDate: string, toDate: string) =>
    apiClient.get<ApiResponse<any>>(`/accounting/reports/contacts/${contactId}/statement`, { params: { fromDate, toDate } }).then(r => r.data),

  // Chart of Accounts (endpoint may not exist yet — UI handles 404 gracefully)
  getChartOfAccounts: () =>
    apiClient.get<ApiResponse<any>>('/accounting/chart-of-accounts').then(r => r.data),

  createChartOfAccount: (payload: {
    parentId: number | null;
    code: string;
    nameAr: string;
    nameEn?: string | null;
    description?: string | null;
  }) =>
    apiClient.post<ApiResponse<any>>('/accounting/chart-of-accounts', payload).then(r => r.data),

  updateChartOfAccount: (id: number, payload: {
    nameAr?: string;
    nameEn?: string | null;
    description?: string | null;
    isActive?: boolean;
  }) =>
    apiClient.patch<ApiResponse<any>>(`/accounting/chart-of-accounts/${id}`, payload).then(r => r.data),
};

// ==================== Posting Failures (Admin) ====================
export const postingFailuresApi = {
  list: (params: { resolved?: boolean; source?: string; page?: number; pageSize?: number }) =>
    apiClient.get<ApiResponse<PagedResult<any>>>('/admin/accounting/posting-failures', { params }).then(r => r.data),

  retry: (id: number) =>
    apiClient.post<ApiResponse<any>>(`/admin/accounting/posting-failures/${id}/retry`).then(r => r.data),

  resolve: (id: number, notes: string) =>
    apiClient.post<ApiResponse<any>>(`/admin/accounting/posting-failures/${id}/resolve`, { notes }).then(r => r.data),
};
