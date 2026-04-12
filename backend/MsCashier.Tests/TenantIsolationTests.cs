using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using MsCashier.Infrastructure.Data;
using Xunit;

namespace MsCashier.Tests;

/// <summary>
/// Tests that verify the multi-tenant isolation guarantees of AppDbContext:
///   1. Global query filters scope reads to the current tenant.
///   2. SaveChanges auto-assigns TenantId when missing.
///   3. SaveChanges rejects entities saved without a TenantId.
///   4. Updating an entity cannot change its TenantId.
///
/// These tests are the primary security regression suite for cross-tenant data
/// leakage. If any of them fail, do not deploy.
///
/// Implementation note: AppDbContext schema uses SQL-Server-specific column
/// types (nvarchar(max), decimal precision via Column attributes). The EF Core
/// in-memory provider is provider-agnostic and still applies HasQueryFilter
/// expressions and the SaveChanges override, which is what we need to verify.
/// </summary>
public sealed class TenantIsolationTests : IDisposable
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Guid _tenantA = Guid.NewGuid();
    private readonly Guid _tenantB = Guid.NewGuid();

    public TenantIsolationTests()
    {
        // Unique database name per test instance keeps tests isolated.
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"tenant-iso-{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        SeedTwoTenantsWithProducts();
    }

    private void SeedTwoTenantsWithProducts()
    {
        // Two tenants with one product each. Use a tenant-scoped context for each
        // so the SaveChanges override populates TenantId from the service.
        var unscoped = new TestTenantService();
        using var seedCtx = new AppDbContext(_options, unscoped);

        unscoped.SetTenant(_tenantA, Guid.NewGuid(), "Admin");
        seedCtx.Tenants.Add(new Tenant
        {
            Id = _tenantA,
            Name = "Tenant A",
            BusinessType = "Retail",
            OwnerName = "Owner A",
            Phone = "111",
            City = "City A",
            PlanId = 1,
            Status = TenantStatus.Active,
            SubscriptionStart = DateTime.UtcNow,
            CurrencyCode = "SAR",
        });
        seedCtx.Products.Add(new Product { Name = "Product A1", RetailPrice = 10, CostPrice = 5 });
        seedCtx.SaveChanges();

        unscoped.SetTenant(_tenantB, Guid.NewGuid(), "Admin");
        seedCtx.Tenants.Add(new Tenant
        {
            Id = _tenantB,
            Name = "Tenant B",
            BusinessType = "Retail",
            OwnerName = "Owner B",
            Phone = "222",
            City = "City B",
            PlanId = 1,
            Status = TenantStatus.Active,
            SubscriptionStart = DateTime.UtcNow,
            CurrencyCode = "SAR",
        });
        seedCtx.Products.Add(new Product { Name = "Product B1", RetailPrice = 20, CostPrice = 8 });
        seedCtx.SaveChanges();
    }

    private AppDbContext ContextFor(Guid tenantId)
    {
        var svc = new TestTenantService();
        svc.SetTenant(tenantId, Guid.NewGuid(), "Admin");
        return new AppDbContext(_options, svc);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 1. Read isolation
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void Tenant_A_can_only_see_its_own_products()
    {
        using var ctx = ContextFor(_tenantA);
        var products = ctx.Products.ToList();

        products.Should().HaveCount(1);
        products[0].Name.Should().Be("Product A1");
        products[0].TenantId.Should().Be(_tenantA);
    }

    [Fact]
    public void Tenant_B_cannot_see_tenant_A_products()
    {
        using var ctx = ContextFor(_tenantB);
        var products = ctx.Products.ToList();

        products.Should().HaveCount(1);
        products.Should().NotContain(p => p.Name == "Product A1");
    }

    [Fact]
    public void Tenant_B_cannot_load_a_tenant_A_product_by_id()
    {
        using var aCtx = ContextFor(_tenantA);
        var idA = aCtx.Products.Single().Id;

        using var bCtx = ContextFor(_tenantB);
        var found = bCtx.Products.Find(idA);

        found.Should().BeNull("query filter must hide entities owned by another tenant even on direct id lookup");
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. Write isolation: TenantId is auto-assigned and required
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void New_product_is_auto_assigned_the_current_tenant_id()
    {
        using var ctx = ContextFor(_tenantA);
        var product = new Product { Name = "Auto", RetailPrice = 1, CostPrice = 0 };
        ctx.Products.Add(product);
        ctx.SaveChanges();

        product.TenantId.Should().Be(_tenantA);
    }

    [Fact]
    public void Saving_entity_without_tenant_throws()
    {
        // No tenant scope at all → SaveChanges should reject.
        using var ctx = new AppDbContext(_options, new TestTenantService());
        ctx.Products.Add(new Product { Name = "Orphan", RetailPrice = 1, CostPrice = 0 });

        var act = () => ctx.SaveChanges();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*TenantId*");
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. TenantId is immutable after creation
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void Cannot_change_tenant_id_on_existing_product()
    {
        using var ctx = ContextFor(_tenantA);
        var product = ctx.Products.Single();

        product.TenantId = _tenantB;
        var act = () => ctx.SaveChanges();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Cannot change TenantId*");
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4. Cross-tenant queries via raw IQueryable still respect the filter
    // ─────────────────────────────────────────────────────────────────────

    [Fact]
    public void Where_predicate_targeting_other_tenant_returns_nothing()
    {
        using var ctx = ContextFor(_tenantA);
        // Even an explicit Where with the other tenant's id must be filtered out.
        var leaked = ctx.Products.Where(p => p.TenantId == _tenantB).ToList();

        leaked.Should().BeEmpty("the global query filter is ANDed before any user predicate");
    }

    [Fact]
    public void Count_does_not_leak_other_tenant_data()
    {
        using var ctx = ContextFor(_tenantA);
        ctx.Products.Count().Should().Be(1);
    }

    public void Dispose()
    {
        // In-memory database is GC'd with the options instance — nothing to do.
    }

    private sealed class TestTenantService : ICurrentTenantService
    {
        public Guid TenantId { get; private set; }
        public Guid UserId { get; private set; }
        public string Role { get; private set; } = string.Empty;

        public void SetTenant(Guid tenantId, Guid userId, string role)
        {
            TenantId = tenantId;
            UserId = userId;
            Role = role;
        }
    }
}
