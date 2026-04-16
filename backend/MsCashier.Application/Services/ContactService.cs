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

            // Validation: company requires TaxNumber + CommercialRegister
            if (request.IsCompany)
            {
                if (string.IsNullOrWhiteSpace(request.TaxNumber))
                    return Result<ContactDto>.Failure("الرقم الضريبي مطلوب للشركات");
                if (string.IsNullOrWhiteSpace(request.CommercialRegister))
                    return Result<ContactDto>.Failure("السجل التجاري مطلوب للشركات");
            }

            // Validation: CreditPeriodDays must be > 0 if provided
            if (request.CreditPeriodDays.HasValue && request.CreditPeriodDays.Value <= 0)
                return Result<ContactDto>.Failure("مدة السداد يجب أن تكون أكبر من صفر");

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
                IsActive = true,
                IsCompany = request.IsCompany,
                CommercialRegister = request.CommercialRegister,
                NationalId = request.NationalId,
                BankName = request.BankName,
                BankAccountNumber = request.BankAccountNumber,
                Iban = request.Iban,
                CreditPeriodDays = request.CreditPeriodDays,
                PaymentMethod = request.PaymentMethod,
                ProjectName = request.ProjectName,
                Notes = request.Notes,
                // ZATCA
                Street = request.Street,
                District = request.District,
                City = request.City,
                Province = request.Province,
                PostalCode = request.PostalCode,
                CountryCode = request.CountryCode ?? "SA",
                BuildingNumber = request.BuildingNumber,
                PlotIdentification = request.PlotIdentification,
                IdScheme = request.IdScheme,
                OtherId = request.OtherId,
                ContactPerson = request.ContactPerson,
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
                .AsNoTracking()
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

            // Validation: company requires TaxNumber + CommercialRegister
            if (request.IsCompany)
            {
                if (string.IsNullOrWhiteSpace(request.TaxNumber))
                    return Result<ContactDto>.Failure("الرقم الضريبي مطلوب للشركات");
                if (string.IsNullOrWhiteSpace(request.CommercialRegister))
                    return Result<ContactDto>.Failure("السجل التجاري مطلوب للشركات");
            }

            // Validation: CreditPeriodDays must be > 0 if provided
            if (request.CreditPeriodDays.HasValue && request.CreditPeriodDays.Value <= 0)
                return Result<ContactDto>.Failure("مدة السداد يجب أن تكون أكبر من صفر");

            contact.ContactType = request.ContactType;
            contact.Name = request.Name;
            contact.Phone = request.Phone;
            contact.Phone2 = request.Phone2;
            contact.Email = request.Email;
            contact.Address = request.Address;
            contact.TaxNumber = request.TaxNumber;
            contact.PriceType = request.PriceType;
            contact.CreditLimit = request.CreditLimit;
            contact.IsCompany = request.IsCompany;
            contact.CommercialRegister = request.CommercialRegister;
            contact.NationalId = request.NationalId;
            contact.BankName = request.BankName;
            contact.BankAccountNumber = request.BankAccountNumber;
            contact.Iban = request.Iban;
            contact.CreditPeriodDays = request.CreditPeriodDays;
            contact.PaymentMethod = request.PaymentMethod;
            contact.ProjectName = request.ProjectName;
            contact.Notes = request.Notes;
            // ZATCA
            contact.Street = request.Street;
            contact.District = request.District;
            contact.City = request.City;
            contact.Province = request.Province;
            contact.PostalCode = request.PostalCode;
            contact.CountryCode = request.CountryCode ?? "SA";
            contact.BuildingNumber = request.BuildingNumber;
            contact.PlotIdentification = request.PlotIdentification;
            contact.IdScheme = request.IdScheme;
            contact.OtherId = request.OtherId;
            contact.ContactPerson = request.ContactPerson;
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
        c.Id, c.ContactType, c.Name, c.Phone, c.Phone2, c.Email,
        c.Address, c.PriceType, c.CreditLimit, c.Balance,
        c.IsActive, c.TaxNumber, c.IsCompany, c.CommercialRegister, c.NationalId,
        c.BankName, c.BankAccountNumber, c.Iban,
        c.CreditPeriodDays, c.PaymentMethod, c.ProjectName, c.Notes,
        c.Street, c.District, c.City, c.Province, c.PostalCode,
        c.CountryCode, c.BuildingNumber, c.PlotIdentification,
        c.IdScheme, c.OtherId, c.ContactPerson);
}

// ════════════════════════════════════════════════════════════════
// 5. CategoryService
// ════════════════════════════════════════════════════════════════

