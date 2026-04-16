// ==================== API Response Types ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ==================== Enums ====================

export enum TenantStatus {
  Active = 1,
  Suspended = 2,
  Cancelled = 3,
}

export enum ContactType {
  Customer = 1,
  Supplier = 2,
  Both = 3,
}

export enum PriceType {
  Retail = 1,
  HalfWholesale = 2,
  Wholesale = 3,
}

export enum PaymentMethod {
  Cash = 1,
  Visa = 2,
  Instapay = 3,
  Credit = 4,
  Installment = 5,
}

export enum PaymentStatus {
  Paid = 1,
  Partial = 2,
  Unpaid = 3,
}

export type BundleDiscountType = 1 | 2 | 3;  // FixedPrice | Percent | FlatDiscount
export type BundlePricingMode = 1 | 2;        // Unified | PerLevel

export interface BundleItemDto {
  id: number;
  componentId: number;
  componentName: string;
  componentBarcode?: string;
  quantity: number;
  sortOrder: number;
  componentRetailPrice: number;
  componentCostPrice: number;
}

export enum InvoiceType {
  Sale = 1,
  SaleReturn = 2,
  Purchase = 3,
  PurchaseReturn = 4,
}

export enum AccountType {
  Cash = 1,
  Bank = 2,
  Digital = 3,
}

export enum TransactionType {
  Income = 1,
  Expense = 2,
  Transfer = 3,
}

// ==================== Tenant Search ====================

export interface TenantSearchParams {
  search?: string;
  status?: TenantStatus;
  planId?: number;
  page?: number;
  pageSize?: number;
}

// ==================== Auth ====================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  username: string;
  fullName: string;
  phone?: string;
  email?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
}

// ==================== Product ====================

export interface ProductDto {
  id: number;
  barcode?: string;
  sku?: string;
  name: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  unitId?: number;
  unitName?: string;
  costPrice: number;
  retailPrice: number;
  halfWholesalePrice?: number;
  wholesalePrice?: number;
  price4?: number;
  minStock: number;
  currentStock: number;
  isActive: boolean;
  taxRate?: number;
  imageUrl?: string;
  isBundle: boolean;
  bundleDiscountType?: BundleDiscountType;
  bundleDiscountValue?: number;
  bundleHasOwnStock: boolean;
  bundleValidFrom?: string;
  bundleValidTo?: string;
  bundlePricingMode: BundlePricingMode;
  bundleItems?: BundleItemDto[];
  hasVariants?: boolean;
}

export interface CreateProductRequest {
  barcode?: string;
  sku?: string;
  name: string;
  description?: string;
  categoryId?: number;
  unitId?: number;
  costPrice: number;
  retailPrice: number;
  halfWholesalePrice?: number;
  wholesalePrice?: number;
  price4?: number;
  minStock: number;
  maxStock?: number;
  taxRate?: number;
  initialStock: number;
  warehouseId: number;
}

export interface UpdateProductRequest {
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: number;
  unitId?: number;
  costPrice: number;
  retailPrice: number;
  halfWholesalePrice?: number;
  wholesalePrice?: number;
  price4?: number;
  minStock: number;
  taxRate?: number;
}

export interface ProductSearchRequest {
  searchTerm?: string;
  categoryId?: number;
  lowStockOnly?: boolean;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}

// ==================== Unit ====================

export interface UnitDto {
  id: number;
  name: string;
  symbol?: string;
  isBase: boolean;
  baseUnitId?: number;
  baseUnitName?: string;
  conversionRate?: number;
}

export interface CreateUnitRequest {
  name: string;
  symbol?: string;
  isBase?: boolean;
  baseUnitId?: number;
  conversionRate?: number;
}

export interface UpdateUnitRequest {
  name: string;
  symbol?: string;
  isBase: boolean;
  baseUnitId?: number;
  conversionRate?: number;
}

// ==================== Sales Rep ====================

export interface SalesRepDto {
  id: number;
  userId: string;
  userName: string;
  name: string;
  phone?: string;
  assignedWarehouseId?: number;
  assignedWarehouseName?: string;
  commissionPercent: number;
  fixedBonus: number;
  outstandingBalance: number;
  isActive: boolean;
}

export interface CreateSalesRepRequest {
  username: string;
  password: string;
  fullName: string;
  phone?: string;
  assignedWarehouseId?: number;
  commissionPercent: number;
  fixedBonus?: number;
}

export interface UpdateSalesRepRequest {
  name: string;
  phone?: string;
  assignedWarehouseId?: number;
  commissionPercent: number;
  fixedBonus: number;
  isActive: boolean;
}

