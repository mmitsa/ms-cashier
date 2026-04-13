import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  productsApi, categoriesApi, invoicesApi, contactsApi,
  warehousesApi, inventoryApi, financeApi, employeesApi,
  installmentsApi, dashboardApi, reportsApi, zatcaApi, authApi,
  tenantsApi, salaryConfigApi, attendanceDevicesApi, attendanceApi, payrollApi,
  branchesApi, adminBranchRequestsApi,
  tablesApi, dineOrdersApi, floorSectionsApi, qrConfigApi, customerApi, paymentTerminalsApi,
  subscriptionsApi, paymentGatewayApi, otpApi, usersApi, unitsApi, salesRepsApi,
} from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import type {
  ProductSearchRequest, CreateProductRequest, UpdateProductRequest,
  CreateInvoiceRequest, InvoiceSearchRequest, InvoiceItemRequest,
  CreateContactRequest, CreateEmployeeRequest, LoginRequest,
  CreateTenantRequest, UpdateTenantRequest, TenantSearchParams,
  CreateUnitRequest, UpdateUnitRequest,
  CreateSalesRepRequest, UpdateSalesRepRequest, CollectPaymentRequest,
} from '@/types/api.types';
import toast from 'react-hot-toast';

// ==================== Query Keys ====================
export const queryKeys = {
  products: {
    all: ['products'] as const,
    search: (params: ProductSearchRequest) => ['products', 'search', params] as const,
    byId: (id: number) => ['products', id] as const,
    byBarcode: (barcode: string) => ['products', 'barcode', barcode] as const,
    lowStock: ['products', 'low-stock'] as const,
  },
  categories: ['categories'] as const,
  invoices: {
    all: ['invoices'] as const,
    search: (params: InvoiceSearchRequest) => ['invoices', 'search', params] as const,
    byId: (id: number) => ['invoices', id] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    search: (params: { search?: string; type?: number }) => ['contacts', 'search', params] as const,
    byId: (id: number) => ['contacts', id] as const,
  },
  warehouses: ['warehouses'] as const,
  inventory: (warehouseId: number) => ['inventory', warehouseId] as const,
  finance: {
    accounts: ['finance', 'accounts'] as const,
    transactions: (params: any) => ['finance', 'transactions', params] as const,
    totalBalance: ['finance', 'total-balance'] as const,
  },
  employees: ['employees'] as const,
  attendanceDevices: ['attendanceDevices'] as const,
  attendance: {
    daily: (params: any) => ['attendance', 'daily', params] as const,
    monthly: (m: number, y: number) => ['attendance', 'monthly', m, y] as const,
    punches: (empId: number) => ['attendance', 'punches', empId] as const,
  },
  salaryConfigs: (empId: number) => ['salaryConfigs', empId] as const,
  payroll: {
    all: (params: any) => ['payroll', params] as const,
    detail: (id: number) => ['payroll', 'detail', id] as const,
    payslip: (id: number) => ['payroll', 'payslip', id] as const,
    history: (year?: number) => ['payroll', 'history', year] as const,
  },
  installments: {
    active: ['installments', 'active'] as const,
    overdue: ['installments', 'overdue'] as const,
  },
  tenants: {
    all: ['tenants'] as const,
    search: (params: TenantSearchParams) => ['tenants', 'search', params] as const,
    byId: (id: string) => ['tenants', id] as const,
  },
  dashboard: (date?: string) => ['dashboard', date] as const,
  branches: {
    all: ['branches'] as const,
    byId: (id: number) => ['branches', id] as const,
    summary: ['branches', 'summary'] as const,
    planInfo: ['branches', 'plan-info'] as const,
    myRequests: ['branches', 'my-requests'] as const,
  },
  adminBranchRequests: {
    all: (params: any) => ['admin-branch-requests', params] as const,
  },
  tables: {
    all: (branchId?: number) => ['tables', branchId] as const,
    byId: (id: number) => ['tables', 'detail', id] as const,
  },
  dineOrders: {
    active: ['dine-orders', 'active'] as const,
    byId: (id: number) => ['dine-orders', id] as const,
    byTable: (tableId: number) => ['dine-orders', 'table', tableId] as const,
    kitchen: ['dine-orders', 'kitchen'] as const,
  },
};

