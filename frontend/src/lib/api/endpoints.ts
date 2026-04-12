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
};

// ==================== Finance ====================
export const financeApi = {
  getAccounts: () =>
    apiClient.get<ApiResponse<FinanceAccountDto[]>>('/finance/accounts').then(r => r.data),

  createAccount: (data: { name: string; accountType: number }) =>
    apiClient.post<ApiResponse<FinanceAccountDto>>('/finance/accounts', data).then(r => r.data),

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
