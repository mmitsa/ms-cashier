using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace MsCashier.API.Authorization;

/// <summary>
/// Dynamic policy provider that creates a fresh <see cref="AuthorizationPolicy"/>
/// for any policy name starting with <c>perm:</c>. The trailing portion of the
/// name becomes the <see cref="PermissionRequirement"/>. This avoids having to
/// pre-register every permission key in <c>Program.cs</c>.
/// </summary>
public sealed class PermissionPolicyProvider : DefaultAuthorizationPolicyProvider
{
    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options) : base(options) { }

    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (policyName.StartsWith(RequirePermissionAttribute.PolicyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            var permission = policyName[RequirePermissionAttribute.PolicyPrefix.Length..];
            return new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddRequirements(new PermissionRequirement(permission))
                .Build();
        }

        return await base.GetPolicyAsync(policyName);
    }
}