// ==================== Auth ====================
export function useLogin() {
  const login = useAuthStore(s => s.login);
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (res) => {
      if (res.success && res.data) {
        login(res.data.user, res.data.accessToken, res.data.refreshToken);
        toast.success('تم تسجيل الدخول بنجاح');
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.errors?.[0] || 'اسم المستخدم أو كلمة المرور غير صحيحة';
      toast.error(msg);
    },
  });
}

// ==================== Products ====================
export function useProducts(params: ProductSearchRequest = {}) {
  return useQuery({
    queryKey: queryKeys.products.search(params),
    queryFn: () => productsApi.search(params),
    select: (res) => res.data,
    staleTime: 30_000,
  });
}

export function useProductByBarcode(barcode: string) {
  return useQuery({
    queryKey: queryKeys.products.byBarcode(barcode),
    queryFn: () => productsApi.getByBarcode(barcode),
    select: (res) => res.data,
    enabled: !!barcode && barcode.length >= 4,
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: queryKeys.products.lowStock,
    queryFn: () => productsApi.getLowStock(),
    select: (res) => res.data,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductRequest) => productsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم إضافة الصنف بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء إضافة الصنف'),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductRequest }) => productsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تحديث الصنف بنجاح');
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم حذف الصنف');
    },
  });
}

// ==================== Units ====================
export function useUnits() {
  return useQuery({
    queryKey: ['units'],
    queryFn: () => unitsApi.getAll(),
    select: (res) => res.data,
    staleTime: 60_000,
  });
}

export function useCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUnitRequest) => unitsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['units'] }); toast.success('تم إنشاء الوحدة'); },
  });
}

export function useUpdateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUnitRequest }) => unitsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['units'] }); toast.success('تم تحديث الوحدة'); },
  });
}

export function useDeleteUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unitsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['units'] }); toast.success('تم حذف الوحدة'); },
  });
}

// ==================== Sales Reps ====================
export function useSalesReps() {
  return useQuery({ queryKey: ['sales-reps'], queryFn: () => salesRepsApi.getAll(), select: r => r.data, staleTime: 30_000 });
}
export function useSalesRepSummary() {
  return useQuery({ queryKey: ['sales-reps', 'summary'], queryFn: () => salesRepsApi.getSummary(), select: r => r.data });
}
export function useCreateSalesRep() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: CreateSalesRepRequest) => salesRepsApi.create(data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-reps'] }); toast.success('تم إنشاء المندوب'); } });
}
export function useUpdateSalesRep() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: number; data: UpdateSalesRepRequest }) => salesRepsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-reps'] }); toast.success('تم تحديث المندوب'); } });
}
export function useDeleteSalesRep() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => salesRepsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-reps'] }); toast.success('تم حذف المندوب'); } });
}
export function useSalesRepLedger(id: number) {
  return useQuery({ queryKey: ['sales-reps', id, 'ledger'], queryFn: () => salesRepsApi.getLedger(id), select: r => r.data, enabled: !!id });
}
export function useCollectPayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: number; data: CollectPaymentRequest }) => salesRepsApi.collectPayment(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-reps'] }); toast.success('تم تسجيل السداد'); } });
}
export function useSalesRepCommissions(id: number) {
  return useQuery({ queryKey: ['sales-reps', id, 'commissions'], queryFn: () => salesRepsApi.getCommissions(id), select: r => r.data, enabled: !!id });
}

// ==================== Categories ====================
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categoriesApi.getAll(),
    select: (res) => res.data,
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; parentId?: number }) => categoriesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories });
      toast.success('تم إضافة التصنيف');
    },
  });
}

