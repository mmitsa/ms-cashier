using Microsoft.EntityFrameworkCore;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting.Posting;

/// <summary>
/// يحل أكواد الحسابات إلى معرفات ChartOfAccount للمستأجر الحالي.
/// Scoped lifetime: التخزين المؤقت يعيش لكل طلب.
/// </summary>
public class AccountResolver
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;
    private readonly Dictionary<string, int> _cache = new(StringComparer.OrdinalIgnoreCase);

    public AccountResolver(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<int> GetAccountIdByCodeAsync(string code, CancellationToken ct = default)
    {
        if (_cache.TryGetValue(code, out var cached))
            return cached;

        var account = await _uow.Repository<ChartOfAccount>().Query()
            .Where(a => a.Code == code && a.TenantId == _tenant.TenantId && !a.IsDeleted)
            .Select(a => new { a.Id })
            .FirstOrDefaultAsync(ct);

        if (account is null)
            throw new InvalidOperationException($"الحساب بكود {code} غير موجود في شجرة الحسابات");

        _cache[code] = account.Id;
        return account.Id;
    }

    public async Task<int?> TryGetAccountIdByCodeAsync(string code, CancellationToken ct = default)
    {
        if (_cache.TryGetValue(code, out var cached))
            return cached;

        var account = await _uow.Repository<ChartOfAccount>().Query()
            .Where(a => a.Code == code && a.TenantId == _tenant.TenantId && !a.IsDeleted)
            .Select(a => new { a.Id })
            .FirstOrDefaultAsync(ct);

        if (account is null)
            return null;

        _cache[code] = account.Id;
        return account.Id;
    }
}
