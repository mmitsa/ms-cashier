using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Application.Services.Accounting.Posting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 7. FinanceService
// ════════════════════════════════════════════════════════════════

public class FinanceService : IFinanceService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;
    private readonly IPaymentPostingService _paymentPosting;
    private readonly IReceiptPostingService _receiptPosting;
    private readonly IFinanceAccountGlBridge _glBridge;
    private readonly ILogger<FinanceService> _logger;
    private readonly IPostingFailureLogger _postingFailureLogger;

    public FinanceService(
        IUnitOfWork uow,
        ICurrentTenantService tenant,
        IPaymentPostingService paymentPosting,
        IReceiptPostingService receiptPosting,
        IFinanceAccountGlBridge glBridge,
        ILogger<FinanceService> logger,
        IPostingFailureLogger postingFailureLogger)
    {
        _uow = uow;
        _tenant = tenant;
        _paymentPosting = paymentPosting;
        _receiptPosting = receiptPosting;
        _glBridge = glBridge;
        _logger = logger;
        _postingFailureLogger = postingFailureLogger;
    }

    /// <summary>
    /// Resolves the GL ChartOfAccount.Id corresponding to a FinanceAccount.
    /// Primary path: use FinanceAccount.ChartOfAccountId (the explicit link set by the user/admin).
    /// Fallback behavior:
    ///   - Bank / Digital: if ChartOfAccountId is null, we DO NOT fall back — log a warning and skip GL posting.
    ///     These accounts must be explicitly mapped to a real GL leaf (per-bank, per-wallet) to avoid
    ///     silently misposting to Main Cash.
    ///   - Cash: if ChartOfAccountId is null, fall back to system code "1101" (Main Cash) since
    ///     cash accounts typically share that single leaf.
    /// Returns null if no usable ChartOfAccount is found (caller should skip posting).
    /// </summary>
    private async Task<int?> ResolveGlCashAccountIdAsync(FinanceAccount account, CancellationToken ct = default)
    {
        if (account.ChartOfAccountId.HasValue)
        {
            var mapped = await _uow.Repository<ChartOfAccount>().Query()
                .FirstOrDefaultAsync(x =>
                    x.Id == account.ChartOfAccountId.Value &&
                    x.TenantId == _tenant.TenantId &&
                    !x.IsGroup &&
                    !x.IsDeleted, ct);
            if (mapped is not null)
                return mapped.Id;

            _logger.LogWarning(
                "FinanceAccount {AccountId} points to ChartOfAccountId {CoaId} which is missing, deleted, or a group account.",
                account.Id, account.ChartOfAccountId.Value);
        }

        if (account.AccountType == AccountType.Cash)
        {
            var coa = await _uow.Repository<ChartOfAccount>().Query()
                .FirstOrDefaultAsync(x =>
                    x.TenantId == _tenant.TenantId &&
                    x.Code == "1101" &&
                    !x.IsGroup &&
                    !x.IsDeleted, ct);
            return coa?.Id;
        }

        _logger.LogWarning(
            "FinanceAccount {AccountId} (type {AccountType}) has no GL link — skipping posting.",
            account.Id, account.AccountType);
        return null;
    }

    public async Task<Result<List<FinanceAccountDto>>> GetAccountsAsync()
    {
        try
        {
            var accounts = await _uow.Repository<FinanceAccount>().Query()
                .Where(a => a.TenantId == _tenant.TenantId && !a.IsDeleted)
                .OrderBy(a => a.Name)
                .Select(a => new FinanceAccountDto(a.Id, a.Name, a.AccountType, a.Balance))
                .ToListAsync();

            return Result<List<FinanceAccountDto>>.Success(accounts);
        }
        catch (Exception ex)
        {
            return Result<List<FinanceAccountDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<FinanceAccountDto>> CreateAccountAsync(string name, AccountType type)
    {
        try
        {
            var exists = await _uow.Repository<FinanceAccount>().AnyAsync(a =>
                a.TenantId == _tenant.TenantId &&
                a.Name == name &&
                !a.IsDeleted);

            if (exists)
                return Result<FinanceAccountDto>.Failure("الحساب موجود بالفعل");

            var account = new FinanceAccount
            {
                TenantId = _tenant.TenantId,
                Name = name,
                AccountType = type,
                Balance = 0,
                IsActive = true
            };

            await _uow.Repository<FinanceAccount>().AddAsync(account);
            await _uow.SaveChangesAsync();

            try
            {
                await _glBridge.EnsureGlAccountAsync(account);
            }
            catch (Exception glEx)
            {
                _logger.LogWarning(glEx, "Failed to provision GL account for FinanceAccount {AccountId}; continuing.", account.Id);
            }

            return Result<FinanceAccountDto>.Success(
                new FinanceAccountDto(account.Id, account.Name, account.AccountType, account.Balance),
                "تم إنشاء الحساب بنجاح");
        }
        catch (Exception ex)
        {
            return Result<FinanceAccountDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<FinanceTransactionDto>> RecordTransactionAsync(CreateTransactionRequest request)
    {
        try
        {
            var account = await _uow.Repository<FinanceAccount>().Query()
                .FirstOrDefaultAsync(a =>
                    a.Id == request.AccountId &&
                    a.TenantId == _tenant.TenantId &&
                    !a.IsDeleted);

            if (account is null)
                return Result<FinanceTransactionDto>.Failure("الحساب غير موجود");

            var balanceBefore = account.Balance;

            if (request.TransactionType == TransactionType.Income)
                account.Balance += request.Amount;
            else if (request.TransactionType == TransactionType.Expense)
                account.Balance -= request.Amount;

            _uow.Repository<FinanceAccount>().Update(account);

            var transaction = new FinanceTransaction
            {
                TenantId = _tenant.TenantId,
                AccountId = request.AccountId,
                TransactionType = request.TransactionType,
                Category = request.Category,
                Amount = request.Amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = account.Balance,
                Description = request.Description,
                // Persist the contact link so admin retry can reconstruct the GL post
                // without needing the original request DTO.
                ReferenceType = request.ContactId.HasValue ? "Contact" : null,
                ReferenceId = request.ContactId?.ToString(),
                CreatedBy = _tenant.UserId,
                CreatedAt = DateTime.UtcNow
            };

            await _uow.Repository<FinanceTransaction>().AddAsync(transaction);
            await _uow.SaveChangesAsync();

            // ─────────────────────────────────────────────────────────────
            // GL posting (double-entry accounting)
            // Only post when a contact is supplied — a generic cash movement
            // (e.g., owner withdrawal) has no AP/AR counter-party to post to.
            // Posting failures are logged but never roll back the cash transaction.
            // ─────────────────────────────────────────────────────────────
            if (request.ContactId.HasValue)
            {
                var glCashAccountId = await ResolveGlCashAccountIdAsync(account);
                if (!glCashAccountId.HasValue)
                {
                    _logger.LogWarning(
                        "GL posting skipped for FinanceTransaction {TxId}: no non-group ChartOfAccount found for FinanceAccount {AccountId} (type {AccountType}).",
                        transaction.Id, account.Id, account.AccountType);
                }
                else
                {
                    var operation = request.TransactionType == TransactionType.Expense ? "Payment" : "Receipt";
                    try
                    {
                        var reference = $"FT-{transaction.Id}";
                        if (request.TransactionType == TransactionType.Expense)
                        {
                            // Money OUT to supplier → supplier payment (Dr AP / Cr Cash)
                            var result = await _paymentPosting.PostSupplierPaymentAsync(
                                request.ContactId.Value, request.Amount, glCashAccountId.Value,
                                transaction.CreatedAt, reference, transaction.Id);
                            if (!result.IsSuccess)
                            {
                                _logger.LogWarning("Supplier payment GL posting failed for FT {TxId}: {Error}", transaction.Id, result.Message);
                                try { await _postingFailureLogger.LogAsync("FinanceTransaction", transaction.Id, operation, string.Join("; ", result.Errors)); } catch { }
                            }
                        }
                        else if (request.TransactionType == TransactionType.Income)
                        {
                            // Money IN from customer → customer receipt (Dr Cash / Cr AR)
                            var result = await _receiptPosting.PostCustomerReceiptAsync(
                                request.ContactId.Value, request.Amount, glCashAccountId.Value,
                                transaction.CreatedAt, reference, transaction.Id);
                            if (!result.IsSuccess)
                            {
                                _logger.LogWarning("Customer receipt GL posting failed for FT {TxId}: {Error}", transaction.Id, result.Message);
                                try { await _postingFailureLogger.LogAsync("FinanceTransaction", transaction.Id, operation, string.Join("; ", result.Errors)); } catch { }
                            }
                        }
                    }
                    catch (Exception postEx)
                    {
                        _logger.LogError(postEx, "GL posting threw for FinanceTransaction {TxId}; cash transaction preserved.", transaction.Id);
                        try { await _postingFailureLogger.LogAsync("FinanceTransaction", transaction.Id, operation, postEx); } catch { }
                    }
                }
            }

            var dto = new FinanceTransactionDto(
                transaction.Id, account.Id, account.Name,
                transaction.TransactionType, transaction.Category,
                transaction.Amount, transaction.BalanceAfter,
                transaction.Description, transaction.CreatedAt, "");

            return Result<FinanceTransactionDto>.Success(dto, "تم تسجيل المعاملة بنجاح");
        }
        catch (Exception ex)
        {
            return Result<FinanceTransactionDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<FinanceTransactionDto>>> GetTransactionsAsync(
        int? accountId, DateTime? from, DateTime? to, int page, int pageSize)
    {
        try
        {
            var query = _uow.Repository<FinanceTransaction>().Query()
                .Where(t => t.TenantId == _tenant.TenantId);

            if (accountId.HasValue)
                query = query.Where(t => t.AccountId == accountId.Value);

            if (from.HasValue)
                query = query.Where(t => t.CreatedAt >= from.Value);

            if (to.HasValue)
                query = query.Where(t => t.CreatedAt <= to.Value.AddDays(1));

            var totalCount = await query.CountAsync();

            var transactions = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var accountIds = transactions.Select(t => t.AccountId).Distinct().ToList();
            var accounts = await _uow.Repository<FinanceAccount>().Query()
                .Where(a => accountIds.Contains(a.Id))
                .ToDictionaryAsync(a => a.Id, a => a.Name);

            var creatorIds = transactions.Select(t => t.CreatedBy).Distinct().ToList();
            var creators = await _uow.Repository<User>().Query()
                .Where(u => creatorIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.FullName);

            var dtos = transactions.Select(t => new FinanceTransactionDto(
                t.Id, t.AccountId,
                accounts.ContainsKey(t.AccountId) ? accounts[t.AccountId] : "",
                t.TransactionType, t.Category, t.Amount, t.BalanceAfter,
                t.Description, t.CreatedAt,
                creators.ContainsKey(t.CreatedBy) ? creators[t.CreatedBy] : ""
            )).ToList();

            var result = new PagedResult<FinanceTransactionDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize
            };

            return Result<PagedResult<FinanceTransactionDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<PagedResult<FinanceTransactionDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<decimal>> GetTotalBalanceAsync()
    {
        try
        {
            var total = await _uow.Repository<FinanceAccount>().Query()
                .Where(a => a.TenantId == _tenant.TenantId && !a.IsDeleted && a.IsActive)
                .SumAsync(a => a.Balance);

            return Result<decimal>.Success(total);
        }
        catch (Exception ex)
        {
            return Result<decimal>.Failure($"خطأ: {ex.Message}");
        }
    }
}

// ════════════════════════════════════════════════════════════════
// 8. EmployeeService
// ════════════════════════════════════════════════════════════════