// ==================== Invoices ====================
export function useInvoices(params: InvoiceSearchRequest = {}) {
  return useQuery({
    queryKey: queryKeys.invoices.search(params),
    queryFn: () => invoicesApi.search(params),
    select: (res) => res.data,
    staleTime: 15_000,
  });
}

export function useInvoiceById(id: number) {
  return useQuery({
    queryKey: queryKeys.invoices.byId(id),
    queryFn: () => invoicesApi.getById(id),
    select: (res) => res.data,
    enabled: id > 0,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) => invoicesApi.createSale(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['finance'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم تسجيل الفاتورة بنجاح');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.errors?.[0] || 'حدث خطأ أثناء تسجيل الفاتورة';
      toast.error(msg);
    },
  });
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) => invoicesApi.createPurchase(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تسجيل فاتورة الشراء بنجاح');
    },
  });
}

export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, items }: { invoiceId: number; items: InvoiceItemRequest[] }) =>
      invoicesApi.createReturn(invoiceId, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تسجيل المرتجع بنجاح');
    },
  });
}

// ==================== Contacts ====================
export function useContacts(params: { search?: string; type?: number; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.contacts.search(params),
    queryFn: () => contactsApi.search(params),
    select: (res) => res.data,
    staleTime: 30_000,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactRequest) => contactsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('تم إضافة العميل بنجاح');
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, amount, accountId }: { contactId: number; amount: number; accountId: number }) =>
      contactsApi.recordPayment(contactId, amount, accountId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['finance'] });
      toast.success('تم تسجيل الدفعة بنجاح');
    },
  });
}

// ==================== Warehouses ====================
export function useWarehouses() {
  return useQuery({
    queryKey: queryKeys.warehouses,
    queryFn: () => warehousesApi.getAll(),
    select: (res) => res.data,
    staleTime: 60_000,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; location?: string; isMain: boolean }) => warehousesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouses });
      toast.success('تم إنشاء المخزن');
    },
  });
}

export function useTransferStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: warehousesApi.transfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouses });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('تم نقل البضاعة بنجاح');
    },
  });
}

// ==================== Finance ====================
export function useFinanceAccounts() {
  return useQuery({
    queryKey: queryKeys.finance.accounts,
    queryFn: () => financeApi.getAccounts(),
    select: (res) => res.data,
  });
}

export function useFinanceTransactions(params: { accountId?: number; from?: string; to?: string; page?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.finance.transactions(params),
    queryFn: () => financeApi.getTransactions(params),
    select: (res) => res.data,
  });
}

export function useRecordFinanceTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financeApi.recordTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] });
      toast.success('تم تسجيل المعاملة');
    },
  });
}

// ==================== Employees ====================
export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.employees,
    queryFn: () => employeesApi.getAll(),
    select: (res) => res.data,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmployeeRequest) => employeesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
      toast.success('تم إضافة الموظف');
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => employeesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
      toast.success('تم تحديث بيانات الموظف');
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
      toast.success('تم حذف الموظف');
    },
  });
}

// ==================== Attendance Devices ====================
export function useAttendanceDevices() {
  return useQuery({ queryKey: queryKeys.attendanceDevices, queryFn: () => attendanceDevicesApi.getAll(), select: (r) => r.data });
}
export function useSaveDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: any }) => attendanceDevicesApi.save(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.attendanceDevices }); toast.success('تم حفظ الجهاز'); },
  });
}
export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attendanceDevicesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.attendanceDevices }); toast.success('تم حذف الجهاز'); },
  });
}
export function useTestDevice() {
  return useMutation({ mutationFn: (id: number) => attendanceDevicesApi.testConnection(id) });
}
export function useSyncDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attendanceDevicesApi.syncDevice(id),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: queryKeys.attendanceDevices }); toast.success(res.message || 'تمت المزامنة'); },
  });
}
export function useSyncAllDevices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceDevicesApi.syncAll(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.attendanceDevices }); toast.success('تمت مزامنة جميع الأجهزة'); },
  });
}

