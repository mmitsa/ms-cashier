using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MsCashier.Application.DTOs;
using MsCashier.Application.Services;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using MsCashier.Infrastructure.Data;
using MsCashier.Infrastructure.Repositories;
using MsCashier.Infrastructure.Services;
using Xunit;

namespace MsCashier.Tests;

/// <summary>
/// Integration tests for AuthService:
///   - LoginAsync rejects unknown users / wrong passwords
///   - LoginAsync rejects users belonging to suspended/expired tenants
///   - LoginAsync issues access + refresh tokens on success
///   - RefreshTokenAsync issues a new pair and rotates the refresh token
///   - RefreshTokenAsync rejects expired refresh tokens
/// </summary>
public sealed class AuthServiceTests : IDisposable
{
    private readonly DbContextOptions<AppDbContext> _options;
    private readonly IConfiguration _config;
    private readonly Guid _activeTenantId = Guid.NewGuid();
    private readonly Guid _suspendedTenantId = Guid.NewGuid();
    private readonly Guid _expiredTenantId = Guid.NewGuid();
    private const string ValidPassword = "P@ssw0rd!Strong";

    public AuthServiceTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"auth-{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TestSigningKeyMustBeAtLeast32CharactersLongForHS256!",
                ["Jwt:Issuer"] = "TestIssuer",
                ["Jwt:Audience"] = "TestAudience",
                ["Jwt:ExpiryHours"] = "1",
            })
            .Build();

        SeedTenantsAndUsers();
    }

    private void SeedTenantsAndUsers()
    {
        var svc = new TestTenantService();
        using var ctx = new AppDbContext(_options, svc);

        // Active tenant + active user
        svc.SetTenant(_activeTenantId, Guid.NewGuid(), "Admin");
        ctx.Tenants.Add(NewTenant(_activeTenantId, "Active Co", TenantStatus.Active));
        ctx.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            TenantId = _activeTenantId,
            Username = "alice",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(ValidPassword),
            FullName = "Alice",
            Role = "Admin",
            IsActive = true,
        });
        ctx.SaveChanges();

        // Suspended tenant
        svc.SetTenant(_suspendedTenantId, Guid.NewGuid(), "Admin");
        ctx.Tenants.Add(NewTenant(_suspendedTenantId, "Suspended Co", TenantStatus.Suspended));
        ctx.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            TenantId = _suspendedTenantId,
            Username = "bob",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(ValidPassword),
            FullName = "Bob",
            Role = "Admin",
            IsActive = true,
        });
        ctx.SaveChanges();

        // Expired tenant
        svc.SetTenant(_expiredTenantId, Guid.NewGuid(), "Admin");
        ctx.Tenants.Add(NewTenant(_expiredTenantId, "Expired Co", TenantStatus.Expired));
        ctx.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            TenantId = _expiredTenantId,
            Username = "carol",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(ValidPassword),
            FullName = "Carol",
            Role = "Admin",
            IsActive = true,
        });
        ctx.SaveChanges();
    }

    private static Tenant NewTenant(Guid id, string name, TenantStatus status) => new()
    {
        Id = id,
        Name = name,
        BusinessType = "Retail",
        OwnerName = name + " Owner",
        Phone = "000",
        City = "City",
        PlanId = 1,
        Status = status,
        SubscriptionStart = DateTime.UtcNow.AddMonths(-1),
        CurrencyCode = "SAR",
    };

    private AuthService CreateAuthService()
    {
        // Use a fresh DbContext per test, and a CurrentTenantService scoped to no tenant
        // (login bypasses User filter when TenantId == Guid.Empty).
        var ctx = new AppDbContext(_options, new TestTenantService());
        var uow = new UnitOfWork(ctx);
        var tokenService = new TokenService(_config);
        return new AuthService(uow, tokenService);
    }

    [Fact]
    public async Task Login_with_correct_credentials_returns_tokens()
    {
        var auth = CreateAuthService();

        var result = await auth.LoginAsync(new LoginRequest("alice", ValidPassword));

        result.IsSuccess.Should().BeTrue(string.Join("; ", result.Errors));
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().NotBeNullOrEmpty();
        result.Data.RefreshToken.Should().NotBeNullOrEmpty();
        result.Data.User.Username.Should().Be("alice");
    }

    [Fact]
    public async Task Login_with_wrong_password_fails_with_generic_error()
    {
        var auth = CreateAuthService();

        var result = await auth.LoginAsync(new LoginRequest("alice", "wrong"));

        result.IsSuccess.Should().BeFalse();
        // The error must be generic — never reveal whether the username exists.
        string.Join(" ", result.Errors).Should().Contain("غير صحيحة");
    }

    [Fact]
    public async Task Login_with_unknown_user_fails_with_same_generic_error()
    {
        var auth = CreateAuthService();

        var result = await auth.LoginAsync(new LoginRequest("nobody", ValidPassword));

        result.IsSuccess.Should().BeFalse();
        string.Join(" ", result.Errors).Should().Contain("غير صحيحة");
    }

    [Fact]
    public async Task Login_for_suspended_tenant_is_blocked()
    {
        var auth = CreateAuthService();

        var result = await auth.LoginAsync(new LoginRequest("bob", ValidPassword));

        result.IsSuccess.Should().BeFalse();
        string.Join(" ", result.Errors).Should().Contain("إيقاف");
    }

    [Fact]
    public async Task Login_for_expired_tenant_is_blocked()
    {
        var auth = CreateAuthService();

        var result = await auth.LoginAsync(new LoginRequest("carol", ValidPassword));

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Refresh_token_rotates_and_returns_new_pair()
    {
        var auth = CreateAuthService();

        var login = await auth.LoginAsync(new LoginRequest("alice", ValidPassword));
        login.IsSuccess.Should().BeTrue();
        var firstRefresh = login.Data!.RefreshToken;

        var refresh = await auth.RefreshTokenAsync(new RefreshTokenRequest(firstRefresh));

        refresh.IsSuccess.Should().BeTrue(string.Join("; ", refresh.Errors));
        refresh.Data!.RefreshToken.Should().NotBe(firstRefresh, "refresh tokens must rotate on use");
        refresh.Data.AccessToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Refresh_with_unknown_token_fails()
    {
        var auth = CreateAuthService();

        var refresh = await auth.RefreshTokenAsync(new RefreshTokenRequest("does-not-exist"));

        refresh.IsSuccess.Should().BeFalse();
    }

    // ─── Regression: refresh must re-validate the tenant on every call ────
    // Without this, a user belonging to a tenant that gets suspended AFTER
    // they last logged in could keep extending their session by calling
    // /auth/refresh with a still-valid refresh token.

    [Fact]
    public async Task Refresh_is_blocked_when_tenant_is_suspended_after_login()
    {
        var auth = CreateAuthService();

        // 1. Login while the tenant is still active.
        var login = await auth.LoginAsync(new LoginRequest("alice", ValidPassword));
        login.IsSuccess.Should().BeTrue();
        var refreshToken = login.Data!.RefreshToken;

        // 2. Suspend the tenant out-of-band.
        using (var ctx = new AppDbContext(_options, new TestTenantService()))
        {
            var t = ctx.Tenants.Single(x => x.Id == _activeTenantId);
            t.Status = TenantStatus.Suspended;
            ctx.SaveChanges();
        }

        // 3. Refresh must now fail with the suspension error.
        var refresh = await auth.RefreshTokenAsync(new RefreshTokenRequest(refreshToken));

        refresh.IsSuccess.Should().BeFalse();
        string.Join(" ", refresh.Errors).Should().Contain("إيقاف");
    }

    [Fact]
    public async Task Refresh_is_blocked_when_tenant_expires_after_login()
    {
        var auth = CreateAuthService();

        var login = await auth.LoginAsync(new LoginRequest("alice", ValidPassword));
        login.IsSuccess.Should().BeTrue();

        using (var ctx = new AppDbContext(_options, new TestTenantService()))
        {
            var t = ctx.Tenants.Single(x => x.Id == _activeTenantId);
            t.Status = TenantStatus.Expired;
            ctx.SaveChanges();
        }

        var refresh = await auth.RefreshTokenAsync(new RefreshTokenRequest(login.Data!.RefreshToken));

        refresh.IsSuccess.Should().BeFalse();
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