export interface SalesRepTransactionDto {
  id: number;
  transactionType: number;
  transactionTypeLabel: string;
  amount: number;
  balanceAfter: number;
  invoiceId?: number;
  invoiceNumber?: string;
  paymentMethod?: number;
  transactionDate: string;
  notes?: string;
}

export interface CollectPaymentRequest {
  invoiceId: number;
  amount: number;
  paymentMethod: number;
  notes?: string;
}

export interface SalesRepCommissionDto {
  id: number;
  salesRepId: number;
  salesRepName: string;
  month: number;
  year: number;
  totalPaidSales: number;
  commissionPercent: number;
  commissionAmount: number;
  fixedBonus: number;
  totalEarned: number;
  paidAmount: number;
  status: number;
}

export interface SalesRepSummaryDto {
  totalReps: number;
  activeReps: number;
  totalOutstanding: number;
  totalCommissionUnpaid: number;
}

// ==================== Category ====================

export interface CategoryDto {
  id: number;
  name: string;
  parentId?: number;
  sortOrder: number;
  productCount: number;
}

export interface UpdateCategoryRequest {
  name: string;
  parentId?: number;
  sortOrder?: number;
}

export interface MoveProductsRequest {
  targetCategoryId: number;
  productIds: number[];
}

// ==================== Stock Count ====================

export interface StockCountDto {
  id: number;
  warehouseId: number;
  warehouseName: string;
  status: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  totalItems: number;
  countedItems: number;
  settledItems: number;
}

export interface StockCountItemDto {
  id: number;
  productId: number;
  productName: string;
  barcode?: string;
  systemQty: number;
  countedQty: number;
  variance: number;
  status: string;
  isSettled: boolean;
  notes?: string;
}

export interface BulkOpeningBalanceRow {
  productId: number;
  warehouseId: number;
  quantity: number;
}

// ==================== Invoice ====================

export interface InvoiceSearchRequest {
  dateFrom?: string;
  dateTo?: string;
  contactId?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  invoiceType?: InvoiceType;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateInvoiceRequest {
  contactId?: number;
  warehouseId: number;
  priceType: PriceType;
  paymentMethod: PaymentMethod;
  discountAmount: number;
  paidAmount: number;
  notes?: string;
  items: InvoiceItemRequest[];
  salesRepId?: number;
}

export interface InvoiceItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  productVariantId?: number;
}

export interface InvoiceDto {
  id: number;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  invoiceDate: string;
  contactId?: number;
  contactName?: string;
  warehouseId: number;
  warehouseName: string;
  priceType: PriceType;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdByName: string;
  items: InvoiceItemDto[];
  zatcaReported: boolean;
  zatcaQrCode?: string;
}

export interface InvoiceItemDto {
  id: number;
  productId: number;
  productName: string;
  barcode?: string;
  quantity: number;
  unitName: string;
  unitPrice: number;
  costPrice: number;
  discountAmount: number;
  totalPrice: number;
  bundleParentId?: number;
}

// ==================== Contact ====================

export interface ContactDto {
  id: number;
  contactType: ContactType;
  name: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address?: string;
  notes?: string;
  priceType: PriceType;
  creditLimit?: number;
  balance: number;
  isActive: boolean;
  taxNumber?: string;
  isCompany?: boolean;
  commercialRegister?: string;
  nationalId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  iban?: string;
  creditPeriodDays?: number;
  paymentMethod?: string;
  projectName?: string;
  // ZATCA fields
  street?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  countryCode?: string;
  buildingNumber?: string;
  plotIdentification?: string;
  idScheme?: string;
  otherId?: string;
  contactPerson?: string;
}

export interface CreateContactRequest {
  contactType: ContactType;
  name: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address?: string;
  notes?: string;
  taxNumber?: string;
  priceType: PriceType;
  creditLimit?: number;
  isCompany?: boolean;
  commercialRegister?: string;
  nationalId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  iban?: string;
  creditPeriodDays?: number;
  paymentMethod?: string;
  projectName?: string;
  // ZATCA fields
  street?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  countryCode?: string;
  buildingNumber?: string;
  plotIdentification?: string;
  idScheme?: string;
  otherId?: string;
  contactPerson?: string;
}

// ==================== Warehouse ====================

export interface WarehouseDto {
  id: number;
  name: string;
  location?: string;
  isMain: boolean;
  totalItems: number;
  totalValue: number;
}

// ==================== Finance ====================

export interface FinanceAccountDto {
  id: number;
  name: string;
  accountType: AccountType;
  balance: number;
  isActive?: boolean;
  chartOfAccountId?: number | null;
  chartOfAccountCode?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  iban?: string | null;
  isPrimary?: boolean;
}