// ==================== Attendance ====================
export function useAttendanceDailySummary(params: any) {
  return useQuery({ queryKey: queryKeys.attendance.daily(params), queryFn: () => attendanceApi.getDailySummary(params), select: (r) => r.data });
}
export function useAttendanceMonthSummary(month: number, year: number) {
  return useQuery({ queryKey: queryKeys.attendance.monthly(month, year), queryFn: () => attendanceApi.getMonthSummary(month, year), select: (r) => r.data });
}
export function useManualPunch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => attendanceApi.manualPunch(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance'] }); toast.success('تم تسجيل البصمة'); },
  });
}
export function useDeletePunch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attendanceApi.deletePunch(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance'] }); toast.success('تم حذف السجل'); },
  });
}

// ==================== Salary Config ====================
export function useSalaryConfigs(employeeId: number) {
  return useQuery({ queryKey: queryKeys.salaryConfigs(employeeId), queryFn: () => salaryConfigApi.getByEmployee(employeeId), select: (r) => r.data, enabled: employeeId > 0 });
}
export function useSaveSalaryConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: any }) => id ? salaryConfigApi.update(id, data) : salaryConfigApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salaryConfigs'] }); toast.success('تم حفظ البند'); },
  });
}
export function useDeleteSalaryConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => salaryConfigApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salaryConfigs'] }); toast.success('تم حذف البند'); },
  });
}

// ==================== Payroll ====================
export function useGeneratePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { month: number; year: number; employeeIds?: number[] }) => payrollApi.generate(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payroll'] }); toast.success('تم إنشاء كشف الرواتب'); },
  });
}
export function useApprovePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => payrollApi.approve(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payroll'] }); toast.success('تم اعتماد كشف الرواتب'); },
  });
}
export function usePayPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => payrollApi.pay(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payroll'] }); toast.success('تم إصدار الشيك'); },
  });
}
export function usePayrolls(params: any) {
  return useQuery({ queryKey: queryKeys.payroll.all(params), queryFn: () => payrollApi.getAll(params), select: (r) => r.data });
}
export function usePayrollDetail(id: number) {
  return useQuery({ queryKey: queryKeys.payroll.detail(id), queryFn: () => payrollApi.getById(id), select: (r) => r.data, enabled: id > 0 });
}
export function usePayslip(id: number) {
  return useQuery({ queryKey: queryKeys.payroll.payslip(id), queryFn: () => payrollApi.getPayslip(id), select: (r) => r.data, enabled: id > 0 });
}
export function usePayrollHistory(year?: number) {
  return useQuery({ queryKey: queryKeys.payroll.history(year), queryFn: () => payrollApi.getMonthlyHistory(year), select: (r) => r.data });
}
export function useDeletePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => payrollApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payroll'] }); toast.success('تم حذف كشف الراتب'); },
  });
}

// ==================== Installments ====================
export function useActiveInstallments() {
  return useQuery({
    queryKey: queryKeys.installments.active,
    queryFn: () => installmentsApi.getActive(),
    select: (res) => res.data,
  });
}

export function useOverdueInstallments() {
  return useQuery({
    queryKey: queryKeys.installments.overdue,
    queryFn: () => installmentsApi.getOverdue(),
    select: (res) => res.data,
  });
}

// ==================== Dashboard ====================
export function useDashboard(date?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard(date),
    queryFn: () => dashboardApi.get(date),
    select: (res) => res.data,
    refetchInterval: 60_000, // refresh every minute
  });
}

// ==================== Tenants (SuperAdmin) ====================
export function useTenants(params: TenantSearchParams = {}) {
  return useQuery({
    queryKey: queryKeys.tenants.search(params),
    queryFn: () => tenantsApi.search(params),
    select: (res) => res.data,
    staleTime: 30_000,
  });
}

