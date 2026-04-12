using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 7. FinanceService
// ════════════════════════════════════════════════════════════════

public class FinanceService : IFinanceService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public FinanceService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
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
                CreatedBy = _tenant.UserId,
                CreatedAt = DateTime.UtcNow
            };

            await _uow.Repository<FinanceTransaction>().AddAsync(transaction);
            await _uow.SaveChangesAsync();

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

