namespace MsCashier.Infrastructure.Services;

using MsCashier.Domain.Interfaces;

public class CurrentTenantService : ICurrentTenantService
{
    public Guid TenantId { get; private set; }
    public Guid UserId { get; private set; }
    public string Role { get; private set; } = string.Empty;

    public void SetTenant(Guid tenantId, Guid userId, string role)
    {
        TenantId = tenantId;
        UserId = userId;
        Role = role;
    }
}