export function useTenantById(id: string) {
  return useQuery({
    queryKey: queryKeys.tenants.byId(id),
    queryFn: () => tenantsApi.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantRequest) => tenantsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('تم إنشاء المتجر بنجاح');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.errors?.[0] || 'حدث خطأ أثناء إنشاء المتجر';
      toast.error(msg);
    },
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantRequest }) => tenantsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('تم تحديث بيانات المتجر');
    },
    onError: () => toast.error('حدث خطأ أثناء تحديث المتجر'),
  });
}

export function useSuspendTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.suspend(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('تم إيقاف المتجر');
    },
    onError: () => toast.error('حدث خطأ أثناء إيقاف المتجر'),
  });
}

export function useActivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('تم تفعيل المتجر');
    },
    onError: () => toast.error('حدث خطأ أثناء تفعيل المتجر'),
  });
}

// ==================== ZATCA ====================
export function useReportToZatca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) => zatcaApi.reportInvoice(invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('تم إرسال الفاتورة لمنصة زاتكا بنجاح');
    },
    onError: () => toast.error('فشل إرسال الفاتورة لزاتكا'),
  });
}

// ============================================================
// Branches
// ============================================================

export function useBranches() {
  return useQuery({ queryKey: queryKeys.branches.all, queryFn: () => branchesApi.getAll() });
}

export function useBranchById(id: number) {
  return useQuery({ queryKey: queryKeys.branches.byId(id), queryFn: () => branchesApi.getById(id), enabled: id > 0 });
}

export function useBranchSummary() {
  return useQuery({ queryKey: queryKeys.branches.summary, queryFn: () => branchesApi.getSummary() });
}

export function useBranchPlanInfo() {
  return useQuery({ queryKey: queryKeys.branches.planInfo, queryFn: () => branchesApi.getPlanInfo() });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => branchesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.branches.all }); toast.success('تم تحديث الفرع'); },
    onError: () => toast.error('فشل تحديث الفرع'),
  });
}

export function useSuspendBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => branchesApi.suspend(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.branches.all }); toast.success('تم تعليق الفرع'); },
    onError: () => toast.error('فشل تعليق الفرع'),
  });
}

export function useActivateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => branchesApi.activate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.branches.all }); toast.success('تم تفعيل الفرع'); },
    onError: () => toast.error('فشل تفعيل الفرع'),
  });
}

export function useAssignWarehouseToBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { warehouseId: number; branchId: number }) => branchesApi.assignWarehouse(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.branches.all }); toast.success('تم تخصيص المخزن'); },
    onError: () => toast.error('فشل تخصيص المخزن'),
  });
}

export function useUnassignWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (warehouseId: number) => branchesApi.unassignWarehouse(warehouseId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.branches.all }); toast.success('تم إلغاء تخصيص المخزن'); },
    onError: () => toast.error('فشل إلغاء تخصيص المخزن'),
  });
}

export function useCreateBranchRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => branchesApi.createRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.branches.myRequests });
      qc.invalidateQueries({ queryKey: queryKeys.branches.summary });
      toast.success('تم إرسال طلب فتح الفرع');
    },
    onError: () => toast.error('فشل إرسال الطلب'),
  });
}

export function useMyBranchRequests() {
  return useQuery({ queryKey: queryKeys.branches.myRequests, queryFn: () => branchesApi.getMyRequests() });
}

export function useRecordBranchPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: number; data: { paymentReference: string } }) =>
      branchesApi.recordPayment(requestId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.branches.myRequests });
      qc.invalidateQueries({ queryKey: queryKeys.branches.all });
      qc.invalidateQueries({ queryKey: queryKeys.branches.summary });
      toast.success('تم تسجيل الدفع وتفعيل الفرع');
    },
    onError: () => toast.error('فشل تسجيل الدفع'),
  });
}

// Admin Branch Requests
export function useAdminBranchRequests(page = 1, size = 20, status?: string) {
  return useQuery({
    queryKey: queryKeys.adminBranchRequests.all({ page, size, status }),
    queryFn: () => adminBranchRequestsApi.getAll(page, size, status),
  });
}

