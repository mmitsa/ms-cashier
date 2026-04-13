using MsCashier.Application.Interfaces;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services;

public class AuditService : IAuditService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public AuditService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task LogAsync(string action, string entityType, string? entityId = null,
        string? oldValues = null, string? newValues = null)
    {
        try
        {
            var log = new AuditLog
            {
                TenantId = _tenant.TenantId,
                UserId = _tenant.UserId != Guid.Empty ? _tenant.UserId : null,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                OldValues = oldValues,
                NewValues = newValues,
                CreatedAt = DateTime.UtcNow,
            };
            await _uow.Repository<AuditLog>().AddAsync(log);
            await _uow.SaveChangesAsync();
        }
        catch
        {
            // Audit failures must never crash the main operation
        }
    }
}
