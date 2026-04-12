using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace MsCashier.API.Authorization;

/// <summary>
/// Resolves <see cref="PermissionRequirement"/> against the JWT permission
/// claims placed there by <c>TokenService.GenerateAccessToken</c>.
/// SuperAdmin role bypasses every permission gate intentionally — there is
/// otherwise no way for a brand-new tenant to bootstrap the permission grid.
/// </summary>
public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    public const string PermissionClaimType = "permission";

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (context.User.IsInRole("SuperAdmin"))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        var hasPermission = context.User.Claims
            .Any(c => c.Type == PermissionClaimType
                      && string.Equals(c.Value, requirement.Permission, StringComparison.OrdinalIgnoreCase));

        if (hasPermission)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