export function useReviewBranchRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: number; data: { approve: boolean; adminNotes?: string } }) =>
      adminBranchRequestsApi.review(requestId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-branch-requests'] }); toast.success('تم مراجعة الطلب'); },
    onError: () => toast.error('فشل مراجعة الطلب'),
  });
}

export function useAdminActivateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => adminBranchRequestsApi.activate(requestId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-branch-requests'] }); toast.success('تم تفعيل الفرع'); },
    onError: () => toast.error('فشل تفعيل الفرع'),
  });
}

// ============================================================
// Tables
// ============================================================

export function useTables(branchId?: number) {
  return useQuery({ queryKey: queryKeys.tables.all(branchId), queryFn: () => tablesApi.getAll(branchId) });
}

export function useSaveTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: any }) => id ? tablesApi.update(id, data) : tablesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); toast.success('تم حفظ الطاولة'); },
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tablesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); toast.success('تم حذف الطاولة'); },
  });
}

export function useUpdateTableStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => tablesApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); },
  });
}

// ============================================================
// Dine Orders
// ============================================================

export function useActiveOrders() {
  return useQuery({ queryKey: queryKeys.dineOrders.active, queryFn: () => dineOrdersApi.getActive(), refetchInterval: 10_000 });
}

export function useDineOrderById(id: number) {
  return useQuery({ queryKey: queryKeys.dineOrders.byId(id), queryFn: () => dineOrdersApi.getById(id), enabled: id > 0 });
}

export function useOrdersByTable(tableId: number) {
  return useQuery({ queryKey: queryKeys.dineOrders.byTable(tableId), queryFn: () => dineOrdersApi.getByTable(tableId), enabled: tableId > 0 });
}

export function useCreateDineOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => dineOrdersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dine-orders'] });
      qc.invalidateQueries({ queryKey: ['tables'] });
      toast.success('تم إنشاء الطلب');
    },
  });
}

export function useAddOrderItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: number; data: any }) => dineOrdersApi.addItems(orderId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dine-orders'] }); toast.success('تم إضافة الأصناف'); },
  });
}

export function useSendToKitchen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dineOrdersApi.sendToKitchen(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dine-orders'] });
      toast.success('تم إرسال الطلب للمطبخ');
    },
  });
}

export function useMarkServed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dineOrdersApi.markServed(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dine-orders'] }); qc.invalidateQueries({ queryKey: ['tables'] }); toast.success('تم التقديم'); },
  });
}

export function useCancelDineOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dineOrdersApi.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dine-orders'] }); qc.invalidateQueries({ queryKey: ['tables'] }); toast.success('تم إلغاء الطلب'); },
  });
}

export function useBillOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: number; data: any }) => dineOrdersApi.bill(orderId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dine-orders'] });
      qc.invalidateQueries({ queryKey: ['tables'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('تم تحويل الطلب لفاتورة');
    },
  });
}

// Kitchen
export function useKitchenBoard() {
  return useQuery({ queryKey: queryKeys.dineOrders.kitchen, queryFn: () => dineOrdersApi.getKitchenBoard(), refetchInterval: 5_000 });
}

export function useUpdateKitchenItemStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: number; status: string }) => dineOrdersApi.updateItemStatus(itemId, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dine-orders'] }); },
  });
}

export function useMarkAllReady() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dineOrdersApi.markAllReady(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dine-orders'] }); toast.success('تم تجهيز جميع الأصناف'); },
  });
}

export function useKitchenStats() {
  return useQuery({ queryKey: ['kitchen-stats'], queryFn: () => dineOrdersApi.getKitchenStats(), refetchInterval: 5_000 });
}

export function useCompletedKitchenOrders(limit = 20) {
  return useQuery({ queryKey: ['kitchen-completed', limit], queryFn: () => dineOrdersApi.getCompleted(limit), refetchInterval: 15_000 });
}

export function useRecallOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dineOrdersApi.recall(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dine-orders'] }); toast.success('تم إرجاع الطلب للمطبخ'); },
  });
}

// ============================================================
// Floor Sections (Zones)
// ============================================================

