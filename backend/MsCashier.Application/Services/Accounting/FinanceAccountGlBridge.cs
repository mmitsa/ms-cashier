using Microsoft.EntityFrameworkCore;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting;

/// <summary>
/// Bridges a legacy FinanceAccount (wallet) to a GL leaf ChartOfAccount.
///
/// Sub-code scheme: auto-generated leaves use "{parentCode}-{seq:D3}" (e.g.
/// "1110-001", "1110-002", ...). The hyphen cleanly distinguishes dynamically
/// created per-wallet accounts from the static seed codes (which are all purely
/// numeric: "1101", "1120", ...), so there is zero chance of collision with
/// DefaultChartOfAccounts seed entries.
/// </summary>
public class FinanceAccountGlBridge : IFinanceAccountGlBridge
{
    private readonly IUnitOfWork _uow;

    public FinanceAccountGlBridge(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<int> EnsureGlAccountAsync(FinanceAccount account, CancellationToken ct = default)
    {
        if (account.ChartOfAccountId.HasValue)
            return account.ChartOfAccountId.Value;

        var parentCode = account.AccountType switch
        {
            AccountType.Cash => "11",       // Current Assets group (1101 is itself a leaf; new cash wallets hang off 11)
            AccountType.Bank => "1110",     // Banks group
            AccountType.Digital => "1115",  // Digital Wallets group
            _ => "11"
        };

        await _uow.BeginTransactionAsync();
        try
        {
            var parent = await _uow.Repository<ChartOfAccount>().Query()
                .FirstOrDefaultAsync(c => c.TenantId == account.TenantId && c.Code == parentCode && !c.IsDeleted, ct);

            if (parent is null)
            {
                await _uow.RollbackTransactionAsync();
                throw new InvalidOperationException("تعذر إيجاد المجموعة الأم في شجرة الحسابات");
            }

            var prefix = $"{parentCode}-";
            var siblings = await _uow.Repository<ChartOfAccount>().Query()
                .Where(c => c.TenantId == account.TenantId && c.ParentId == parent.Id && c.Code.StartsWith(prefix))
                .Select(c => c.Code)
                .ToListAsync(ct);

            int nextSeq = 1;
            foreach (var code in siblings)
            {
                var tail = code.Substring(prefix.Length);
                if (int.TryParse(tail, out var parsed) && parsed >= nextSeq)
                    nextSeq = parsed + 1;
            }

            var newAcc = new ChartOfAccount
            {
                TenantId = account.TenantId,
                Code = $"{prefix}{nextSeq:D3}",
                NameAr = account.Name,
                NameEn = account.Name,
                Category = parent.Category,
                Nature = parent.Nature,
                ParentId = parent.Id,
                Level = (byte)(parent.Level + 1),
                IsGroup = false,
                IsSystem = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _uow.Repository<ChartOfAccount>().AddAsync(newAcc);
            await _uow.SaveChangesAsync(ct);

            account.ChartOfAccountId = newAcc.Id;
            _uow.Repository<FinanceAccount>().Update(account);
            await _uow.SaveChangesAsync(ct);

            await _uow.CommitTransactionAsync();
            return newAcc.Id;
        }
        catch
        {
            try { await _uow.RollbackTransactionAsync(); } catch { /* ignore */ }
            throw;
        }
    }
}
