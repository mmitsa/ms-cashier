using System.Text;
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

public sealed class CsvImportServiceTests : IDisposable
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly TestTenantService _tenantService;

    public CsvImportServiceTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"csv-{Guid.NewGuid()}")
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

    private (CsvImportService service, AppDbContext ctx) CreateService()
    {
        var ctx = new AppDbContext(_options, _tenantService);
        var uow = new UnitOfWork(ctx);
        return (new CsvImportService(uow, _tenantService), ctx);
    }

    private static Stream ToCsvStream(string csvContent)
    {
        return new MemoryStream(Encoding.UTF8.GetBytes(csvContent));
    }

    // ─── ImportProducts ─────────────────────────────────────

    [Fact]
    public async Task ImportProducts_imports_valid_csv_successfully()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        var csv = "Name,RetailPrice,CostPrice,Barcode\nProduct A,15.5,10,1001\nProduct B,20,12,1002\n";

        var result = await svc.ImportProductsAsync(ToCsvStream(csv), warehouseId: 0, skipDuplicates: false);

        result.IsSuccess.Should().BeTrue();
        result.Data!.SuccessCount.Should().Be(2);
        result.Data.ErrorCount.Should().Be(0);
        result.Data.TotalRows.Should().Be(2);
    }

    [Fact]
    public async Task ImportProducts_skips_duplicates_when_skipDuplicates_is_true()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        // First import
        var csv1 = "Name,RetailPrice,CostPrice,Barcode\nProduct A,15,10,DUP001\n";
        await svc.ImportProductsAsync(ToCsvStream(csv1), warehouseId: 0, skipDuplicates: false);

        // Second import with same barcode — should skip
        var csv2 = "Name,RetailPrice,CostPrice,Barcode\nProduct A Dupe,15,10,DUP001\n";

        // Need a fresh service because the UoW/context may be in a committed state
        var (svc2, ctx2) = CreateService();
        using var __ = ctx2;

        var result = await svc2.ImportProductsAsync(ToCsvStream(csv2), warehouseId: 0, skipDuplicates: true);

        result.IsSuccess.Should().BeTrue();
        result.Data!.SkippedCount.Should().Be(1);
        result.Data.SuccessCount.Should().Be(0);
    }

    [Fact]
    public async Task ImportProducts_reports_error_for_missing_required_fields()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        // Missing Name (empty) on second row
        var csv = "Name,RetailPrice,CostPrice\nGood Product,15,10\n,20,12\n";

        var result = await svc.ImportProductsAsync(ToCsvStream(csv), warehouseId: 0, skipDuplicates: false);

        result.IsSuccess.Should().BeTrue();
        result.Data!.SuccessCount.Should().Be(1);
        result.Data.ErrorCount.Should().Be(1);
        result.Data.Errors.Should().Contain(e => e.Field == "Name");
    }

    [Fact]
    public async Task ImportProducts_auto_creates_categories()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        var csv = "Name,RetailPrice,CostPrice,CategoryName\nProduct X,25,15,NewCategory\n";

        var result = await svc.ImportProductsAsync(ToCsvStream(csv), warehouseId: 0, skipDuplicates: false);

        result.IsSuccess.Should().BeTrue();
        result.Data!.SuccessCount.Should().Be(1);
        result.Data.Warnings.Should().Contain(w => w.Contains("NewCategory"));

        // Verify the category was created
        var categories = ctx.Categories.ToList();
        categories.Should().Contain(c => c.Name == "NewCategory");
    }

    // ─── ImportContacts ─────────────────────────────────────

    [Fact]
    public async Task ImportContacts_imports_valid_contacts()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        var csv = "Name,Phone,Email,Type\nJohn,0501111111,john@test.com,Customer\nJane,0502222222,jane@test.com,Supplier\n";

        var result = await svc.ImportContactsAsync(ToCsvStream(csv), skipDuplicates: false);

        result.IsSuccess.Should().BeTrue();
        result.Data!.SuccessCount.Should().Be(2);
        result.Data.ErrorCount.Should().Be(0);
    }

    [Fact]
    public async Task ImportContacts_skips_duplicate_phone_numbers()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        // First import
        var csv1 = "Name,Phone\nJohn,0501111111\n";
        await svc.ImportContactsAsync(ToCsvStream(csv1), skipDuplicates: false);

        // Second import with same phone
        var csv2 = "Name,Phone\nJohn Dupe,0501111111\n";

        var (svc2, ctx2) = CreateService();
        using var __ = ctx2;

        var result = await svc2.ImportContactsAsync(ToCsvStream(csv2), skipDuplicates: true);

        result.IsSuccess.Should().BeTrue();
        result.Data!.SkippedCount.Should().Be(1);
        result.Data.SuccessCount.Should().Be(0);
    }

    // ─── GetCsvTemplate ─────────────────────────────────────

    [Fact]
    public void GetCsvTemplate_returns_non_empty_bytes()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        var bytes = svc.GetCsvTemplate(CsvImportType.Products);

        bytes.Should().NotBeEmpty();
        bytes.Length.Should().BeGreaterThan(0);

        // Verify it contains CSV header content
        var content = Encoding.UTF8.GetString(bytes);
        content.Should().Contain("Name");
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
