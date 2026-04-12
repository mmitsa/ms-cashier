using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 4. ContactService
// ════════════════════════════════════════════════════════════════

public class ContactService : IContactService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public ContactService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<ContactDto>> CreateAsync(CreateContactRequest request)
    {
        try
        {
            var exists = await _uow.Repository<Contact>().AnyAsync(c =>
                c.TenantId == _tenant.TenantId &&
                c.Name == request.Name &&
                c.ContactType == request.ContactType &&
                !c.IsDeleted);

            if (exists)
                return Result<ContactDto>.Failure("جهة الاتصال موجودة بالفعل");

            var contact = new Contact
            {
                TenantId = _tenant.TenantId,
                ContactType = request.ContactType,
                Name = request.Name,
                Phone = request.Phone,
                Phone2 = request.Phone2,
                Email = request.Email,
                Address = request.Address,
                TaxNumber = request.TaxNumber,
                PriceType = request.PriceType,
                CreditLimit = request.CreditLimit,
                Balance = 0,
                IsActive = true
            };

            await _uow.Repository<Contact>().AddAsync(contact);
            await _uow.SaveChangesAsync();

            return Result<ContactDto>.Success(MapContactToDto(contact), "تم إنشاء جهة الاتصال بنجاح");
        }
        catch (Exception ex)
        {
            return Result<ContactDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<ContactDto>>> SearchAsync(string? search, int? type, int page, int pageSize)
    {
        try
        {
            var query = _uow.Repository<Contact>().Query()
                .Where(c => c.TenantId == _tenant.TenantId && !c.IsDeleted);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(c =>
                    c.Name.ToLower().Contains(term) ||
                    (c.Phone != null && c.Phone.Contains(term)) ||
                    (c.Email != null && c.Email.ToLower().Contains(term)));
            }

            if (type.HasValue)
                query = query.Where(c => (int)c.ContactType == type.Value);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var dtos = items.Select(MapContactToDto).ToList();

            var result = new PagedResult<ContactDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize
            };

            return Result<PagedResult<ContactDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<PagedResult<ContactDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<ContactDto>> GetByIdAsync(int id)
    {
        try
        {
            var contact = await _uow.Repository<Contact>().Query()
                .FirstOrDefaultAsync(c =>
                    c.Id == id &&
                    c.TenantId == _tenant.TenantId &&
                    !c.IsDeleted);

            if (contact is null)
                return Result<ContactDto>.Failure("جهة الاتصال غير موجودة");

            return Result<ContactDto>.Success(MapContactToDto(contact));
        }
        catch (Exception ex)
        {
            return Result<ContactDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<ContactDto>> UpdateAsync(int id, CreateContactRequest request)
    {
        try
        {
            var contact = await _uow.Repository<Contact>().Query()
                .FirstOrDefaultAsync(c =>
                    c.Id == id &&
                    c.TenantId == _tenant.TenantId &&
                    !c.IsDeleted);

            if (contact is null)
                return Result<ContactDto>.Failure("جهة الاتصال غير موجودة");

            contact.ContactType = request.ContactType;
            contact.Name = request.Name;
            contact.Phone = request.Phone;
            contact.Phone2 = request.Phone2;
            contact.Email = request.Email;
            contact.Address = request.Address;
            contact.TaxNumber = request.TaxNumber;
            contact.PriceType = request.PriceType;
            contact.CreditLimit = request.CreditLimit;
            contact.UpdatedAt = DateTime.UtcNow;

            _uow.Repository<Contact>().Update(contact);
            await _uow.SaveChangesAsync();

            return Result<ContactDto>.Success(MapContactToDto(contact), "تم التحديث بنجاح");
        }
        catch (Exception ex)
        {
            return Result<ContactDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<decimal>> GetBalanceAsync(int id)
    {
        try
        {
            var contact = await _uow.Repository<Contact>().Query()
                .FirstOrDefaultAsync(c =>
                    c.Id == id &&
                    c.TenantId == _tenant.TenantId &&
                    !c.IsDeleted);

            if (contact is null)
                return Result<decimal>.Failure("جهة الاتصال غير موجودة");

            return Result<decimal>.Success(contact.Balance);
        }
        catch (Exception ex)
        {
            return Result<decimal>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> RecordPaymentAsync(int id, decimal amount, int accountId)
    {
        try
        {
            await _uow.BeginTransactionAsync();

            var contact = await _uow.Repository<Contact>().Query()
                .FirstOrDefaultAsync(c =>
                    c.Id == id &&
                    c.TenantId == _tenant.TenantId &&
                    !c.IsDeleted);

            if (contact is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<bool>.Failure("جهة الاتصال غير موجودة");
            }

            if (amount <= 0)
            {
                await _uow.RollbackTransactionAsync();
                return Result<bool>.Failure("المبلغ يجب أن يكون أكبر من صفر");
            }

            contact.Balance -= amount;
            if (contact.Balance < 0) contact.Balance = 0;
            contact.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<Contact>().Update(contact);

            var account = await _uow.Repository<FinanceAccount>().GetByIdAsync(accountId);
            if (account is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<bool>.Failure("الحساب المالي غير موجود");
            }

            var balanceBefore = account.Balance;
            account.Balance += amount;
            _uow.Repository<FinanceAccount>().Update(account);

            var finTx = new FinanceTransaction
            {
                TenantId = _tenant.TenantId,
                AccountId = accountId,
                TransactionType = TransactionType.Income,
                Category = "تحصيل ديون",
                Amount = amount,
                BalanceBefore = balanceBefore,
                BalanceAfter = account.Balance,
                Description = $"تحصيل من {contact.Name}",
                ReferenceType = "ContactPayment",
                ReferenceId = id.ToString(),
                CreatedBy = _tenant.UserId,
                CreatedAt = DateTime.UtcNow
            };
            await _uow.Repository<FinanceTransaction>().AddAsync(finTx);

            await _uow.SaveChangesAsync();
            await _uow.CommitTransactionAsync();

            return Result<bool>.Success(true, "تم تسجيل الدفعة بنجاح");
        }
        catch (Exception ex)
        {
            await _uow.RollbackTransactionAsync();
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    private static ContactDto MapContactToDto(Contact c) => new(
        c.Id, c.ContactType, c.Name, c.Phone, c.Email,
        c.Address, c.PriceType, c.CreditLimit, c.Balance,
        c.IsActive, c.TaxNumber);
}

// ════════════════════════════════════════════════════════════════
// 5. CategoryService
// ════════════════════════════════════════════════════════════════

