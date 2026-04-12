using Microsoft.AspNetCore.Authorization;

namespace MsCashier.API.Authorization;

/// <summary>
/// Authorization requirement that succeeds when the current principal carries
/// a <c>permission</c> claim equal to <see cref="Permission"/>, OR when the
/// principal has the <c>SuperAdmin</c> role (which bypasses permission gates).
///
/// Use via the [RequirePermission] convenience attribute instead of registering
/// individual policies for every permission key.
/// </summary>
public sealed class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }
}