export function useFloorOverview(branchId?: number) {
  return useQuery({
    queryKey: ['floor-overview', branchId],
    queryFn: () => floorSectionsApi.getOverview(branchId),
    refetchInterval: 10_000,
  });
}

export function useFloorSections(branchId?: number) {
  return useQuery({
    queryKey: ['floor-sections', branchId],
    queryFn: () => floorSectionsApi.getAll(branchId),
  });
}

export function useFloorSection(id: number) {
  return useQuery({
    queryKey: ['floor-sections', id],
    queryFn: () => floorSectionsApi.getById(id),
    enabled: !!id,
  });
}

export function useSaveFloorSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: any }) =>
      id ? floorSectionsApi.update(id, data) : floorSectionsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['floor-sections'] }); qc.invalidateQueries({ queryKey: ['floor-overview'] }); toast.success('تم حفظ المنطقة'); },
  });
}

export function useDeleteFloorSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => floorSectionsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['floor-sections'] }); qc.invalidateQueries({ queryKey: ['floor-overview'] }); toast.success('تم حذف المنطقة'); },
  });
}

export function useReorderFloorSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sectionIds: number[]) => floorSectionsApi.reorder(sectionIds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['floor-sections'] }); toast.success('تم إعادة الترتيب'); },
  });
}

export function useAssignTableToSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, tableId }: { sectionId: number; tableId: number }) =>
      floorSectionsApi.assignTable(sectionId, tableId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['floor-sections'] }); qc.invalidateQueries({ queryKey: ['tables'] }); qc.invalidateQueries({ queryKey: ['floor-overview'] }); toast.success('تم ربط الطاولة بالمنطقة'); },
  });
}

export function useRemoveTableFromSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, tableId }: { sectionId: number; tableId: number }) =>
      floorSectionsApi.removeTable(sectionId, tableId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['floor-sections'] }); qc.invalidateQueries({ queryKey: ['tables'] }); qc.invalidateQueries({ queryKey: ['floor-overview'] }); toast.success('تم فك ربط الطاولة'); },
  });
}

// ============================================================
// QR Config (store owner)
// ============================================================

export function useQrConfigs() {
  return useQuery({ queryKey: ['qr-configs'], queryFn: () => qrConfigApi.getAll() });
}

export function useSaveQrConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: any }) => id ? qrConfigApi.update(id, data) : qrConfigApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qr-configs'] }); toast.success('تم حفظ إعدادات QR'); },
  });
}

export function useDeleteQrConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => qrConfigApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qr-configs'] }); toast.success('تم حذف كود QR'); },
  });
}

export function useRegenerateQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => qrConfigApi.regenerate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qr-configs'] }); toast.success('تم إعادة توليد الكود'); },
  });
}

// ============================================================
// Payment Terminals
// ============================================================

export function usePaymentTerminals() {
  return useQuery({ queryKey: ['payment-terminals'], queryFn: () => paymentTerminalsApi.getAll() });
}

export function useSavePaymentTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: any }) => id ? paymentTerminalsApi.update(id, data) : paymentTerminalsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-terminals'] }); toast.success('تم حفظ جهاز الدفع'); },
  });
}

export function useDeletePaymentTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentTerminalsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-terminals'] }); toast.success('تم حذف الجهاز'); },
  });
}

export function useSetDefaultTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentTerminalsApi.setDefault(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-terminals'] }); toast.success('تم تعيين الجهاز الافتراضي'); },
  });
}

export function usePingTerminal() {
  return useMutation({
    mutationFn: (id: number) => paymentTerminalsApi.ping(id),
    onSuccess: () => toast.success('الجهاز متصل'),
    onError: () => toast.error('فشل الاتصال بالجهاز'),
  });
}

export function useInitiateTerminalPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => paymentTerminalsApi.initiatePayment(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['payment-terminals'] });
      if (res.data?.isApproved) toast.success('تمت عملية الدفع بنجاح');
      else toast.error(res.data?.responseMessage || 'تم رفض العملية');
    },
  });
}

