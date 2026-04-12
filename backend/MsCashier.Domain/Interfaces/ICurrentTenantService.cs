namespace MsCashier.Domain.Interfaces;

public interface ICurrentTenantService
{
    Guid TenantId { get; }
    Guid UserId { get; }
    string Role { get; }
    void SetTenant(Guid tenantId, Guid userId, string role);
}
