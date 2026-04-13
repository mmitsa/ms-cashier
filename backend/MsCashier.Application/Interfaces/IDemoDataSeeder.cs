using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface IDemoDataSeeder
{
    Task<Result<string>> SeedDemoDataAsync(Guid tenantId);
}