export function useCheckTxnStatus() {
  return useMutation({ mutationFn: (txnId: number) => paymentTerminalsApi.checkTxnStatus(txnId) });
}

export function useCancelTerminalPayment() {
  return useMutation({
    mutationFn: (txnId: number) => paymentTerminalsApi.cancelPayment(txnId),
    onSuccess: () => toast.success('تم إلغاء العملية'),
  });
}

export function useRefundTerminalPayment() {
  return useMutation({
    mutationFn: ({ txnId, amount }: { txnId: number; amount?: number }) => paymentTerminalsApi.refundPayment(txnId, amount),
    onSuccess: () => toast.success('تم الاسترداد'),
  });
}

export function useTerminalTransactions(params?: any) {
  return useQuery({ queryKey: ['terminal-txns', params], queryFn: () => paymentTerminalsApi.getTransactions(params) });
}

export function useReconcileTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentTerminalsApi.reconcile(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-terminals'] }); toast.success('تم التسوية بنجاح'); },
  });
}

// ============================================================
// Users Management
// ============================================================

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: () => usersApi.getAll() });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('تم إنشاء المستخدم'); },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('تم تحديث المستخدم'); },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('تم حذف المستخدم'); },
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('تم تحديث حالة المستخدم'); },
  });
}

export function useUpdateUserPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: Array<{ permission: string; isGranted: boolean }> }) =>
      usersApi.updatePermissions(id, permissions),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('تم تحديث الصلاحيات'); },
  });
}

// ============================================================
// Subscription Requests
// ============================================================

export function useSubscriptionRequests(params?: any) {
  return useQuery({ queryKey: ['subscriptions', params], queryFn: () => subscriptionsApi.getAll(params) });
}

export function useSubmitSubscription() {
  return useMutation({
    mutationFn: (data: any) => subscriptionsApi.submit(data),
    onSuccess: () => toast.success('تم إرسال طلب الاشتراك بنجاح'),
  });
}

export function useReviewSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => subscriptionsApi.review(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); toast.success('تم مراجعة الطلب'); },
  });
}

// ============================================================
// Payment Gateways
// ============================================================

export function usePaymentGatewayConfigs() {
  return useQuery({ queryKey: ['payment-gateways'], queryFn: () => paymentGatewayApi.getConfigs() });
}

export function useSavePaymentGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => paymentGatewayApi.saveConfig(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-gateways'] }); toast.success('تم حفظ إعدادات بوابة الدفع'); },
  });
}

export function useDeletePaymentGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentGatewayApi.deleteConfig(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-gateways'] }); toast.success('تم حذف بوابة الدفع'); },
  });
}

export function useTestPaymentGateway() {
  return useMutation({
    mutationFn: (id: number) => paymentGatewayApi.test(id),
    onSuccess: () => toast.success('بوابة الدفع تعمل بنجاح'),
    onError: () => toast.error('فشل اختبار بوابة الدفع'),
  });
}

// ============================================================
// OTP Service
// ============================================================

export function useOtpConfigs() {
  return useQuery({ queryKey: ['otp-configs'], queryFn: () => otpApi.getConfigs() });
}

export function useSaveOtpConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => otpApi.saveConfig(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['otp-configs'] }); toast.success('تم حفظ إعدادات OTP'); },
  });
}

export function useDeleteOtpConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => otpApi.deleteConfig(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['otp-configs'] }); toast.success('تم حذف إعدادات OTP'); },
  });
}

export function useTestOtp() {
  return useMutation({
    mutationFn: (id: number) => otpApi.test(id),
    onSuccess: () => toast.success('OTP يعمل بنجاح'),
    onError: () => toast.error('فشل اختبار OTP'),
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (data: { phone: string; purpose: string }) => otpApi.send(data),
    onSuccess: () => toast.success('تم إرسال رمز التحقق'),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (data: { phone: string; code: string; purpose: string }) => otpApi.verify(data),
  });
}
