namespace MsCashier.Application.DTOs;

using MsCashier.Domain.Enums;

// ==================== AUTH ====================

public record LoginRequest(string Username, string Password);
public record LoginResponse(string AccessToken, string RefreshToken, UserDto User);
public record RefreshTokenRequest(string RefreshToken);

// ==================== TENANT ====================

public record TenantDto(
    Guid Id, string Name, string BusinessType, string OwnerName,
    string Phone, string? Email, string? Address, string City,
    string? LogoUrl, int PlanId, string PlanName,
    TenantStatus Status, int ActiveUsers, int TotalProducts,
    decimal TotalSales, DateTime SubscriptionStart, DateTime? SubscriptionEnd);

public record CreateTenantRequest(
    string Name, string BusinessType, string OwnerName,
    string Phone, string? Email, string? Address,
    string City, int PlanId,
    string AdminUsername, string AdminPassword, string AdminFullName);

public record UpdateTenantRequest(
    string Name, string? Phone, string? Email, string? Address,
    string? LogoUrl, string? TaxNumber, string? Settings);

// ==================== USER ====================

public record UserDto(
    Guid Id, string Username, string FullName, string? Phone,
    string? Email, string Role, bool IsActive, DateTime? LastLoginAt);

public record CreateUserRequest(
    string Username, string Password, string FullName,
    string? Phone, string? Email, string Role, List<string>? Permissions);

// ==================== PRODUCT ====================

public record ProductDto(
    int Id, string? Barcode, string? SKU, string Name, string? Description,
    int? CategoryId, string? CategoryName, int? UnitId, string? UnitName,
    decimal CostPrice, decimal RetailPrice, decimal? HalfWholesalePrice,
    decimal? WholesalePrice, decimal? Price4,
    int MinStock, decimal CurrentStock, bool IsActive);

public record CreateProductRequest(
    string? Barcode, string? SKU, string Name, string? Description,
    int? CategoryId, int? UnitId,
    decimal CostPrice, decimal RetailPrice,
    decimal? HalfWholesalePrice, decimal? WholesalePrice, decimal? Price4,
    int MinStock, int? MaxStock, decimal? TaxRate,
    decimal InitialStock, int WarehouseId);

public record UpdateProductRequest(
    string? Barcode, string Name, string? Description,
    int? CategoryId, int? UnitId,
    decimal CostPrice, decimal RetailPrice,
    decimal? HalfWholesalePrice, decimal? WholesalePrice, decimal? Price4,
    int MinStock, decimal? TaxRate);

public record ProductSearchRequest(
    string? SearchTerm, int? CategoryId, bool? LowStockOnly,
    bool? ActiveOnly, int Page = 1, int PageSize = 50);

// ==================== CATEGORY ====================

public record CategoryDto(int Id, string Name, int? ParentId, int SortOrder, int ProductCount);
public record CreateCategoryRequest(string Name, int? ParentId, int SortOrder = 0);

// ==================== INVOICE (SALE) ====================

public record CreateInvoiceRequest(
    int? ContactId, int WarehouseId, PriceType PriceType,
    PaymentMethod PaymentMethod, decimal DiscountAmount,
    decimal PaidAmount, string? Notes,
    List<InvoiceItemRequest> Items);

public record InvoiceItemRequest(
    int ProductId, decimal Quantity, decimal UnitPrice, decimal DiscountAmount = 0);

public record InvoiceDto(
    long Id, string InvoiceNumber, InvoiceType InvoiceType,
    DateTime InvoiceDate, int? ContactId, string? ContactName,
    int WarehouseId, string WarehouseName,
    PriceType PriceType, decimal SubTotal, decimal DiscountAmount,
    decimal TaxAmount, decimal TotalAmount, decimal PaidAmount,
    decimal DueAmount, PaymentMethod PaymentMethod,
    PaymentStatus PaymentStatus, string? Notes,
    string CreatedByName, List<InvoiceItemDto> Items);

