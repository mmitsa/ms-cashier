using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs;
using MsCashier.Application.Services;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using MsCashier.Infrastructure.Data;
using MsCashier.Infrastructure.Repositories;
using Xunit;

namespace MsCashier.Tests;

public sealed class LoyaltyServiceTests : IDisposable
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly TestTenantService _tenantService;

    public LoyaltyServiceTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"loyalty-{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _tenantService = new TestTenantService();
        _tenantService.SetTenant(_tenantId, Guid.NewGuid(), "Admin");

        SeedTenant();
    }

    private void SeedTenant()
    {
        using var ctx = new AppDbContext(_options, _tenantService);
        ctx.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "Test Co",
            BusinessType = "Retail",
            OwnerName = "Owner",
            Phone = "000",
            City = "City",
            PlanId = 1,
            Status = TenantStatus.Active,
            SubscriptionStart = DateTime.UtcNow,
            CurrencyCode = "SAR",
        });
        ctx.SaveChanges();
    }

    private (LoyaltyService service, AppDbContext ctx) CreateService()
    {
        var ctx = new AppDbContext(_options, _tenantService);
        var uow = new UnitOfWork(ctx);
        return (new LoyaltyService(uow, _tenantService), ctx);
    }

    // ─── CreateOrUpdateProgram ───────────────────────────────

    [Fact]
    public async Task CreateOrUpdateProgram_creates_program_with_correct_fields()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        var request = new CreateLoyaltyProgramRequest(
            Name: "Gold Program",
            PointsPerCurrency: 1.5m,
            RedemptionValue: 0.1m,
            MinRedemptionPoints: 100,
            PointsExpireDays: 365,
            IsActive: true);

        var result = await svc.CreateOrUpdateProgramAsync(request);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Name.Should().Be("Gold Program");
        result.Data.PointsPerCurrency.Should().Be(1.5m);
        result.Data.RedemptionValue.Should().Be(0.1m);
        result.Data.MinRedemptionPoints.Should().Be(100);
        result.Data.PointsExpireDays.Should().Be(365);
        result.Data.IsActive.Should().BeTrue();
    }

    // ─── EarnPoints ─────────────────────────────────────────

    [Fact]
    public async Task EarnPoints_calculates_points_correctly()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        // Create program with 2 points per currency unit
        await svc.CreateOrUpdateProgramAsync(new CreateLoyaltyProgramRequest(
            "Test", 2m, 0.1m, 50, 0, true));

        // Create a contact
        var contact = new Contact
        {
            TenantId = _tenantId,
            Name = "Customer A",
            ContactType = ContactType.Customer,
            IsActive = true,
        };
        ctx.Contacts.Add(contact);
        await ctx.SaveChangesAsync();

        // Earn points on a 150.75 purchase -> floor(150.75 * 2) = 301
        var result = await svc.EarnPointsAsync(contact.Id, invoiceId: 1, totalAmount: 150.75m);

        result.IsSuccess.Should().BeTrue();
        result.Data!.Points.Should().Be(301);
        result.Data.Type.Should().Be(LoyaltyTransactionType.Earn);
    }

    [Fact]
    public async Task EarnPoints_auto_enrolls_customer_if_not_enrolled()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        await svc.CreateOrUpdateProgramAsync(new CreateLoyaltyProgramRequest(
            "Test", 1m, 0.1m, 50, 0, true));

        var contact = new Contact
        {
            TenantId = _tenantId,
            Name = "New Customer",
            ContactType = ContactType.Customer,
            IsActive = true,
        };
        ctx.Contacts.Add(contact);
        await ctx.SaveChangesAsync();

        // Customer is not enrolled yet — EarnPoints should auto-enroll
        var result = await svc.EarnPointsAsync(contact.Id, invoiceId: 1, totalAmount: 100m);

        result.IsSuccess.Should().BeTrue();

        // Verify customer was enrolled
        var loyalty = await svc.GetCustomerLoyaltyAsync(contact.Id);
        loyalty.IsSuccess.Should().BeTrue();
        loyalty.Data!.ContactId.Should().Be(contact.Id);
        loyalty.Data.CurrentPoints.Should().Be(100);
    }

    // ─── RedeemPoints ───────────────────────────────────────

    [Fact]
    public async Task RedeemPoints_calculates_discount_correctly()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        // RedemptionValue = 0.5 SAR per point
        await svc.CreateOrUpdateProgramAsync(new CreateLoyaltyProgramRequest(
            "Test", 1m, 0.5m, 10, 0, true));

        var contact = new Contact
        {
            TenantId = _tenantId,
            Name = "Customer B",
            ContactType = ContactType.Customer,
            IsActive = true,
        };
        ctx.Contacts.Add(contact);
        await ctx.SaveChangesAsync();

        // Earn 200 points
        await svc.EarnPointsAsync(contact.Id, invoiceId: 1, totalAmount: 200m);

        // Redeem 50 points -> discount = 50 * 0.5 = 25
        var result = await svc.RedeemPointsAsync(contact.Id, 50);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().Be(25m);
    }

    [Fact]
    public async Task RedeemPoints_fails_if_insufficient_points()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        await svc.CreateOrUpdateProgramAsync(new CreateLoyaltyProgramRequest(
            "Test", 1m, 0.1m, 10, 0, true));

        var contact = new Contact
        {
            TenantId = _tenantId,
            Name = "Customer C",
            ContactType = ContactType.Customer,
            IsActive = true,
        };
        ctx.Contacts.Add(contact);
        await ctx.SaveChangesAsync();

        // Earn only 50 points
        await svc.EarnPointsAsync(contact.Id, invoiceId: 1, totalAmount: 50m);

        // Try to redeem 100 — should fail
        var result = await svc.RedeemPointsAsync(contact.Id, 100);

        result.IsSuccess.Should().BeFalse();
        string.Join(" ", result.Errors).Should().Contain("غير كافٍ");
    }

    [Fact]
    public async Task RedeemPoints_fails_if_below_minimum_redemption_threshold()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        // MinRedemptionPoints = 100
        await svc.CreateOrUpdateProgramAsync(new CreateLoyaltyProgramRequest(
            "Test", 1m, 0.1m, 100, 0, true));

        var contact = new Contact
        {
            TenantId = _tenantId,
            Name = "Customer D",
            ContactType = ContactType.Customer,
            IsActive = true,
        };
        ctx.Contacts.Add(contact);
        await ctx.SaveChangesAsync();

        // Earn 200 points
        await svc.EarnPointsAsync(contact.Id, invoiceId: 1, totalAmount: 200m);

        // Try to redeem only 50 — below minimum of 100
        var result = await svc.RedeemPointsAsync(contact.Id, 50);

        result.IsSuccess.Should().BeFalse();
        string.Join(" ", result.Errors).Should().Contain("الحد الأدنى");
    }

    // ─── GetCustomerLoyalty ─────────────────────────────────

    [Fact]
    public async Task GetCustomerLoyalty_returns_failure_for_non_enrolled_customer()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        // contactId 9999 doesn't exist in the loyalty program
        var result = await svc.GetCustomerLoyaltyAsync(9999);

        result.IsSuccess.Should().BeFalse();
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
