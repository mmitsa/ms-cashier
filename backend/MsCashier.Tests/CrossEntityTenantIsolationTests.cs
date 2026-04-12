using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using MsCashier.Infrastructure.Data;
using Xunit;

namespace MsCashier.Tests;

/// <summary>
/// Tenant isolation tests across the most security-sensitive entities other
/// than Product: Contact (customers/suppliers, with balances) and Invoice
/// (financial records). A leak in either of these is a hard breach of
/// multi-tenant separation.
/// </summary>
public sealed class CrossEntityTenantIsolationTests : IDisposable
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Guid _tenantA = Guid.NewGuid();
    private readonly Guid _tenantB = Guid.NewGuid();

    public CrossEntityTenantIsolationTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"cross-tenant-{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        Seed();
    }

    private void Seed()
    {
        var svc = new TestTenantService();
        using var ctx = new AppDbContext(_options, svc);

        // Tenant A — one customer + one invoice
        svc.SetTenant(_tenantA, Guid.NewGuid(), "Admin");
        ctx.Tenants.Add(NewTenant(_tenantA, "A"));
        ctx.Contacts.Add(new Contact { Name = "Customer A", ContactType = ContactType.Customer, Balance = 100m });
        ctx.Invoices.Add(new Invoice
        {
            InvoiceNumber = "INV-A-001",
            InvoiceType = InvoiceType.Sale,
            InvoiceDate = DateTime.UtcNow,
            WarehouseId = 1,
            TotalAmount = 500m,
            PaidAmount = 500m,
            DueAmount = 0m,
            PaymentMethod = PaymentMethod.Cash,
            PaymentStatus = PaymentStatus.Paid,
            CreatedBy = Guid.NewGuid(),
        });
        ctx.SaveChanges();

        // Tenant B — one customer + one invoice
        svc.SetTenant(_tenantB, Guid.NewGuid(), "Admin");
        ctx.Tenants.Add(NewTenant(_tenantB, "B"));
        ctx.Contacts.Add(new Contact { Name = "Customer B", ContactType = ContactType.Customer, Balance = 200m });
        ctx.Invoices.Add(new Invoice
        {
            InvoiceNumber = "INV-B-001",
            InvoiceType = InvoiceType.Sale,
            InvoiceDate = DateTime.UtcNow,
            WarehouseId = 2,
            TotalAmount = 999m,
            PaidAmount = 0m,
            DueAmount = 999m,
            PaymentMethod = PaymentMethod.Visa,
            PaymentStatus = PaymentStatus.Unpaid,
            CreatedBy = Guid.NewGuid(),
        });
        ctx.SaveChanges();
    }

    private static Tenant NewTenant(Guid id, string label) => new()
    {
        Id = id,
        Name = $"Tenant {label}",
        BusinessType = "Retail",
        OwnerName = "Owner",
        Phone = "0",
        City = "City",
        PlanId = 1,
        Status = TenantStatus.Active,
        SubscriptionStart = DateTime.UtcNow,
        CurrencyCode = "SAR",
    };

    private AppDbContext ContextFor(Guid tenantId)
    {
        var svc = new TestTenantService();
        svc.SetTenant(tenantId, Guid.NewGuid(), "Admin");
        return new AppDbContext(_options, svc);
    }

    // ─── Contacts ─────────────────────────────────────────────────────────

    [Fact]
    public void Tenant_A_only_sees_its_own_contacts()
    {
        using var ctx = ContextFor(_tenantA);
        var contacts = ctx.Contacts.ToList();

        contacts.Should().HaveCount(1);
        contacts[0].Name.Should().Be("Customer A");
        contacts[0].Balance.Should().Be(100m);
    }

    [Fact]
    public void Tenant_B_cannot_see_tenant_A_contact_balance()
    {
        using var ctx = ContextFor(_tenantB);
        var leakedSum = ctx.Contacts.Sum(c => c.Balance);

        // Should be 200 (B only), not 300 (A+B)
        leakedSum.Should().Be(200m);
    }

    // ─── Invoices ─────────────────────────────────────────────────────────

    [Fact]
    public void Tenant_A_only_sees_its_own_invoices()
    {
        using var ctx = ContextFor(_tenantA);
        var invoices = ctx.Invoices.ToList();

        invoices.Should().HaveCount(1);
        invoices[0].InvoiceNumber.Should().Be("INV-A-001");
    }

    [Fact]
    public void Invoice_total_aggregation_is_per_tenant()
    {
        using var aCtx = ContextFor(_tenantA);
        using var bCtx = ContextFor(_tenantB);

        aCtx.Invoices.Sum(i => i.TotalAmount).Should().Be(500m);
        bCtx.Invoices.Sum(i => i.TotalAmount).Should().Be(999m);
    }

    [Fact]
    public void Tenant_A_cannot_load_invoice_belonging_to_tenant_B()
    {
        using var bCtx = ContextFor(_tenantB);
        var bInvoiceId = bCtx.Invoices.Single().Id;

        using var aCtx = ContextFor(_tenantA);
        var leaked = aCtx.Invoices.Find(bInvoiceId);

        leaked.Should().BeNull();
    }

    [Fact]
    public void New_invoice_is_stamped_with_current_tenant_id()
    {
        using var ctx = ContextFor(_tenantA);
        var invoice = new Invoice
        {
            InvoiceNumber = "INV-A-002",
            InvoiceType = InvoiceType.Sale,
            InvoiceDate = DateTime.UtcNow,
            WarehouseId = 1,
            TotalAmount = 50m,
            PaidAmount = 50m,
            DueAmount = 0m,
            PaymentMethod = PaymentMethod.Cash,
            PaymentStatus = PaymentStatus.Paid,
            CreatedBy = Guid.NewGuid(),
        };
        ctx.Invoices.Add(invoice);
        ctx.SaveChanges();

        invoice.TenantId.Should().Be(_tenantA);
    }

    public void Dispose() { }

    private sealed class TestTenantService : ICurrentTenantService
    {
        public Guid TenantId { get; private set; }
        public Guid UserId { get; private set; }
        public string Role { get; private set; } = string.Empty;
        public void SetTenant(Guid t, Guid u, string r) { TenantId = t; UserId = u; Role = r; }
    }
}