export interface FinanceTransactionDto {
  id: number;
  accountId: number;
  accountName: string;
  transactionType: TransactionType;
  category?: string;
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
  createdByName: string;
}

// ==================== Dashboard ====================

export interface DashboardDto {
  todaySales: number;
  todayInvoices: number;
  todayProfit: number;
  profitMargin: number;
  newCustomers: number;
  lowStockCount: number;
  topProducts: TopProductDto[];
  lowStockItems: LowStockProductDto[];
  weeklySales: DailySalesDto[];
}

export interface TopProductDto {
  id: number;
  name: string;
  totalQty: number;
  totalRevenue: number;
}

export interface LowStockProductDto {
  id: number;
  name: string;
  barcode?: string;
  quantity: number;
  minStock: number;
}

export interface DailySalesDto {
  date: string;
  invoiceCount: number;
  total: number;
}

// ==================== Employee ====================

export interface EmployeeDto {
  id: number;
  name: string;
  phone?: string;
  position?: string;
  department?: string;
  basicSalary: number;
  hireDate: string;
  isActive: boolean;
}

export interface CreateEmployeeRequest {
  name: string;
  phone?: string;
  position?: string;
  department?: string;
  basicSalary: number;
  hireDate: string;
}

// ==================== Installment ====================

export interface InstallmentDto {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  contactId: number;
  contactName: string;
  totalAmount: number;
  downPayment: number;
  numberOfPayments: number;
  paymentAmount: number;
  paidTotal: number;
  remainingAmount: number;
  status: number;
  payments: InstallmentPaymentDto[];
}

export interface InstallmentPaymentDto {
  id: number;
  paymentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  paidDate?: string;
  status: PaymentStatus;
}

// ==================== Tenant ====================

export interface TenantDto {
  id: string;
  name: string;
  businessType: string;
  ownerName: string;
  phone: string;
  email?: string;
  address?: string;
  city: string;
  logoUrl?: string;
  planId: number;
  planName: string;
  status: TenantStatus;
  activeUsers: number;
  totalProducts: number;
  totalSales: number;
  subscriptionStart: string;
  subscriptionEnd?: string;
  vatNumber?: string;
  zatcaEnabled: boolean;
  trialEndDate?: string;
}

export interface CreateTenantRequest {
  name: string;
  businessType: string;
  ownerName: string;
  phone: string;
  email?: string;
  address?: string;
  city: string;
  planId: number;
  adminUsername: string;
  adminPassword: string;
  adminFullName: string;
  vatNumber: string;
}

export interface UpdateTenantRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  taxNumber?: string;
  vatNumber?: string;
  zatcaEnabled?: boolean;
  settings?: string;
}

// ==================== User Management ====================

export interface UserDetailDto {
  id: string;
  username: string;
  fullName: string;
  phone?: string;
  email?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  permissions: PermissionDto[];
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  phone?: string;
  email?: string;
  role: string;
  permissions?: string[];
}

export interface UpdateUserRequest {
  fullName?: string;
  phone?: string;
  email?: string;
  role?: string;
  password?: string;
}

export interface PermissionDto {
  permission: string;
  isGranted: boolean;
}

// ==================== HR: Employee Detail ====================

export interface EmployeeDetailDto {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  position?: string;
  department?: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  deviceUserId?: string;
  bankName?: string;
  bankAccount?: string;
  iban?: string;
  hireDate: string;
  terminationDate?: string;
  isActive: boolean;
  userId?: string;
  username?: string;
  salaryConfigs: SalaryConfigDto[];
}

export interface CreateEmployeeDetailRequest {
  name: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  position?: string;
  department?: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  deviceUserId?: string;
  bankName?: string;
  bankAccount?: string;
  iban?: string;
  hireDate: string;
  username?: string;
  password?: string;
}

export interface UpdateEmployeeRequest2 {
  name?: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  position?: string;
  department?: string;
  basicSalary?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  otherAllowance?: number;
  deviceUserId?: string;
  bankName?: string;
  bankAccount?: string;
  iban?: string;
  isActive?: boolean;
}

// ==================== HR: Salary Config ====================

export interface SalaryConfigDto {
  id: number;
  employeeId: number;
  employeeName: string;
  itemName: string;
  itemType: number;
  amount: number;
  isPercentage: boolean;
  isActive: boolean;
  notes?: string;
}

export interface SaveSalaryConfigRequest {
  employeeId: number;
  itemName: string;
  itemType: number;
  amount: number;
  isPercentage: boolean;
  notes?: string;
}

