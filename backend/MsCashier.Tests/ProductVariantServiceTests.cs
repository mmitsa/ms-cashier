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

public sealed class ProductVariantServiceTests : IDisposable
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly TestTenantService _tenantService;

    public ProductVariantServiceTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"variant-{Guid.NewGuid()}")
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

    private (ProductVariantService service, AppDbContext ctx) CreateService()
    {
        var ctx = new AppDbContext(_options, _tenantService);
        var uow = new UnitOfWork(ctx);
        return (new ProductVariantService(uow, _tenantService), ctx);
    }

    private Product SeedProduct(AppDbContext ctx, string name = "Test Product")
    {
        var product = new Product
        {
            TenantId = _tenantId,
            Name = name,
            RetailPrice = 100,
            CostPrice = 50,
            IsActive = true,
        };
        ctx.Products.Add(product);
        ctx.SaveChanges();
        return product;
    }

    // ─── SetVariantOptions ──────────────────────────────────

    [Fact]
    public async Task SetVariantOptions_creates_options_and_values()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        var product = SeedProduct(ctx);

        var request = new CreateVariantOptionsRequest(
            product.Id,
            new List<VariantOptionInput>
            {
                new("Size", new List<string> { "S", "M", "L" }),
                new("Color", new List<string> { "Red", "Blue" }),
            });

        var result = await svc.SetVariantOptionsAsync(request);

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(2);

        var sizeOption = result.Data!.First(o => o.Name == "Size");
        sizeOption.Values.Should().HaveCount(3);
        sizeOption.Values.Select(v => v.Value).Should().BeEquivalentTo("S", "M", "L");

        var colorOption = result.Data!.First(o => o.Name == "Color");
        colorOption.Values.Should().HaveCount(2);
    }

    // ─── GenerateVariants ───────────────────────────────────

    [Fact]
    public async Task GenerateVariants_generates_correct_cartesian_product()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        var product = SeedProduct(ctx);

        // Set options: Size (S, M, L) x Color (Red, Blue) = 6 variants
        await svc.SetVariantOptionsAsync(new CreateVariantOptionsRequest(
            product.Id,
            new List<VariantOptionInput>
            {
                new("Size", new List<string> { "S", "M", "L" }),
                new("Color", new List<string> { "Red", "Blue" }),
            }));

        var result = await svc.GenerateVariantsAsync(new GenerateVariantsRequest(
            product.Id,
            DefaultCostPrice: 40,
            DefaultRetailPrice: 80,
            DefaultHalfWholesalePrice: null,
            DefaultWholesalePrice: null));

        result.IsSuccess.Should().BeTrue();
        result.Data.Should().HaveCount(6);

        // Verify all combinations exist
        var displayNames = result.Data!.Select(v => v.DisplayName).ToList();
        displayNames.Should().Contain("S / Red");
        displayNames.Should().Contain("S / Blue");
        displayNames.Should().Contain("M / Red");
        displayNames.Should().Contain("M / Blue");
        displayNames.Should().Contain("L / Red");
        displayNames.Should().Contain("L / Blue");

        // Verify default pricing
        result.Data!.Should().OnlyContain(v => v.CostPrice == 40 && v.RetailPrice == 80);
    }

    // ─── UpdateVariant ──────────────────────────────────────

    [Fact]
    public async Task UpdateVariant_updates_prices_correctly()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        var product = SeedProduct(ctx);

        await svc.SetVariantOptionsAsync(new CreateVariantOptionsRequest(
            product.Id,
            new List<VariantOptionInput>
            {
                new("Size", new List<string> { "S" }),
            }));

        var generated = await svc.GenerateVariantsAsync(new GenerateVariantsRequest(
            product.Id, 40, 80, null, null));

        var variantId = generated.Data!.First().Id;

        var updateResult = await svc.UpdateVariantAsync(variantId, new UpdateVariantRequest(
            Sku: "SKU-S",
            Barcode: "BC-S",
            CostPrice: 55,
            RetailPrice: 110,
            HalfWholesalePrice: 90,
            WholesalePrice: 75,
            ImageUrl: null,
            IsActive: true));

        updateResult.IsSuccess.Should().BeTrue();
        updateResult.Data!.CostPrice.Should().Be(55);
        updateResult.Data.RetailPrice.Should().Be(110);
        updateResult.Data.HalfWholesalePrice.Should().Be(90);
        updateResult.Data.WholesalePrice.Should().Be(75);
        updateResult.Data.Sku.Should().Be("SKU-S");
        updateResult.Data.Barcode.Should().Be("BC-S");
    }

    // ─── GetVariantByBarcode ────────────────────────────────

    [Fact]
    public async Task GetVariantByBarcode_finds_correct_variant()
    {
        var (svc, ctx) = CreateService();
        using var _ = ctx;

        var product = SeedProduct(ctx);

        await svc.SetVariantOptionsAsync(new CreateVariantOptionsRequest(
            product.Id,
            new List<VariantOptionInput>
            {
                new("Size", new List<string> { "S", "M" }),
            }));

        var generated = await svc.GenerateVariantsAsync(new GenerateVariantsRequest(
            product.Id, 40, 80, null, null));

        // Assign a barcode to the first variant
        var firstVariant = generated.Data!.First();
        await svc.UpdateVariantAsync(firstVariant.Id, new UpdateVariantRequest(
            Sku: null,
            Barcode: "FIND-ME-123",
            CostPrice: firstVariant.CostPrice,
            RetailPrice: firstVariant.RetailPrice,
            HalfWholesalePrice: null,
            WholesalePrice: null,
            ImageUrl: null,
            IsActive: true));

        var result = await svc.GetVariantByBarcodeAsync("FIND-ME-123");

        result.IsSuccess.Should().BeTrue();
        result.Data!.Id.Should().Be(firstVariant.Id);
        result.Data.Barcode.Should().Be("FIND-ME-123");
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
