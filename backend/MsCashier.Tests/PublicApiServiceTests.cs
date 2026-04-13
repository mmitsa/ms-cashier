using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MsCashier.Application.Services;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using MsCashier.Infrastructure.Data;
using MsCashier.Infrastructure.Repositories;
using Xunit;

namespace MsCashier.Tests;

public sealed class PublicApiServiceTests : IDisposable
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly TestTenantService _tenantService;

    public PublicApiServiceTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"api-{Guid.NewGuid()}")
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

    private PublicApiService CreateService()
    {
        var ctx = new AppDbContext(_options, _tenantService);
        var uow = new UnitOfWork(ctx);
        return new PublicApiService(uow, _tenantService, new StubHttpClientFactory());
    }

    // ─── CreateKey ──────────────────────────────────────────

    [Fact]
    public async Task CreateKey_generates_key_with_mpos_prefix()
    {
        var svc = CreateService();

        var result = await svc.CreateKeyAsync("Test Key", null, null);

        result.IsSuccess.Should().BeTrue();
        result.Data!.Key.Should().StartWith("mpos_");
        result.Data.Key.Length.Should().Be(40); // "mpos_" + 35 chars
        result.Data.Name.Should().Be("Test Key");
        result.Data.Prefix.Should().Be(result.Data.Key[..10]);
    }

    [Fact]
    public async Task CreateKey_returns_different_key_each_time()
    {
        var svc = CreateService();

        var result1 = await svc.CreateKeyAsync("Key 1", null, null);
        var result2 = await svc.CreateKeyAsync("Key 2", null, null);

        result1.IsSuccess.Should().BeTrue();
        result2.IsSuccess.Should().BeTrue();
        result1.Data!.Key.Should().NotBe(result2.Data!.Key);
    }

    // ─── ValidateKey ────────────────────────────────────────

    [Fact]
    public async Task ValidateKey_validates_a_just_created_key()
    {
        var svc = CreateService();

        var created = await svc.CreateKeyAsync("Validate Me", new List<string> { "read", "write" }, null);
        created.IsSuccess.Should().BeTrue();

        var result = await svc.ValidateKeyAsync(created.Data!.Key);

        result.IsSuccess.Should().BeTrue();
        result.Data.TenantId.Should().Be(_tenantId);
        result.Data.Scopes.Should().Contain("read");
        result.Data.Scopes.Should().Contain("write");
    }

    [Fact]
    public async Task ValidateKey_rejects_invalid_key()
    {
        var svc = CreateService();

        var result = await svc.ValidateKeyAsync("mpos_totally_invalid_key_that_doesnt_exist");

        result.IsSuccess.Should().BeFalse();
    }

    // ─── RevokeKey ──────────────────────────────────────────

    [Fact]
    public async Task RevokeKey_marks_key_as_inactive()
    {
        var svc = CreateService();

        var created = await svc.CreateKeyAsync("Revoke Me", null, null);
        created.IsSuccess.Should().BeTrue();

        var revokeResult = await svc.RevokeKeyAsync(created.Data!.Id);
        revokeResult.IsSuccess.Should().BeTrue();

        // Validation should now fail because the key is inactive
        var validateResult = await svc.ValidateKeyAsync(created.Data.Key);
        validateResult.IsSuccess.Should().BeFalse();
    }

    public void Dispose() { }

    private sealed class TestTenantService : ICurrentTenantService
    {
        public Guid TenantId { get; private set; }
        public Guid UserId { get; private set; }
        public string Role { get; private set; } = string.Empty;
        public void SetTenant(Guid t, Guid u, string r) { TenantId = t; UserId = u; Role = r; }
    }

    /// <summary>
    /// Stub IHttpClientFactory — the API key tests don't send HTTP requests,
    /// but PublicApiService requires the dependency at construction.
    /// </summary>
    private sealed class StubHttpClientFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new();
    }
}
