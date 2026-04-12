// ============================================================
// MsCashier.Domain - Core Entities
// ============================================================

namespace MsCashier.Domain.Entities;

using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

// === Tenant ===
public class Tenant : BaseEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string BusinessType { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string City { get; set; } = "الإسكندرية";
    public string? LogoUrl { get; set; }
    public string? TaxNumber { get; set; }
    public int PlanId { get; set; }
    public TenantStatus Status { get; set; } = TenantStatus.Active;
    public DateTime SubscriptionStart { get; set; } = DateTime.UtcNow;
    public DateTime? SubscriptionEnd { get; set; }
    public int MaxUsers { get; set; } = 3;
    public int MaxWarehouses { get; set; } = 1;
    public int MaxPosStations { get; set; } = 1;
    public string? Settings { get; set; }

    public virtual Plan? Plan { get; set; }
    public virtual ICollection<User> Users { get; set; } = new List<User>();
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    public virtual ICollection<Warehouse> Warehouses { get; set; } = new List<Warehouse>();
}

// === Plan ===
public class Plan
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public decimal? YearlyPrice { get; set; }
    public int MaxUsers { get; set; }
    public int MaxWarehouses { get; set; }
    public int MaxPosStations { get; set; }
    public int? MaxProducts { get; set; }
    public string? Features { get; set; }
    public bool IsActive { get; set; } = true;
}

// === User ===
public class User : TenantEntity
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string Role { get; set; } = "Cashier";
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public virtual ICollection<UserPermission> Permissions { get; set; } = new List<UserPermission>();
}

public class UserPermission
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string Permission { get; set; } = string.Empty;
    public bool IsGranted { get; set; } = true;
    public virtual User? User { get; set; }
}

// === Category ===
public class Category : TenantEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual Category? Parent { get; set; }
    public virtual ICollection<Category> Children { get; set; } = new List<Category>();
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}

// === Unit ===
public class Unit : TenantEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Symbol { get; set; }
    public bool IsBase { get; set; } = true;
    public int? BaseUnitId { get; set; }
    public decimal? ConversionRate { get; set; }

    public virtual Unit? BaseUnit { get; set; }
}

// === Product ===
public class Product : TenantEntity
{
    public int Id { get; set; }
    public string? Barcode { get; set; }
    public string? SKU { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? CategoryId { get; set; }
    public int? UnitId { get; set; }
    public decimal CostPrice { get; set; }
    public decimal RetailPrice { get; set; }
    public decimal? HalfWholesalePrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public decimal? Price4 { get; set; }
    public int MinStock { get; set; }
    public int? MaxStock { get; set; }
    public decimal? TaxRate { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public bool TrackInventory { get; set; } = true;
    public bool AllowNegativeStock { get; set; }

    public virtual Category? Category { get; set; }
    public virtual Unit? Unit { get; set; }
    public virtual ICollection<Inventory> InventoryItems { get; set; } = new List<Inventory>();
}

// === Warehouse ===
public class Warehouse : TenantEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public bool IsMain { get; set; }
    public bool IsActive { get; set; } = true;
}

// === Inventory ===
public class Inventory
{
    public long Id { get; set; }
    public Guid TenantId { get; set; }
    public int ProductId { get; set; }
    public int WarehouseId { get; set; }
    public decimal Quantity { get; set; }
    public decimal ReservedQty { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    public virtual Product? Product { get; set; }
    public virtual Warehouse? Warehouse { get; set; }

    public decimal AvailableQty => Quantity - ReservedQty;
}

// === InventoryTransaction ===
public class InventoryTransaction
{
    public long Id { get; set; }
    public Guid TenantId { get; set; }
    public int ProductId { get; set; }
    public int WarehouseId { get; set; }
    public InventoryTransactionType TransactionType { get; set; }
    public decimal Quantity { get; set; }
    public decimal PreviousQty { get; set; }
    public decimal NewQty { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Product? Product { get; set; }
    public virtual Warehouse? Warehouse { get; set; }
}

// === Contact (Customer/Supplier) ===
public class Contact : TenantEntity
{
    public int Id { get; set; }
    public ContactType ContactType { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Phone2 { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? TaxNumber { get; set; }
    public PriceType PriceType { get; set; } = PriceType.Retail;
    public decimal? CreditLimit { get; set; }
    public decimal Balance { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}

// === Invoice ===
public class Invoice : TenantEntity
{
    public long Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public InvoiceType InvoiceType { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public int? ContactId { get; set; }
    public int WarehouseId { get; set; }
    public PriceType PriceType { get; set; } = PriceType.Retail;
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal? DiscountPercent { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DueAmount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedBy { get; set; }

    public virtual Contact? Contact { get; set; }
    public virtual Warehouse? Warehouse { get; set; }
    public virtual User? Creator { get; set; }
    public virtual ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}

// === InvoiceItem ===
public class InvoiceItem
{
    public long Id { get; set; }
    public long InvoiceId { get; set; }
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }

    public virtual Invoice? Invoice { get; set; }
    public virtual Product? Product { get; set; }
}

// === Installment ===
public class Installment : TenantEntity
{
    public int Id { get; set; }
    public long InvoiceId { get; set; }
    public int ContactId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DownPayment { get; set; }
    public int NumberOfPayments { get; set; }
    public decimal PaymentAmount { get; set; }
    public DateTime StartDate { get; set; }
    public InstallmentStatus Status { get; set; } = InstallmentStatus.Active;

    public virtual Invoice? Invoice { get; set; }
    public virtual Contact? Contact { get; set; }
    public virtual ICollection<InstallmentPayment> Payments { get; set; } = new List<InstallmentPayment>();
}

public class InstallmentPayment
{
    public int Id { get; set; }
    public int InstallmentId { get; set; }
    public int PaymentNumber { get; set; }
    public DateTime DueDate { get; set; }
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public DateTime? PaidDate { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Unpaid;
    public string? Notes { get; set; }
}

// === Finance ===
public class FinanceAccount : TenantEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public decimal Balance { get; set; }
    public bool IsActive { get; set; } = true;
}

public class FinanceTransaction
{
    public long Id { get; set; }
    public Guid TenantId { get; set; }
    public int AccountId { get; set; }
    public TransactionType TransactionType { get; set; }
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? Description { get; set; }
    public string? ReferenceType { get; set; }
    public string? ReferenceId { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual FinanceAccount? Account { get; set; }
}

// === Employee ===
public class Employee : TenantEntity
{
    public int Id { get; set; }
    public Guid? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? NationalId { get; set; }
    public string? Position { get; set; }
    public string? Department { get; set; }
    public decimal BasicSalary { get; set; }
    public DateTime HireDate { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual User? User { get; set; }
}

// === Audit ===
public class AuditLog
{
    public long Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
