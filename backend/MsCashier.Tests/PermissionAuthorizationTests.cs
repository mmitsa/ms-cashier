using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using MsCashier.API.Authorization;
using Xunit;

namespace MsCashier.Tests;

/// <summary>
/// Tests for the permission-based authorization layer:
///   - SuperAdmin role bypasses every permission gate
///   - Users with the matching `permission` claim are allowed
///   - Users without the claim are denied
///   - Permission matching is case-insensitive
/// </summary>
public sealed class PermissionAuthorizationTests
{
    private static AuthorizationHandlerContext ContextFor(
        ClaimsPrincipal user,
        params PermissionRequirement[] requirements)
    {
        return new AuthorizationHandlerContext(requirements, user, resource: null);
    }

    private static ClaimsPrincipal Principal(string role = "Cashier", params string[] permissions)
    {
        var claims = new List<Claim> { new(ClaimTypes.Role, role) };
        foreach (var p in permissions)
        {
            claims.Add(new Claim(PermissionAuthorizationHandler.PermissionClaimType, p));
        }
        var identity = new ClaimsIdentity(claims, authenticationType: "Test");
        return new ClaimsPrincipal(identity);
    }

    [Fact]
    public async Task SuperAdmin_passes_every_permission_requirement()
    {
        var handler = new PermissionAuthorizationHandler();
        var requirement = new PermissionRequirement("anything.you.want");
        var context = ContextFor(Principal(role: "SuperAdmin"), requirement);

        await handler.HandleAsync(context);

        context.HasSucceeded.Should().BeTrue();
    }

    [Fact]
    public async Task User_with_matching_permission_claim_is_allowed()
    {
        var handler = new PermissionAuthorizationHandler();
        var requirement = new PermissionRequirement("products.delete");
        var context = ContextFor(Principal(permissions: "products.delete"), requirement);

        await handler.HandleAsync(context);

        context.HasSucceeded.Should().BeTrue();
    }

    [Fact]
    public async Task User_without_permission_is_denied()
    {
        var handler = new PermissionAuthorizationHandler();
        var requirement = new PermissionRequirement("products.delete");
        var context = ContextFor(Principal(permissions: "products.read"), requirement);

        await handler.HandleAsync(context);

        context.HasSucceeded.Should().BeFalse();
    }

    [Fact]
    public async Task Permission_match_is_case_insensitive()
    {
        var handler = new PermissionAuthorizationHandler();
        var requirement = new PermissionRequirement("Products.Delete");
        var context = ContextFor(Principal(permissions: "products.delete"), requirement);

        await handler.HandleAsync(context);

        context.HasSucceeded.Should().BeTrue();
    }

    [Fact]
    public async Task Empty_user_with_no_role_or_claims_is_denied()
    {
        var handler = new PermissionAuthorizationHandler();
        var requirement = new PermissionRequirement("anything");
        var context = ContextFor(new ClaimsPrincipal(new ClaimsIdentity()), requirement);

        await handler.HandleAsync(context);

        context.HasSucceeded.Should().BeFalse();
    }
}
