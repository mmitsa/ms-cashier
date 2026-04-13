using Microsoft.EntityFrameworkCore;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Infrastructure.Data;

public class AppDbContext : DbContext
{
    private readonly ICurrentTenantService? _tenantService;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentTenantService? tenantService = null)
        : base(options)
    {
        _tenantService = tenantService;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariantOption> ProductVariantOptions => Set<ProductVariantOption>();
    public DbSet<ProductVariantValue> ProductVariantValues => Set<ProductVariantValue>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();

    // Loyalty
    public DbSet<LoyaltyProgram> LoyaltyPrograms => Set<LoyaltyProgram>();
    public DbSet<CustomerLoyalty> CustomerLoyalties => Set<CustomerLoyalty>();
    public DbSet<LoyaltyTransaction> LoyaltyTransactions => Set<LoyaltyTransaction>();

    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
    public DbSet<StockTransfer> StockTransfers => Set<StockTransfer>();
    public DbSet<StockTransferItem> StockTransferItems => Set<StockTransferItem>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Installment> Installments => Set<Installment>();
    public DbSet<InstallmentPayment> InstallmentPayments => Set<InstallmentPayment>();
    public DbSet<FinanceAccount> FinanceAccounts => Set<FinanceAccount>();
    public DbSet<FinanceTransaction> FinanceTransactions => Set<FinanceTransaction>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Payroll> Payrolls => Set<Payroll>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    // Notifications
    public DbSet<Notification> Notifications => Set<Notification>();

    // Store Settings
    public DbSet<TenantCurrency> TenantCurrencies => Set<TenantCurrency>();
    public DbSet<TenantTaxConfig> TenantTaxConfigs => Set<TenantTaxConfig>();
    public DbSet<TenantIntegration> TenantIntegrations => Set<TenantIntegration>();

    // Sales Reps
    public DbSet<SalesRep> SalesReps => Set<SalesRep>();
    public DbSet<SalesRepTransaction> SalesRepTransactions => Set<SalesRepTransaction>();
    public DbSet<SalesRepCommission> SalesRepCommissions => Set<SalesRepCommission>();
    public DbSet<SubscriptionRequest> SubscriptionRequests => Set<SubscriptionRequest>();
    public DbSet<PaymentGatewayConfig> PaymentGatewayConfigs => Set<PaymentGatewayConfig>();
    public DbSet<OnlinePayment> OnlinePayments => Set<OnlinePayment>();
    public DbSet<OtpConfig> OtpConfigs => Set<OtpConfig>();
    public DbSet<OtpLog> OtpLogs => Set<OtpLog>();
    public DbSet<AttendanceDevice> AttendanceDevices => Set<AttendanceDevice>();
    public DbSet<AttendancePunch> AttendancePunches => Set<AttendancePunch>();
    public DbSet<SalaryConfig> SalaryConfigs => Set<SalaryConfig>();
    public DbSet<PayrollItem> PayrollItems => Set<PayrollItem>();
    public DbSet<PayrollCheck> PayrollChecks => Set<PayrollCheck>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<BranchRequest> BranchRequests => Set<BranchRequest>();
    public DbSet<FloorSection> FloorSections => Set<FloorSection>();
    public DbSet<RestaurantTable> RestaurantTables => Set<RestaurantTable>();
    public DbSet<DineOrder> DineOrders => Set<DineOrder>();
    public DbSet<DineOrderItem> DineOrderItems => Set<DineOrderItem>();
    public DbSet<StoreQrConfig> StoreQrConfigs => Set<StoreQrConfig>();
    public DbSet<CustomerSession> CustomerSessions => Set<CustomerSession>();
    public DbSet<CustomerOrder> CustomerOrders => Set<CustomerOrder>();
    public DbSet<CustomerOrderItem> CustomerOrderItems => Set<CustomerOrderItem>();
    public DbSet<PaymentTerminal> PaymentTerminals => Set<PaymentTerminal>();
    public DbSet<TerminalTransaction> TerminalTransactions => Set<TerminalTransaction>();

    // RFID & QR Inventory
    public DbSet<ProductRfidTag> ProductRfidTags => Set<ProductRfidTag>();
    public DbSet<WarehouseQrCode> WarehouseQrCodes => Set<WarehouseQrCode>();
    public DbSet<RfidScanSession> RfidScanSessions => Set<RfidScanSession>();
    public DbSet<RfidScanResult> RfidScanResults => Set<RfidScanResult>();

    // Production & Kitchen
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
    public DbSet<KitchenStation> KitchenStations => Set<KitchenStation>();
    public DbSet<ProductKitchenStation> ProductKitchenStations => Set<ProductKitchenStation>();
    public DbSet<ProductionOrder> ProductionOrders => Set<ProductionOrder>();
    public DbSet<ProductionOrderItem> ProductionOrderItems => Set<ProductionOrderItem>();
    public DbSet<ProductionWaste> ProductionWastes => Set<ProductionWaste>();

    public DbSet<BundleItem> BundleItems => Set<BundleItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ========================================================
        // CRITICAL: Global query filters for tenant isolation
        // ========================================================
        // User filter: bypassed ONLY during login (TenantId == Guid.Empty)
        // because the user doesn't know their TenantId yet.
        // AuthService handles scoping by username (unique per tenant).
        modelBuilder.Entity<User>().HasQueryFilter(e =>
            _tenantService == null ||
            _tenantService.TenantId == Guid.Empty ||
            (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // ALL other entities: STRICT tenant isolation.
        // No Guid.Empty bypass — if TenantId is not set, return NOTHING.
        modelBuilder.Entity<Category>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<Unit>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<Product>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<Warehouse>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<StockTransfer>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<Contact>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<Invoice>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<Installment>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<FinanceAccount>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<Employee>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // Entities with TenantId but NOT extending TenantEntity — add manual filters
        modelBuilder.Entity<Inventory>().HasQueryFilter(e => _tenantService == null || e.TenantId == _tenantService.TenantId);
        modelBuilder.Entity<InventoryTransaction>().HasQueryFilter(e => _tenantService == null || e.TenantId == _tenantService.TenantId);
        modelBuilder.Entity<FinanceTransaction>().HasQueryFilter(e => _tenantService == null || e.TenantId == _tenantService.TenantId);
        modelBuilder.Entity<Attendance>().HasQueryFilter(e => _tenantService == null || e.TenantId == _tenantService.TenantId);
        modelBuilder.Entity<Payroll>().HasQueryFilter(e => _tenantService == null || e.TenantId == _tenantService.TenantId);
        modelBuilder.Entity<AuditLog>().HasQueryFilter(e => _tenantService == null || e.TenantId == _tenantService.TenantId);

        // HR entities: STRICT tenant isolation
        modelBuilder.Entity<AttendanceDevice>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<AttendancePunch>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<SalaryConfig>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<PayrollCheck>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // Branch entities: STRICT tenant isolation
        modelBuilder.Entity<Branch>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<BranchRequest>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // Floor Sections: STRICT tenant isolation
        modelBuilder.Entity<FloorSection>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // QR Config: tenant isolation (for store owner management)
        modelBuilder.Entity<StoreQrConfig>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        // NOTE: CustomerSession and CustomerOrder do NOT have tenant query filters
        //       because they are accessed via public QR code / session token

        // Payment Terminal: tenant isolation
        modelBuilder.Entity<PaymentTerminal>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<TerminalTransaction>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // Waiter / Table entities: STRICT tenant isolation
        modelBuilder.Entity<RestaurantTable>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<DineOrder>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // Payment & OTP entities: STRICT tenant isolation
        modelBuilder.Entity<PaymentGatewayConfig>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<OnlinePayment>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<OtpConfig>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<OtpLog>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // Production & Kitchen: STRICT tenant isolation
        modelBuilder.Entity<Recipe>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<RecipeIngredient>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<KitchenStation>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<ProductionOrder>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<ProductionWaste>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // Bundle items: tenant isolation
        modelBuilder.Entity<BundleItem>().HasQueryFilter(e => _tenantService == null || e.TenantId == _tenantService.TenantId);

        // Loyalty
        modelBuilder.Entity<LoyaltyProgram>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<CustomerLoyalty>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<LoyaltyTransaction>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // Notifications
        modelBuilder.Entity<Notification>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // Store Settings
        modelBuilder.Entity<TenantCurrency>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<TenantTaxConfig>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<TenantIntegration>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // Sales Reps
        modelBuilder.Entity<SalesRep>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<SalesRepTransaction>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));
        modelBuilder.Entity<SalesRepCommission>().HasQueryFilter(e => _tenantService == null || (!e.IsDeleted && e.TenantId == _tenantService.TenantId));

        // Tenant
        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.PlanId);
            e.HasIndex(x => x.Status);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.OwnerName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(20).IsRequired();
            e.Property(x => x.City).HasMaxLength(100).IsRequired();
            e.Property(x => x.CurrencyCode).HasMaxLength(10);
            e.HasOne(x => x.Plan).WithMany().HasForeignKey(x => x.PlanId).OnDelete(DeleteBehavior.Restrict);
        });

        // Plan
        modelBuilder.Entity<Plan>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.MonthlyPrice).HasPrecision(10, 2);
            e.Property(x => x.YearlyPrice).HasPrecision(10, 2);
        });

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.Username }).IsUnique();
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.Username).HasMaxLength(100).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Role).HasMaxLength(50);
            e.HasMany(x => x.Permissions).WithOne(x => x.User).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // UserPermission
        modelBuilder.Entity<UserPermission>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UserId, x.Permission }).IsUnique();
            e.Property(x => x.Permission).HasMaxLength(100).IsRequired();
        });

        // Category
        modelBuilder.Entity<Category>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => x.ParentId);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.Parent).WithMany(x => x.Children).HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
        });

        // Unit
        modelBuilder.Entity<Unit>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.ConversionRate).HasPrecision(18, 6);
            e.HasOne(x => x.BaseUnit).WithMany().HasForeignKey(x => x.BaseUnitId).OnDelete(DeleteBehavior.Restrict);
        });

        // Product
        modelBuilder.Entity<Product>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => x.Barcode);
            e.HasIndex(x => x.SKU);
            e.HasIndex(x => x.CategoryId);
            e.Property(x => x.Name).HasMaxLength(300).IsRequired();
            e.Property(x => x.CostPrice).HasPrecision(18, 2);
            e.Property(x => x.RetailPrice).HasPrecision(18, 2);
            e.Property(x => x.HalfWholesalePrice).HasPrecision(18, 2);
            e.Property(x => x.WholesalePrice).HasPrecision(18, 2);
            e.Property(x => x.Price4).HasPrecision(18, 2);
            e.Property(x => x.MinStock).HasPrecision(18, 2);
            e.Property(x => x.MaxStock).HasPrecision(18, 2);
            e.Property(x => x.TaxRate).HasPrecision(5, 2);
            e.HasOne(x => x.Category).WithMany(x => x.Products).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Unit).WithMany().HasForeignKey(x => x.UnitId).OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.BundleDiscountValue).HasPrecision(18, 2);
            e.HasIndex(x => x.IsBundle);
        });

        // BundleItem
        modelBuilder.Entity<BundleItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.ProductId, x.ComponentId }).IsUnique();
            e.HasIndex(x => x.ProductId);
            e.Property(x => x.Quantity).HasPrecision(18, 2);
            e.HasOne(x => x.Product).WithMany(x => x.BundleItems).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Component).WithMany().HasForeignKey(x => x.ComponentId).OnDelete(DeleteBehavior.Restrict);
        });

        // Warehouse
        modelBuilder.Entity<Warehouse>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        });

        // Inventory
        modelBuilder.Entity<Inventory>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.ProductId, x.WarehouseId }).IsUnique();
            e.Property(x => x.Quantity).HasPrecision(18, 2);
            e.Property(x => x.ReservedQty).HasPrecision(18, 2);
            e.HasOne(x => x.Product).WithMany(x => x.InventoryItems).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Warehouse).WithMany().HasForeignKey(x => x.WarehouseId).OnDelete(DeleteBehavior.Restrict);
        });

        // InventoryTransaction
        modelBuilder.Entity<InventoryTransaction>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.ProductId, x.WarehouseId });
            e.HasIndex(x => x.CreatedAt);
            e.Property(x => x.Quantity).HasPrecision(18, 2);
            e.Property(x => x.PreviousQty).HasPrecision(18, 2);
            e.Property(x => x.NewQty).HasPrecision(18, 2);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Warehouse).WithMany().HasForeignKey(x => x.WarehouseId).OnDelete(DeleteBehavior.Restrict);
        });

        // StockTransfer
        modelBuilder.Entity<StockTransfer>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => x.TransferNumber).IsUnique();
            e.Property(x => x.TransferNumber).HasMaxLength(50).IsRequired();
            e.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.TransferId).OnDelete(DeleteBehavior.Cascade);
        });

        // StockTransferItem (no Product navigation - use HasOne<Product>)
        modelBuilder.Entity<StockTransferItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TransferId);
            e.Property(x => x.Quantity).HasPrecision(18, 2);
            e.Property(x => x.ReceivedQty).HasPrecision(18, 2);
            e.HasOne<Product>().WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        // Contact
        modelBuilder.Entity<Contact>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.CreditLimit).HasPrecision(18, 2);
            e.Property(x => x.Balance).HasPrecision(18, 2);
        });

        // Invoice
        modelBuilder.Entity<Invoice>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => new { x.TenantId, x.InvoiceNumber }).IsUnique();
            e.HasIndex(x => x.InvoiceDate);
            e.Property(x => x.InvoiceNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.SubTotal).HasPrecision(18, 2);
            e.Property(x => x.DiscountAmount).HasPrecision(18, 2);
            e.Property(x => x.DiscountPercent).HasPrecision(5, 2);
            e.Property(x => x.TaxAmount).HasPrecision(18, 2);
            e.Property(x => x.TotalAmount).HasPrecision(18, 2);
            e.Property(x => x.PaidAmount).HasPrecision(18, 2);
            e.Property(x => x.DueAmount).HasPrecision(18, 2);
            e.HasOne(x => x.Contact).WithMany(x => x.Invoices).HasForeignKey(x => x.ContactId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Warehouse).WithMany().HasForeignKey(x => x.WarehouseId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Creator).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(x => x.Items).WithOne(x => x.Invoice).HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        });

        // InvoiceItem
        modelBuilder.Entity<InvoiceItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.InvoiceId);
            e.Property(x => x.Quantity).HasPrecision(18, 2);
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);
            e.Property(x => x.CostPrice).HasPrecision(18, 2);
            e.Property(x => x.DiscountAmount).HasPrecision(18, 2);
            e.Property(x => x.TaxAmount).HasPrecision(18, 2);
            e.Property(x => x.TotalPrice).HasPrecision(18, 2);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.BundleParentId);
            e.HasOne(x => x.BundleParent).WithMany(x => x.BundleChildren).HasForeignKey(x => x.BundleParentId).OnDelete(DeleteBehavior.Restrict);
        });

        // Installment
        modelBuilder.Entity<Installment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.TotalAmount).HasPrecision(18, 2);
            e.Property(x => x.DownPayment).HasPrecision(18, 2);
            e.Property(x => x.PaymentAmount).HasPrecision(18, 2);
            e.HasOne(x => x.Invoice).WithMany().HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Contact).WithMany().HasForeignKey(x => x.ContactId).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(x => x.Payments).WithOne().HasForeignKey(x => x.InstallmentId).OnDelete(DeleteBehavior.Cascade);
        });

        // InstallmentPayment
        modelBuilder.Entity<InstallmentPayment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.InstallmentId);
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.Property(x => x.PaidAmount).HasPrecision(18, 2);
        });

        // FinanceAccount
        modelBuilder.Entity<FinanceAccount>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Balance).HasPrecision(18, 2);
        });

        // FinanceTransaction
        modelBuilder.Entity<FinanceTransaction>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.AccountId });
            e.HasIndex(x => x.CreatedAt);
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.Property(x => x.BalanceBefore).HasPrecision(18, 2);
            e.Property(x => x.BalanceAfter).HasPrecision(18, 2);
            e.HasOne(x => x.Account).WithMany().HasForeignKey(x => x.AccountId).OnDelete(DeleteBehavior.Restrict);
        });

        // Employee
        modelBuilder.Entity<Employee>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.BasicSalary).HasPrecision(18, 2);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        // Attendance (no Employee navigation - use HasOne<Employee>)
        modelBuilder.Entity<Attendance>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.EmployeeId, x.AttendanceDate }).IsUnique();
            e.HasOne<Employee>().WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        // Payroll
        modelBuilder.Entity<Payroll>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.EmployeeId, x.Month, x.Year }).IsUnique();
            e.Property(x => x.BasicSalary).HasPrecision(18, 2);
            e.Property(x => x.Allowances).HasPrecision(18, 2);
            e.Property(x => x.Deductions).HasPrecision(18, 2);
            e.Property(x => x.Bonus).HasPrecision(18, 2);
            e.Property(x => x.OvertimeAmount).HasPrecision(18, 2);
            e.Property(x => x.PenaltyAmount).HasPrecision(18, 2);
            e.Property(x => x.NetSalary).HasPrecision(18, 2);
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(x => x.Items).WithOne(x => x.Payroll).HasForeignKey(x => x.PayrollId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Checks).WithOne(x => x.PayrollNav).HasForeignKey(x => x.PayrollId).OnDelete(DeleteBehavior.Restrict);
        });

        // AttendanceDevice
        modelBuilder.Entity<AttendanceDevice>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.IpAddress).HasMaxLength(100).IsRequired();
        });

        // AttendancePunch
        modelBuilder.Entity<AttendancePunch>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.EmployeeId, x.PunchTime });
            e.HasIndex(x => x.PunchTime);
            e.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Device).WithMany().HasForeignKey(x => x.DeviceId).OnDelete(DeleteBehavior.SetNull);
        });

        // SalaryConfig
        modelBuilder.Entity<SalaryConfig>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.EmployeeId });
            e.Property(x => x.ItemName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.HasOne(x => x.Employee).WithMany(x => x.SalaryConfigs).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        // PayrollItem (property config only — relationship defined in Payroll entity)
        modelBuilder.Entity<PayrollItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.PayrollId);
            e.Property(x => x.ItemName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Amount).HasPrecision(18, 2);
        });

        // PayrollCheck (property config only — relationship defined in Payroll entity)
        modelBuilder.Entity<PayrollCheck>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.PayrollId });
            e.HasIndex(x => x.CheckNumber);
            e.Property(x => x.CheckNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.Amount).HasPrecision(18, 2);
        });

        // Branch
        modelBuilder.Entity<Branch>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.MonthlyFee).HasPrecision(10, 2);
            e.HasMany(x => x.Warehouses).WithOne(x => x.Branch).HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.SetNull);
        });

        // BranchRequest
        modelBuilder.Entity<BranchRequest>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => x.Status);
            e.Property(x => x.BranchName).HasMaxLength(200).IsRequired();
            e.Property(x => x.RequestedFee).HasPrecision(10, 2);
            e.HasOne(x => x.ActivatedBranch).WithMany().HasForeignKey(x => x.ActivatedBranchId).OnDelete(DeleteBehavior.SetNull);
        });

        // FloorSection (Zone / Area)
        modelBuilder.Entity<FloorSection>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Color).HasMaxLength(20);
            e.Property(x => x.Icon).HasMaxLength(30);
            e.Property(x => x.ServiceChargePercent).HasPrecision(10, 2);
            e.HasOne(x => x.Branch).WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Tables).WithOne(x => x.FloorSection).HasForeignKey(x => x.SectionId).OnDelete(DeleteBehavior.SetNull);
        });

        // RestaurantTable
        modelBuilder.Entity<RestaurantTable>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.TableNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.MinOrderAmount).HasPrecision(10, 2);
            e.HasOne(x => x.Branch).WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.SetNull);
        });

        // DineOrder
        modelBuilder.Entity<DineOrder>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => x.Status);
            e.Property(x => x.OrderNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.SubTotal).HasPrecision(18, 2);
            e.Property(x => x.DiscountAmount).HasPrecision(18, 2);
            e.Property(x => x.TaxAmount).HasPrecision(18, 2);
            e.Property(x => x.TotalAmount).HasPrecision(18, 2);
            e.HasOne(x => x.Table).WithMany(t => t.Orders).HasForeignKey(x => x.TableId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Waiter).WithMany().HasForeignKey(x => x.WaiterId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Invoice).WithMany().HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Items).WithOne(x => x.Order).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        // DineOrderItem
        modelBuilder.Entity<DineOrderItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Quantity).HasPrecision(18, 2);
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);
            e.Property(x => x.TotalPrice).HasPrecision(18, 2);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        // StoreQrConfig
        modelBuilder.Entity<StoreQrConfig>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Code).IsUnique();
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.Code).HasMaxLength(100).IsRequired();
            e.Property(x => x.ServiceChargePercent).HasPrecision(5, 2);
            e.HasOne(x => x.Table).WithMany().HasForeignKey(x => x.TableId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Branch).WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.SetNull);
        });

        // CustomerSession (NO tenant filter — accessed via public QR code)
        modelBuilder.Entity<CustomerSession>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.SessionToken).IsUnique();
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.SessionToken).HasMaxLength(100).IsRequired();
            e.HasOne(x => x.QrConfig).WithMany().HasForeignKey(x => x.QrConfigId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        // CustomerOrder (NO tenant filter — accessed via session token)
        modelBuilder.Entity<CustomerOrder>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.SessionId);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => x.OrderNumber);
            e.Property(x => x.OrderNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.SubTotal).HasPrecision(18, 2);
            e.Property(x => x.TaxAmount).HasPrecision(18, 2);
            e.Property(x => x.ServiceCharge).HasPrecision(18, 2);
            e.Property(x => x.TotalAmount).HasPrecision(18, 2);
            e.HasOne(x => x.Session).WithMany(s => s.Orders).HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.DineOrder).WithMany().HasForeignKey(x => x.DineOrderId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Table).WithMany().HasForeignKey(x => x.TableId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Items).WithOne(x => x.Order).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        // CustomerOrderItem
        modelBuilder.Entity<CustomerOrderItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Quantity).HasPrecision(18, 2);
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);
            e.Property(x => x.TotalPrice).HasPrecision(18, 2);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        // PaymentTerminal
        modelBuilder.Entity<PaymentTerminal>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Currency).HasMaxLength(10);
            e.HasOne(x => x.Branch).WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.SetNull);
        });

        // TerminalTransaction
        modelBuilder.Entity<TerminalTransaction>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => x.ReferenceNumber);
            e.Property(x => x.ReferenceNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.Property(x => x.TipAmount).HasPrecision(18, 2);
            e.HasOne(x => x.Terminal).WithMany(t => t.Transactions).HasForeignKey(x => x.TerminalId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Invoice).WithMany().HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.SetNull);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.CreatedAt });
            e.Property(x => x.Action).HasMaxLength(100).IsRequired();
            e.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
        });

        // PaymentGatewayConfig
        modelBuilder.Entity<PaymentGatewayConfig>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => new { x.TenantId, x.IsDefault });
            e.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
            e.Property(x => x.MinAmount).HasPrecision(18, 2);
            e.Property(x => x.MaxAmount).HasPrecision(18, 2);
        });

        // OnlinePayment
        modelBuilder.Entity<OnlinePayment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => x.GatewayTransactionId);
            e.HasIndex(x => x.InvoiceId);
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.HasOne(x => x.GatewayConfig).WithMany().HasForeignKey(x => x.GatewayConfigId).OnDelete(DeleteBehavior.Restrict);
        });

        // OtpConfig
        modelBuilder.Entity<OtpConfig>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => new { x.TenantId, x.IsDefault });
            e.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
        });

        // OtpLog
        modelBuilder.Entity<OtpLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TenantId, x.Phone, x.Purpose });
            e.HasIndex(x => x.ExpiresAt);
            e.Property(x => x.Phone).HasMaxLength(20).IsRequired();
            e.Property(x => x.Code).HasMaxLength(10).IsRequired();
            e.HasOne(x => x.OtpConfig).WithMany().HasForeignKey(x => x.OtpConfigId).OnDelete(DeleteBehavior.Restrict);
        });

        // Recipe
        modelBuilder.Entity<Recipe>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => new { x.TenantId, x.Code }).IsUnique();
            e.HasIndex(x => x.ProductId);
            e.HasIndex(x => x.Status);
            e.Property(x => x.Code).HasMaxLength(50).IsRequired();
            e.Property(x => x.Name).HasMaxLength(300).IsRequired();
            e.Property(x => x.YieldQuantity).HasPrecision(18, 4);
            e.Property(x => x.CalculatedCost).HasPrecision(18, 2);
            e.Property(x => x.CalculatedFoodCostPercent).HasPrecision(5, 2);
            e.Property(x => x.TargetFoodCostPercent).HasPrecision(5, 2);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.YieldUnit).WithMany().HasForeignKey(x => x.YieldUnitId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ParentRecipe).WithMany().HasForeignKey(x => x.ParentRecipeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Branch).WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Ingredients).WithOne(x => x.Recipe).HasForeignKey(x => x.RecipeId).OnDelete(DeleteBehavior.Cascade);
        });

        // RecipeIngredient
        modelBuilder.Entity<RecipeIngredient>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.RecipeId);
            e.Property(x => x.Quantity).HasPrecision(18, 4);
            e.Property(x => x.WastePercent).HasPrecision(5, 2);
            e.Property(x => x.UnitCost).HasPrecision(18, 4);
            e.Property(x => x.TotalCost).HasPrecision(18, 4);
            e.HasOne(x => x.RawMaterial).WithMany().HasForeignKey(x => x.RawMaterialId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.SubRecipe).WithMany().HasForeignKey(x => x.SubRecipeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Unit).WithMany().HasForeignKey(x => x.UnitId).OnDelete(DeleteBehavior.Restrict);
        });

        // KitchenStation
        modelBuilder.Entity<KitchenStation>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => new { x.TenantId, x.Code }).IsUnique();
            e.Property(x => x.Code).HasMaxLength(50).IsRequired();
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Color).HasMaxLength(20);
            e.HasOne(x => x.Branch).WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.SetNull);
        });

        // ProductKitchenStation
        modelBuilder.Entity<ProductKitchenStation>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.ProductId, x.KitchenStationId }).IsUnique();
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.KitchenStation).WithMany(s => s.ProductStations).HasForeignKey(x => x.KitchenStationId).OnDelete(DeleteBehavior.Cascade);
        });

        // ProductionOrder
        modelBuilder.Entity<ProductionOrder>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => new { x.TenantId, x.Code }).IsUnique();
            e.HasIndex(x => x.Status);
            e.Property(x => x.Code).HasMaxLength(50).IsRequired();
            e.Property(x => x.PlannedQuantity).HasPrecision(18, 4);
            e.Property(x => x.ActualQuantity).HasPrecision(18, 4);
            e.Property(x => x.EstimatedCost).HasPrecision(18, 2);
            e.Property(x => x.ActualCost).HasPrecision(18, 2);
            e.HasOne(x => x.Recipe).WithMany().HasForeignKey(x => x.RecipeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.PlannedUnit).WithMany().HasForeignKey(x => x.PlannedUnitId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.TargetWarehouse).WithMany().HasForeignKey(x => x.TargetWarehouseId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.SourceWarehouse).WithMany().HasForeignKey(x => x.SourceWarehouseId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Branch).WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Items).WithOne(x => x.ProductionOrder).HasForeignKey(x => x.ProductionOrderId).OnDelete(DeleteBehavior.Cascade);
        });

        // ProductionOrderItem
        modelBuilder.Entity<ProductionOrderItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ProductionOrderId);
            e.Property(x => x.RequiredQuantity).HasPrecision(18, 4);
            e.Property(x => x.ActualQuantityUsed).HasPrecision(18, 4);
            e.Property(x => x.UnitCost).HasPrecision(18, 4);
            e.Property(x => x.TotalCost).HasPrecision(18, 4);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Unit).WithMany().HasForeignKey(x => x.UnitId).OnDelete(DeleteBehavior.Restrict);
        });

        // ProductionWaste
        modelBuilder.Entity<ProductionWaste>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => x.ReportedAt);
            e.Property(x => x.Quantity).HasPrecision(18, 4);
            e.Property(x => x.EstimatedCost).HasPrecision(18, 2);
            e.HasOne(x => x.ProductionOrder).WithMany().HasForeignKey(x => x.ProductionOrderId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Unit).WithMany().HasForeignKey(x => x.UnitId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Branch).WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.SetNull);
        });

        // Sales Reps configuration
        modelBuilder.Entity<SalesRep>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => new { x.TenantId, x.UserId }).IsUnique();
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.CommissionPercent).HasPrecision(5, 2);
            e.Property(x => x.FixedBonus).HasPrecision(18, 2);
            e.Property(x => x.OutstandingBalance).HasPrecision(18, 2);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.AssignedWarehouse).WithMany().HasForeignKey(x => x.AssignedWarehouseId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SalesRepTransaction>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => x.SalesRepId);
            e.HasIndex(x => x.TransactionDate);
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.Property(x => x.BalanceAfter).HasPrecision(18, 2);
            e.HasOne(x => x.SalesRep).WithMany(r => r.Transactions).HasForeignKey(x => x.SalesRepId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Invoice).WithMany().HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SalesRepCommission>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TenantId);
            e.HasIndex(x => new { x.SalesRepId, x.Year, x.Month }).IsUnique();
            e.Property(x => x.TotalPaidSales).HasPrecision(18, 2);
            e.Property(x => x.CommissionPercent).HasPrecision(5, 2);
            e.Property(x => x.CommissionAmount).HasPrecision(18, 2);
            e.Property(x => x.FixedBonus).HasPrecision(18, 2);
            e.Property(x => x.TotalEarned).HasPrecision(18, 2);
            e.Property(x => x.PaidAmount).HasPrecision(18, 2);
            e.HasOne(x => x.SalesRep).WithMany(r => r.Commissions).HasForeignKey(x => x.SalesRepId).OnDelete(DeleteBehavior.Restrict);
        });

        // Invoice → SalesRep (optional)
        modelBuilder.Entity<Invoice>(e =>
        {
            e.HasOne(x => x.SalesRep).WithMany().HasForeignKey(x => x.SalesRepId).OnDelete(DeleteBehavior.SetNull);
        });

        // Seed Plans
        modelBuilder.Entity<Plan>().HasData(
            new Plan { Id = 1, Name = "أساسي", MonthlyPrice = 1400, YearlyPrice = 14000, MaxUsers = 3, MaxWarehouses = 1, MaxPosStations = 1, MaxProducts = 500, MaxBranches = 0, BranchMonthlyPrice = 0, IsActive = true },
            new Plan { Id = 2, Name = "متقدم", MonthlyPrice = 2800, YearlyPrice = 28000, MaxUsers = 10, MaxWarehouses = 3, MaxPosStations = 3, MaxProducts = 2000, MaxBranches = 3, BranchMonthlyPrice = 800, BranchYearlyPrice = 8000, IsActive = true },
            new Plan { Id = 3, Name = "احترافي", MonthlyPrice = 4200, YearlyPrice = 42000, MaxUsers = 50, MaxWarehouses = 10, MaxPosStations = 10, MaxProducts = null, MaxBranches = 10, BranchMonthlyPrice = 600, BranchYearlyPrice = 6000, IsActive = true }
        );
    }

    /// <summary>
    /// Stamps timestamps, auto-assigns TenantId, and rejects any attempt to save
    /// a TenantEntity without a tenant or to change a tenant id post-creation.
    /// MUST be invoked from every SaveChanges entry point (sync and async).
    /// </summary>
    private void EnforceTenantInvariantsBeforeSave()
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    if (entry.Entity is TenantEntity tenantEntity)
                    {
                        // Auto-assign TenantId ONLY if not explicitly set
                        // (allows SuperAdmin to create entities for other tenants)
                        if (tenantEntity.TenantId == Guid.Empty &&
                            _tenantService != null && _tenantService.TenantId != Guid.Empty)
                        {
                            tenantEntity.TenantId = _tenantService.TenantId;
                        }
                        // CRITICAL: Reject saving a TenantEntity without TenantId
                        if (tenantEntity.TenantId == Guid.Empty)
                        {
                            throw new InvalidOperationException(
                                $"Cannot save {entry.Entity.GetType().Name} without TenantId. " +
                                "This is a critical security violation — tenant context is missing.");
                        }
                    }
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    // CRITICAL: Prevent changing TenantId on update
                    if (entry.Entity is TenantEntity modifiedTenant)
                    {
                        var originalTenantId = entry.OriginalValues.GetValue<Guid>(nameof(TenantEntity.TenantId));
                        if (modifiedTenant.TenantId != originalTenantId)
                        {
                            throw new InvalidOperationException(
                                "Cannot change TenantId of an existing entity. " +
                                "This is a critical security violation.");
                        }
                    }
                    break;
            }
        }
    }

    public override int SaveChanges()
    {
        EnforceTenantInvariantsBeforeSave();
        return base.SaveChanges();
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        EnforceTenantInvariantsBeforeSave();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        EnforceTenantInvariantsBeforeSave();
        return await base.SaveChangesAsync(cancellationToken);
    }

    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        EnforceTenantInvariantsBeforeSave();
        return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }
}