// ==================== HR: Attendance Device ====================

export interface AttendanceDeviceDto {
  id: number;
  name: string;
  model?: string;
  ipAddress: string;
  port: number;
  serialNumber?: string;
  location?: string;
  isActive: boolean;
  lastSyncStatus: number;
  lastSyncAt?: string;
  lastSyncRecords?: number;
  lastSyncError?: string;
}

export interface SaveDeviceRequest {
  name: string;
  model?: string;
  ipAddress: string;
  port: number;
  serialNumber?: string;
  location?: string;
}

export interface DeviceSyncResult {
  success: boolean;
  recordsSynced: number;
  message: string;
  durationMs?: number;
}

// ==================== HR: Attendance Punch ====================

export interface AttendancePunchDto {
  id: number;
  employeeId: number;
  employeeName: string;
  punchTime: string;
  isCheckIn: boolean;
  source: number;
  deviceId?: number;
  deviceName?: string;
  notes?: string;
}

export interface ManualPunchRequest {
  employeeId: number;
  punchTime: string;
  isCheckIn: boolean;
  notes?: string;
}

export interface AttendanceDailySummaryDto {
  employeeId: number;
  employeeName: string;
  department?: string;
  date: string;
  firstCheckIn?: string;
  lastCheckOut?: string;
  totalHours?: number;
  status: number;
  punches: AttendancePunchDto[];
}

export interface AttendanceMonthSummaryDto {
  employeeId: number;
  employeeName: string;
  department?: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  totalHours: number;
}

// ==================== HR: Payroll ====================

export interface PayrollDetailDto {
  id: number;
  employeeId: number;
  employeeName: string;
  department?: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  bonus: number;
  overtimeAmount: number;
  penaltyAmount: number;
  netSalary: number;
  status: number;
  isPaid: boolean;
  paidDate?: string;
  approvedByName?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  items: PayrollItemDto[];
  checks: PayrollCheckDto[];
}

export interface PayrollItemDto {
  id: number;
  itemName: string;
  itemType: number;
  amount: number;
  notes?: string;
}

export interface PayrollCheckDto {
  id: number;
  payrollId: number;
  checkNumber: string;
  amount: number;
  issueDate: string;
  cashDate?: string;
  bankName?: string;
  accountNumber?: string;
  isCashed: boolean;
  notes?: string;
}

export interface GeneratePayrollRequest {
  month: number;
  year: number;
  employeeIds?: number[];
}

export interface PayrollMonthSummaryDto {
  month: number;
  year: number;
  employeeCount: number;
  totalBasicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalBonus: number;
  totalNet: number;
  paidCount: number;
  unpaidCount: number;
}

export interface PayslipDto {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyLogo?: string;
  employeeName: string;
  employeeId?: string;
  department?: string;
  position?: string;
  bankName?: string;
  bankAccount?: string;
  iban?: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  basicSalary: number;
  earnings: PayslipLineDto[];
  deductionItems: PayslipLineDto[];
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  checkNumber?: string;
  paymentDate?: string;
}

export interface PayslipLineDto {
  description: string;
  amount: number;
}

// ==================== Product Variants ====================

export interface ProductVariantOptionDto {
  id: number;
  productId: number;
  name: string;
  sortOrder: number;
  values: ProductVariantValueDto[];
}

export interface ProductVariantValueDto {
  id: number;
  variantOptionId: number;
  value: string;
  sortOrder: number;
}

export interface ProductVariantDto {
  id: number;
  productId: number;
  sku?: string;
  barcode?: string;
  variantCombination: string;
  displayName?: string;
  costPrice: number;
  retailPrice: number;
  halfWholesalePrice?: number;
  wholesalePrice?: number;
  imageUrl?: string;
  isActive: boolean;
  currentStock: number;
}

export interface ProductWithVariantsDto {
  productId: number;
  productName: string;
  hasVariants: boolean;
  options: ProductVariantOptionDto[];
  variants: ProductVariantDto[];
}

export interface SetVariantOptionsRequest {
  productId: number;
  options: { name: string; values: string[] }[];
}

export interface GenerateVariantsRequest {
  productId: number;
  defaultCostPrice: number;
  defaultRetailPrice: number;
  defaultHalfWholesalePrice?: number;
  defaultWholesalePrice?: number;
}

export interface UpdateVariantRequest {
  sku?: string;
  barcode?: string;
  costPrice: number;
  retailPrice: number;
  halfWholesalePrice?: number;
  wholesalePrice?: number;
  imageUrl?: string;
  isActive: boolean;
}