public record InvoiceItemDto(
    long Id, int ProductId, string ProductName, string? Barcode,
    decimal Quantity, string UnitName, decimal UnitPrice,
    decimal CostPrice, decimal DiscountAmount, decimal TotalPrice);

public record InvoiceSearchRequest(
    DateTime? DateFrom, DateTime? DateTo,
    int? ContactId, PaymentMethod? PaymentMethod,
    PaymentStatus? PaymentStatus, InvoiceType? InvoiceType,
    int Page = 1, int PageSize = 50);

// ==================== CONTACT ====================

public record ContactDto(
    int Id, ContactType ContactType, string Name,
    string? Phone, string? Email, string? Address,
    PriceType PriceType, decimal? CreditLimit,
    decimal Balance, bool IsActive);

public record CreateContactRequest(
    ContactType ContactType, string Name,
    string? Phone, string? Phone2, string? Email,
    string? Address, string? TaxNumber,
    PriceType PriceType, decimal? CreditLimit);

// ==================== WAREHOUSE ====================

public record WarehouseDto(
    int Id, string Name, string? Location,
    bool IsMain, int TotalItems, decimal TotalValue);

public record StockTransferRequest(
    int FromWarehouseId, int ToWarehouseId,
    string? Notes, List<TransferItemRequest> Items);

public record TransferItemRequest(int ProductId, decimal Quantity);

// ==================== FINANCE ====================

public record FinanceAccountDto(
    int Id, string Name, AccountType AccountType, decimal Balance);

public record CreateTransactionRequest(
    int AccountId, TransactionType TransactionType,
    string? Category, decimal Amount, string? Description);

public record FinanceTransactionDto(
    long Id, int AccountId, string AccountName,
    TransactionType TransactionType, string? Category,
    decimal Amount, decimal BalanceAfter,
    string? Description, DateTime CreatedAt, string CreatedByName);

// ==================== EMPLOYEE ====================

public record EmployeeDto(
    int Id, string Name, string? Phone, string? Position,
    string? Department, decimal BasicSalary,
    DateTime HireDate, bool IsActive);

public record CreateEmployeeRequest(
    string Name, string? Phone, string? NationalId,
    string? Position, string? Department,
    decimal BasicSalary, DateTime HireDate,
    string? Username, string? Password);

// ==================== INSTALLMENT ====================

public record CreateInstallmentRequest(
    long InvoiceId, int ContactId,
    decimal DownPayment, int NumberOfPayments,
    DateTime StartDate);

public record InstallmentDto(
    int Id, long InvoiceId, string InvoiceNumber,
    int ContactId, string ContactName,
    decimal TotalAmount, decimal DownPayment,
    int NumberOfPayments, decimal PaymentAmount,
    decimal PaidTotal, decimal RemainingAmount,
    InstallmentStatus Status, List<InstallmentPaymentDto> Payments);

public record InstallmentPaymentDto(
    int Id, int PaymentNumber, DateTime DueDate,
    decimal Amount, decimal PaidAmount,
    DateTime? PaidDate, PaymentStatus Status);

// ==================== DASHBOARD ====================

public record DashboardDto(
    decimal TodaySales, int TodayInvoices,
    decimal TodayProfit, decimal ProfitMargin,
    int NewCustomers, int LowStockCount,
    List<TopProductDto> TopProducts,
    List<LowStockProductDto> LowStockItems,
    List<DailySalesDto> WeeklySales);

public record TopProductDto(int Id, string Name, decimal TotalQty, decimal TotalRevenue);
public record LowStockProductDto(int Id, string Name, string? Barcode, decimal Quantity, int MinStock);
public record DailySalesDto(DateTime Date, int InvoiceCount, decimal Total);

// ==================== REPORTS ====================

public record SalesReportRequest(DateTime DateFrom, DateTime DateTo, int? CategoryId, int? ContactId);
public record ProfitReportRequest(DateTime DateFrom, DateTime DateTo, int? ProductId);
public record InventoryReportRequest(int? WarehouseId, int? CategoryId, bool LowStockOnly = false);
public record AccountStatementRequest(int ContactId, DateTime DateFrom, DateTime DateTo);
