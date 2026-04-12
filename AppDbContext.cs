namespace MsCashier.Infrastructure.Data;

using Microsoft.EntityFrameworkCore;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;

public class AppDbContext : DbContext
{
    private readonly ICurrentTenantService? _tenantService;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentTenantService? tenantService = null)
        : base(options)
    {
        _tenantService = tenantService;
    }

    // === DbSets ===
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Product> Products => Set<Product>();
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // === GLOBAL QUERY FILTERS (Multi-Tenant + Soft Delete) ===
        // هنا السحر: كل query تلقائياً بيتم فلترتها بالـ TenantId

        modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService!.TenantId);
        modelBuilder.Entity<Product>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService!.TenantId);
        modelBuilder.Entity<Category>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService!.TenantId);
        modelBuilder.Entity<Contact>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService!.TenantId);
        modelBuilder.Entity<Invoice>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService!.TenantId);
        modelBuilder.Entity<Warehouse>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService!.TenantId);
        modelBuilder.Entity<Employee>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService!.TenantId);

        // === Entity Configurations ===

        // Tenant
        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasIndex(t => t.Phone).IsUnique();
            e.Property(t => t.Name).HasMaxLength(200);
            e.Property(t => t.Settings).HasColumnType("nvarchar(max)");
            e.HasQueryFilter(t => !t.IsDeleted);
        });

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => new { u.TenantId, u.Username }).IsUnique();
            e.Property(u => u.Username).HasMaxLength(100);
            e.Property(u => u.PasswordHash).HasMaxLength(500);
        });

        // Product
        modelBuilder.Entity<Product>(e =>
        {
            e.HasIndex(p => new { p.TenantId, p.Barcode }).IsUnique().HasFilter("[Barcode] IS NOT NULL AND [IsDeleted] = 0");
            e.Property(p => p.CostPrice).HasColumnType("decimal(18,2)");
            e.Property(p => p.RetailPrice).HasColumnType("decimal(18,2)");
            e.Property(p => p.WholesalePrice).HasColumnType("decimal(18,2)");
            e.Property(p => p.HalfWholesalePrice).HasColumnType("decimal(18,2)");
        });

        // Inventory
        modelBuilder.Entity<Inventory>(e =>
        {
            e.HasIndex(i => new { i.TenantId, i.ProductId, i.WarehouseId }).IsUnique();
            e.Property(i => i.Quantity).HasColumnType("decimal(18,3)");
        });

        // Invoice
        modelBuilder.Entity<Invoice>(e =>
        {
            e.HasIndex(i => new { i.TenantId, i.InvoiceNumber, i.InvoiceType }).IsUnique();
            e.HasIndex(i => new { i.TenantId, i.InvoiceDate });
            e.Property(i => i.TotalAmount).HasColumnType("decimal(18,2)");
            e.Property(i => i.SubTotal).HasColumnType("decimal(18,2)");
            e.Property(i => i.PaidAmount).HasColumnType("decimal(18,2)");
            e.Property(i => i.DueAmount).HasColumnType("decimal(18,2)");

            e.HasMany(i => i.Items).WithOne(ii => ii.Invoice).HasForeignKey(ii => ii.InvoiceId);
            e.HasOne(i => i.Contact).WithMany(c => c.Invoices).HasForeignKey(i => i.ContactId);
        });

        // InvoiceItem
        modelBuilder.Entity<InvoiceItem>(e =>
        {
            e.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
            e.Property(i => i.CostPrice).HasColumnType("decimal(18,2)");
            e.Property(i => i.TotalPrice).HasColumnType("decimal(18,2)");
        });

        // Contact
        modelBuilder.Entity<Contact>(e =>
        {
            e.HasIndex(c => new { c.TenantId, c.ContactType });
            e.Property(c => c.Balance).HasColumnType("decimal(18,2)");
            e.Property(c => c.CreditLimit).HasColumnType("decimal(18,2)");
        });

        // Finance
        modelBuilder.Entity<FinanceAccount>(e =>
        {
            e.Property(a => a.Balance).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<FinanceTransaction>(e =>
        {
            e.HasIndex(t => new { t.TenantId, t.CreatedAt });
            e.Property(t => t.Amount).HasColumnType("decimal(18,2)");
            e.Property(t => t.BalanceBefore).HasColumnType("decimal(18,2)");
            e.Property(t => t.BalanceAfter).HasColumnType("decimal(18,2)");
        });

        // Employee & Payroll
        modelBuilder.Entity<Employee>(e =>
        {
            e.Property(emp => emp.BasicSalary).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<Payroll>(e =>
        {
            e.HasIndex(p => new { p.EmployeeId, p.Month, p.Year }).IsUnique();
            e.Property(p => p.NetSalary).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<Attendance>(e =>
        {
            e.HasIndex(a => new { a.EmployeeId, a.AttendanceDate }).IsUnique();
        });

        // Installment
        modelBuilder.Entity<Installment>(e =>
        {
            e.Property(i => i.TotalAmount).HasColumnType("decimal(18,2)");
            e.Property(i => i.PaymentAmount).HasColumnType("decimal(18,2)");
            e.HasMany(i => i.Payments).WithOne().HasForeignKey(p => p.InstallmentId);
        });

        // Seed Plans
        modelBuilder.Entity<Plan>().HasData(
            new Plan { Id = 1, Name = "أساسي", MonthlyPrice = 1400, YearlyPrice = 14000, MaxUsers = 3, MaxWarehouses = 1, MaxPosStations = 1, Features = "[\"pos\",\"inventory\",\"basic_reports\"]" },
            new Plan { Id = 2, Name = "متقدم", MonthlyPrice = 2800, YearlyPrice = 28000, MaxUsers = 10, MaxWarehouses = 3, MaxPosStations = 3, Features = "[\"pos\",\"inventory\",\"advanced_reports\",\"installments\",\"multi_warehouse\"]" },
            new Plan { Id = 3, Name = "احترافي", MonthlyPrice = 4200, YearlyPrice = 42000, MaxUsers = 99, MaxWarehouses = 99, MaxPosStations = 99, Features = "[\"pos\",\"inventory\",\"all_reports\",\"installments\",\"multi_warehouse\",\"api\"]" }
        );
    }

    public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        // Auto-set timestamps
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
                entry.Entity.CreatedAt = DateTime.UtcNow;
            else if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }

        // Auto-set TenantId for new tenant entities
        if (_tenantService?.TenantId != Guid.Empty)
        {
            foreach (var entry in ChangeTracker.Entries<TenantEntity>())
            {
                if (entry.State == EntityState.Added && entry.Entity.TenantId == Guid.Empty)
                    entry.Entity.TenantId = _tenantService.TenantId;
            }
        }

        return await base.SaveChangesAsync(ct);
    }
}

// === Entities missing from Domain (referenced in schema) ===
namespace MsCashier.Domain.Entities;

public class StockTransfer : Common.TenantEntity
{
    public int Id { get; set; }
    public string TransferNumber { get; set; } = string.Empty;
    public int FromWarehouseId { get; set; }
    public int ToWarehouseId { get; set; }
    public byte Status { get; set; } = 1;
    public string? Notes { get; set; }
    public Guid CreatedBy { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public virtual ICollection<StockTransferItem> Items { get; set; } = new List<StockTransferItem>();
}

public class StockTransferItem
{
    public int Id { get; set; }
    public int TransferId { get; set; }
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal? ReceivedQty { get; set; }
}

public class Attendance
{
    public long Id { get; set; }
    public Guid TenantId { get; set; }
    public int EmployeeId { get; set; }
    public DateTime AttendanceDate { get; set; }
    public TimeSpan? CheckIn { get; set; }
    public TimeSpan? CheckOut { get; set; }
    public byte Status { get; set; } = 1;
    public string? Notes { get; set; }
}

public class Payroll
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int EmployeeId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal Allowances { get; set; }
    public decimal Deductions { get; set; }
    public decimal Bonus { get; set; }
    public decimal NetSalary { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
