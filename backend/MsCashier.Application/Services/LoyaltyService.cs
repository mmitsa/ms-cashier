using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// LoyaltyService — خدمة برنامج نقاط الولاء
// ════════════════════════════════════════════════════════════════

public class LoyaltyService : ILoyaltyService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public LoyaltyService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<LoyaltyProgramDto?>> GetProgramAsync()
    {
        try
        {
            var program = await _uow.Repository<LoyaltyProgram>().Query()
                .Where(p => p.TenantId == _tenant.TenantId && !p.IsDeleted && p.IsActive)
                .FirstOrDefaultAsync();

            if (program is null)
                return Result<LoyaltyProgramDto?>.Success(null);

            return Result<LoyaltyProgramDto?>.Success(MapProgram(program));
        }
        catch (Exception ex)
        {
            return Result<LoyaltyProgramDto?>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<LoyaltyProgramDto>> CreateOrUpdateProgramAsync(CreateLoyaltyProgramRequest request)
    {
        try
        {
            var existing = await _uow.Repository<LoyaltyProgram>().Query()
                .Where(p => p.TenantId == _tenant.TenantId && !p.IsDeleted)
                .FirstOrDefaultAsync();

            if (existing is not null)
            {
                existing.Name = request.Name;
                existing.PointsPerCurrency = request.PointsPerCurrency;
                existing.RedemptionValue = request.RedemptionValue;
                existing.MinRedemptionPoints = request.MinRedemptionPoints;
                existing.PointsExpireDays = request.PointsExpireDays;
                existing.IsActive = request.IsActive;
                existing.UpdatedAt = DateTime.UtcNow;
                _uow.Repository<LoyaltyProgram>().Update(existing);
            }
            else
            {
                existing = new LoyaltyProgram
                {
                    TenantId = _tenant.TenantId,
                    Name = request.Name,
                    PointsPerCurrency = request.PointsPerCurrency,
                    RedemptionValue = request.RedemptionValue,
                    MinRedemptionPoints = request.MinRedemptionPoints,
                    PointsExpireDays = request.PointsExpireDays,
                    IsActive = request.IsActive,
                };
                await _uow.Repository<LoyaltyProgram>().AddAsync(existing);
            }

            await _uow.SaveChangesAsync();
            return Result<LoyaltyProgramDto>.Success(MapProgram(existing), "تم حفظ برنامج الولاء بنجاح");
        }
        catch (Exception ex)
        {
            return Result<LoyaltyProgramDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<CustomerLoyaltyDto>> GetCustomerLoyaltyAsync(int contactId)
    {
        try
        {
            var loyalty = await _uow.Repository<CustomerLoyalty>().Query()
                .Where(cl => cl.TenantId == _tenant.TenantId && cl.ContactId == contactId && !cl.IsDeleted)
                .FirstOrDefaultAsync();

            if (loyalty is null)
                return Result<CustomerLoyaltyDto>.Failure("العميل غير مسجل في برنامج الولاء");

            var contact = await _uow.Repository<Contact>().Query()
                .Where(c => c.Id == loyalty.ContactId)
                .Select(c => c.Name)
                .FirstOrDefaultAsync();

            var program = await _uow.Repository<LoyaltyProgram>().Query()
                .Where(p => p.Id == loyalty.LoyaltyProgramId)
                .Select(p => p.Name)
                .FirstOrDefaultAsync();

            return Result<CustomerLoyaltyDto>.Success(MapCustomerLoyalty(loyalty, contact, program));
        }
        catch (Exception ex)
        {
            return Result<CustomerLoyaltyDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<CustomerLoyaltyDto>> EnrollCustomerAsync(int contactId)
    {
        try
        {
            var program = await _uow.Repository<LoyaltyProgram>().Query()
                .Where(p => p.TenantId == _tenant.TenantId && !p.IsDeleted && p.IsActive)
                .FirstOrDefaultAsync();

            if (program is null)
                return Result<CustomerLoyaltyDto>.Failure("لا يوجد برنامج ولاء مفعّل");

            var existing = await _uow.Repository<CustomerLoyalty>().Query()
                .Where(cl => cl.TenantId == _tenant.TenantId && cl.ContactId == contactId && !cl.IsDeleted)
                .FirstOrDefaultAsync();

            if (existing is not null)
                return Result<CustomerLoyaltyDto>.Failure("العميل مسجل مسبقاً في برنامج الولاء");

            var contact = await _uow.Repository<Contact>().Query()
                .FirstOrDefaultAsync(c => c.Id == contactId && !c.IsDeleted);

            if (contact is null)
                return Result<CustomerLoyaltyDto>.Failure("العميل غير موجود");

            var loyalty = new CustomerLoyalty
            {
                TenantId = _tenant.TenantId,
                ContactId = contactId,
                LoyaltyProgramId = program.Id,
                CurrentPoints = 0,
                TotalEarnedPoints = 0,
                TotalRedeemedPoints = 0,
                EnrolledAt = DateTime.UtcNow,
            };

            await _uow.Repository<CustomerLoyalty>().AddAsync(loyalty);
            await _uow.SaveChangesAsync();

            return Result<CustomerLoyaltyDto>.Success(
                MapCustomerLoyalty(loyalty, contact.Name, program.Name),
                "تم تسجيل العميل في برنامج الولاء بنجاح");
        }
        catch (Exception ex)
        {
            return Result<CustomerLoyaltyDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<LoyaltyTransactionDto>> EarnPointsAsync(int contactId, long invoiceId, decimal totalAmount)
    {
        try
        {
            var program = await _uow.Repository<LoyaltyProgram>().Query()
                .Where(p => p.TenantId == _tenant.TenantId && !p.IsDeleted && p.IsActive)
                .FirstOrDefaultAsync();

            if (program is null)
                return Result<LoyaltyTransactionDto>.Failure("لا يوجد برنامج ولاء مفعّل");

            // Auto-enroll if not enrolled
            var loyalty = await _uow.Repository<CustomerLoyalty>().Query()
                .Where(cl => cl.TenantId == _tenant.TenantId && cl.ContactId == contactId && !cl.IsDeleted)
                .FirstOrDefaultAsync();

            if (loyalty is null)
            {
                loyalty = new CustomerLoyalty
                {
                    TenantId = _tenant.TenantId,
                    ContactId = contactId,
                    LoyaltyProgramId = program.Id,
                    CurrentPoints = 0,
                    TotalEarnedPoints = 0,
                    TotalRedeemedPoints = 0,
                    EnrolledAt = DateTime.UtcNow,
                };
                await _uow.Repository<CustomerLoyalty>().AddAsync(loyalty);
                await _uow.SaveChangesAsync();
            }

            var points = (int)Math.Floor(totalAmount * program.PointsPerCurrency);
            if (points <= 0)
                return Result<LoyaltyTransactionDto>.Failure("المبلغ غير كافٍ لكسب نقاط");

            loyalty.CurrentPoints += points;
            loyalty.TotalEarnedPoints += points;
            loyalty.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<CustomerLoyalty>().Update(loyalty);

            var transaction = new LoyaltyTransaction
            {
                TenantId = _tenant.TenantId,
                CustomerLoyaltyId = loyalty.Id,
                InvoiceId = invoiceId,
                Type = LoyaltyTransactionType.Earn,
                Points = points,
                Description = $"كسب نقاط من فاتورة #{invoiceId} بمبلغ {totalAmount:N2}",
                ExpiresAt = program.PointsExpireDays > 0
                    ? DateTime.UtcNow.AddDays(program.PointsExpireDays)
                    : null,
            };

            await _uow.Repository<LoyaltyTransaction>().AddAsync(transaction);
            await _uow.SaveChangesAsync();

            return Result<LoyaltyTransactionDto>.Success(MapTransaction(transaction), $"تم إضافة {points} نقطة");
        }
        catch (Exception ex)
        {
            return Result<LoyaltyTransactionDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<decimal>> RedeemPointsAsync(int contactId, int points)
    {
        try
        {
            var program = await _uow.Repository<LoyaltyProgram>().Query()
                .Where(p => p.TenantId == _tenant.TenantId && !p.IsDeleted && p.IsActive)
                .FirstOrDefaultAsync();

            if (program is null)
                return Result<decimal>.Failure("لا يوجد برنامج ولاء مفعّل");

            if (points < program.MinRedemptionPoints)
                return Result<decimal>.Failure($"الحد الأدنى للاستبدال {program.MinRedemptionPoints} نقطة");

            var loyalty = await _uow.Repository<CustomerLoyalty>().Query()
                .Where(cl => cl.TenantId == _tenant.TenantId && cl.ContactId == contactId && !cl.IsDeleted)
                .FirstOrDefaultAsync();

            if (loyalty is null)
                return Result<decimal>.Failure("العميل غير مسجل في برنامج الولاء");

            if (loyalty.CurrentPoints < points)
                return Result<decimal>.Failure($"رصيد النقاط غير كافٍ. الرصيد الحالي: {loyalty.CurrentPoints}");

            var discount = points * program.RedemptionValue;

            loyalty.CurrentPoints -= points;
            loyalty.TotalRedeemedPoints += points;
            loyalty.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<CustomerLoyalty>().Update(loyalty);

            var transaction = new LoyaltyTransaction
            {
                TenantId = _tenant.TenantId,
                CustomerLoyaltyId = loyalty.Id,
                Type = LoyaltyTransactionType.Redeem,
                Points = points,
                Description = $"استبدال {points} نقطة بخصم {discount:N2}",
            };

            await _uow.Repository<LoyaltyTransaction>().AddAsync(transaction);
            await _uow.SaveChangesAsync();

            return Result<decimal>.Success(discount, $"تم استبدال {points} نقطة بخصم {discount:N2}");
        }
        catch (Exception ex)
        {
            return Result<decimal>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<LoyaltyTransactionDto>>> GetTransactionsAsync(int contactId, int page, int pageSize)
    {
        try
        {
            var loyalty = await _uow.Repository<CustomerLoyalty>().Query()
                .Where(cl => cl.TenantId == _tenant.TenantId && cl.ContactId == contactId && !cl.IsDeleted)
                .FirstOrDefaultAsync();

            if (loyalty is null)
                return Result<PagedResult<LoyaltyTransactionDto>>.Failure("العميل غير مسجل في برنامج الولاء");

            var query = _uow.Repository<LoyaltyTransaction>().Query()
                .Where(t => t.TenantId == _tenant.TenantId && t.CustomerLoyaltyId == loyalty.Id && !t.IsDeleted);

            var totalCount = await query.CountAsync();

            var transactions = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = new PagedResult<LoyaltyTransactionDto>
            {
                Items = transactions.Select(MapTransaction).ToList(),
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize,
            };

            return Result<PagedResult<LoyaltyTransactionDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<PagedResult<LoyaltyTransactionDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<LoyaltyDashboardDto>> GetDashboardAsync()
    {
        try
        {
            var members = await _uow.Repository<CustomerLoyalty>().Query()
                .Where(cl => cl.TenantId == _tenant.TenantId && !cl.IsDeleted)
                .ToListAsync();

            var totalMembers = members.Count;
            var activeMembers = members.Count(m => m.CurrentPoints > 0);
            var totalPointsIssued = members.Sum(m => (long)m.TotalEarnedPoints);
            var totalPointsRedeemed = members.Sum(m => (long)m.TotalRedeemedPoints);
            var totalPointsActive = members.Sum(m => (long)m.CurrentPoints);

            var program = await _uow.Repository<LoyaltyProgram>().Query()
                .Where(p => p.TenantId == _tenant.TenantId && !p.IsDeleted && p.IsActive)
                .FirstOrDefaultAsync();

            var totalRedemptionValue = program is not null
                ? totalPointsActive * program.RedemptionValue
                : 0;

            var contactIds = members.Select(m => m.ContactId).Distinct().ToList();
            var contacts = contactIds.Count > 0
                ? await _uow.Repository<Contact>().Query()
                    .Where(c => contactIds.Contains(c.Id))
                    .ToDictionaryAsync(c => c.Id, c => c.Name)
                : new Dictionary<int, string>();

            var topCustomers = members
                .OrderByDescending(m => m.CurrentPoints)
                .Take(10)
                .Select(m => new LoyaltyTopCustomerDto(
                    m.ContactId,
                    contacts.ContainsKey(m.ContactId) ? contacts[m.ContactId] : null,
                    m.CurrentPoints,
                    m.TotalEarnedPoints))
                .ToList();

            return Result<LoyaltyDashboardDto>.Success(new LoyaltyDashboardDto(
                totalMembers, activeMembers, totalPointsIssued, totalPointsRedeemed,
                totalPointsActive, totalRedemptionValue, topCustomers));
        }
        catch (Exception ex)
        {
            return Result<LoyaltyDashboardDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    // ─── Mapping helpers ────────────────────────────────

    private static LoyaltyProgramDto MapProgram(LoyaltyProgram p) => new(
        p.Id, p.Name, p.PointsPerCurrency, p.RedemptionValue,
        p.MinRedemptionPoints, p.PointsExpireDays, p.IsActive);

    private static CustomerLoyaltyDto MapCustomerLoyalty(CustomerLoyalty cl, string? contactName, string? programName) => new(
        cl.Id, cl.ContactId, contactName, cl.LoyaltyProgramId, programName,
        cl.CurrentPoints, cl.TotalEarnedPoints, cl.TotalRedeemedPoints,
        cl.LoyaltyCardBarcode, cl.EnrolledAt);

    private static LoyaltyTransactionDto MapTransaction(LoyaltyTransaction t) => new(
        t.Id, t.CustomerLoyaltyId, t.InvoiceId, t.Type, t.Points,
        t.Description, t.ExpiresAt, t.CreatedAt);
}
