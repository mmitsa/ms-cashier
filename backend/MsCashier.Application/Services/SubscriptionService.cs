using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// SubscriptionService
// ════════════════════════════════════════════════════════════════

public class SubscriptionService : ISubscriptionService
{
    private readonly IUnitOfWork _uow;
    private const int TRIAL_DAYS = 14;

    public SubscriptionService(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<SubscriptionRequestDto>> SubmitRequestAsync(CreateSubscriptionRequest request)
    {
        try
        {
            // Validation
            if (string.IsNullOrWhiteSpace(request.StoreName))
                return Result<SubscriptionRequestDto>.Failure("اسم المتجر مطلوب");
            if (string.IsNullOrWhiteSpace(request.OwnerName))
                return Result<SubscriptionRequestDto>.Failure("اسم المالك مطلوب");
            if (string.IsNullOrWhiteSpace(request.Phone))
                return Result<SubscriptionRequestDto>.Failure("رقم الهاتف مطلوب");
            if (string.IsNullOrWhiteSpace(request.VatNumber))
                return Result<SubscriptionRequestDto>.Failure("الرقم الضريبي مطلوب");
            if (string.IsNullOrWhiteSpace(request.AdminUsername) || request.AdminUsername.Length < 3)
                return Result<SubscriptionRequestDto>.Failure("اسم المستخدم يجب أن يكون 3 أحرف على الأقل");
            if (string.IsNullOrWhiteSpace(request.AdminPassword) || request.AdminPassword.Length < 6)
                return Result<SubscriptionRequestDto>.Failure("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            if (string.IsNullOrWhiteSpace(request.City))
                return Result<SubscriptionRequestDto>.Failure("المدينة مطلوبة");

            // Check username is unique across all tenants
            var usernameExists = await _uow.Repository<User>().QueryUnfiltered()
                .AnyAsync(u => u.Username == request.AdminUsername && !u.IsDeleted);
            if (usernameExists)
                return Result<SubscriptionRequestDto>.Failure("اسم المستخدم مستخدم بالفعل. اختر اسم مستخدم آخر.");

            // Check no duplicate pending request with same phone/username
            var duplicateRequest = await _uow.Repository<SubscriptionRequest>().Query()
                .AnyAsync(r => r.Status == SubscriptionRequestStatus.Pending &&
                    (r.Phone == request.Phone || r.AdminUsername == request.AdminUsername));
            if (duplicateRequest)
                return Result<SubscriptionRequestDto>.Failure("يوجد طلب اشتراك مسبق بنفس رقم الهاتف أو اسم المستخدم. انتظر مراجعته.");

            var plan = await _uow.Repository<Plan>().Query().FirstOrDefaultAsync(p => p.Id == request.PlanId);
            if (plan is null)
                return Result<SubscriptionRequestDto>.Failure("الباقة غير موجودة");

            var entity = new SubscriptionRequest
            {
                StoreName = request.StoreName,
                BusinessType = request.BusinessType,
                OwnerName = request.OwnerName,
                Phone = request.Phone,
                Email = request.Email,
                Address = request.Address,
                City = request.City,
                VatNumber = request.VatNumber,
                PlanId = request.PlanId,
                AdminUsername = request.AdminUsername,
                AdminFullName = request.AdminFullName,
                Notes = request.Notes,
                Status = SubscriptionRequestStatus.Pending
            };

            await _uow.Repository<SubscriptionRequest>().AddAsync(entity);
            await _uow.SaveChangesAsync();

            return Result<SubscriptionRequestDto>.Success(MapToDto(entity, plan.Name), "تم إرسال طلب الاشتراك بنجاح! سيتم مراجعته خلال 24 ساعة.");
        }
        catch (Exception ex)
        {
            return Result<SubscriptionRequestDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<SubscriptionRequestDto>>> GetAllRequestsAsync(int page, int pageSize, SubscriptionRequestStatus? status)
    {
        try
        {
            var query = _uow.Repository<SubscriptionRequest>().Query()
                .Include(r => r.Plan)
                .AsQueryable();

            if (status.HasValue)
                query = query.Where(r => r.Status == status.Value);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = new PagedResult<SubscriptionRequestDto>
            {
                Items = items.Select(r => MapToDto(r, r.Plan?.Name)).ToList(),
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize
            };

            return Result<PagedResult<SubscriptionRequestDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<PagedResult<SubscriptionRequestDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<SubscriptionRequestDto>> ReviewRequestAsync(int id, ReviewSubscriptionRequest review, Guid reviewerId)
    {
        try
        {
            var request = await _uow.Repository<SubscriptionRequest>().Query()
                .Include(r => r.Plan)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request is null)
                return Result<SubscriptionRequestDto>.Failure("طلب الاشتراك غير موجود");

            if (request.Status != SubscriptionRequestStatus.Pending)
                return Result<SubscriptionRequestDto>.Failure("هذا الطلب تمت مراجعته بالفعل");

            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewedBy = reviewerId;
            request.AdminNotes = review.AdminNotes;

            if (!review.Approved)
            {
                request.Status = SubscriptionRequestStatus.Rejected;
                _uow.Repository<SubscriptionRequest>().Update(request);
                await _uow.SaveChangesAsync();
                return Result<SubscriptionRequestDto>.Success(MapToDto(request, request.Plan?.Name), "تم رفض الطلب");
            }

            // Approved — create tenant with trial period
            var plan = request.Plan ?? await _uow.Repository<Plan>().Query().FirstOrDefaultAsync(p => p.Id == request.PlanId);
            if (plan is null)
                return Result<SubscriptionRequestDto>.Failure("الباقة غير موجودة");

            // Re-check username uniqueness
            var usernameExists = await _uow.Repository<User>().QueryUnfiltered()
                .AnyAsync(u => u.Username == request.AdminUsername && !u.IsDeleted);
            if (usernameExists)
                return Result<SubscriptionRequestDto>.Failure("اسم المستخدم أصبح مستخدماً. راجع الطلب مع صاحب المتجر.");

            var tenantId = Guid.NewGuid();
            var tenant = new Tenant
            {
                Id = tenantId,
                Name = request.StoreName,
                BusinessType = request.BusinessType,
                OwnerName = request.OwnerName,
                Phone = request.Phone,
                Email = request.Email,
                Address = request.Address,
                City = request.City,
                PlanId = request.PlanId,
                Status = TenantStatus.Trial,
                SubscriptionStart = DateTime.UtcNow,
                TrialEndDate = DateTime.UtcNow.AddDays(TRIAL_DAYS),
                VatNumber = request.VatNumber,
                MaxUsers = plan.MaxUsers,
                MaxWarehouses = plan.MaxWarehouses,
                MaxPosStations = plan.MaxPosStations,
                AdminEmail = request.Email
            };
            await _uow.Repository<Tenant>().AddAsync(tenant);

            // Create the admin password hash from the original request
            // Note: The password was NOT stored — we generate a temp one. The admin must change it.
            var tempPassword = $"Trial@{DateTime.UtcNow:yyyyMMdd}";
            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Username = request.AdminUsername,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                FullName = request.AdminFullName,
                Email = request.Email,
                Phone = request.Phone,
                Role = "Admin",
                IsActive = true
            };
            await _uow.Repository<User>().AddAsync(adminUser);

            // Default warehouse
            var warehouse = new Warehouse
            {
                TenantId = tenantId,
                Name = "المستودع الرئيسي",
                Location = request.City,
                IsMain = true,
                IsActive = true
            };
            await _uow.Repository<Warehouse>().AddAsync(warehouse);

            // Default finance account
            var account = new FinanceAccount
            {
                TenantId = tenantId,
                Name = "الصندوق النقدي",
                AccountType = AccountType.Cash,
                Balance = 0,
                IsActive = true
            };
            await _uow.Repository<FinanceAccount>().AddAsync(account);

            request.Status = SubscriptionRequestStatus.Approved;
            request.ApprovedTenantId = tenantId;
            _uow.Repository<SubscriptionRequest>().Update(request);

            await _uow.SaveChangesAsync();

            return Result<SubscriptionRequestDto>.Success(
                MapToDto(request, plan.Name),
                $"تم تفعيل المتجر بنجاح! الفترة التجريبية: {TRIAL_DAYS} يوم. كلمة المرور المؤقتة: {tempPassword}");
        }
        catch (Exception ex)
        {
            return Result<SubscriptionRequestDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    private static SubscriptionRequestDto MapToDto(SubscriptionRequest r, string? planName) =>
        new(r.Id, r.StoreName, r.BusinessType, r.OwnerName, r.Phone, r.Email, r.Address, r.City,
            r.VatNumber, r.PlanId, planName, r.AdminUsername, r.AdminFullName, r.Notes,
            r.Status, r.AdminNotes, r.ApprovedTenantId, r.CreatedAt, r.ReviewedAt);
}

// ════════════════════════════════════════════════════════════════
// PaymentGatewayService
// ════════════════════════════════════════════════════════════════

