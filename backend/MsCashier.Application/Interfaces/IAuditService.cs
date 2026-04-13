using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface IAuditService
{
    Task LogAsync(string action, string entityType, string? entityId = null,
        string? oldValues = null, string? newValues = null);
}
