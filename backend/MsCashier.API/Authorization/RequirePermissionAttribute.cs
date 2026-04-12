using Microsoft.AspNetCore.Authorization;

namespace MsCashier.API.Authorization;

/// <summary>
/// Convenience attribute that requires a specific permission key on a
/// controller / action. Equivalent to <c>[Authorize(Policy = "perm:key")]</c>
/// but auto-registers the policy on first use via the dynamic policy provider
/// configured in <c>Program.cs</c>.
///
/// Example:
/// <code>
/// [HttpPost]
/// [RequirePermission("products.create")]
/// public Task&lt;IActionResult&gt; Create(...) =&gt; ...;
/// </code>
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class RequirePermissionAttribute : AuthorizeAttribute
{
    public const string PolicyPrefix = "perm:";

    public RequirePermissionAttribute(string permission)
    {
        Policy = PolicyPrefix + permission;
    }
}
