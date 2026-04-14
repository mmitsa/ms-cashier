using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting;

/// <summary>
/// خدمة إدارة شجرة الحسابات: قراءة (مسطّحة)، إنشاء حساب فرعي تحت أب تجميعي،
/// وتعديل الحقول القابلة للتغيير فقط (الاسم/الوصف/التفعيل).
/// </summary>
public class ChartOfAccountService : IChartOfAccountService
{
    private readonly IUnitOfWork _uow;

    public ChartOfAccountService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<Result<IReadOnlyList<ChartOfAccountDto>>> GetAllAsync(CancellationToken ct = default)
    {
        var accounts = await _uow.Repository<ChartOfAccount>().Query()
            .OrderBy(a => a.Code)
            .Select(a => new ChartOfAccountDto(
                a.Id,
                a.Code,
                a.NameAr,
                a.NameEn,
                (byte)a.Category,
                (byte)a.Nature,
                a.ParentId,
                a.Level,
                a.IsGroup,
                a.IsSystem,
                a.IsActive,
                a.Description))
            .ToListAsync(ct);

        return Result<IReadOnlyList<ChartOfAccountDto>>.Success(accounts);
    }

    public async Task<Result<ChartOfAccountDto>> CreateAsync(CreateChartOfAccountRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
            return Result<ChartOfAccountDto>.Failure("كود الحساب مطلوب");
        if (string.IsNullOrWhiteSpace(request.NameAr))
            return Result<ChartOfAccountDto>.Failure("اسم الحساب بالعربية مطلوب");

        var code = request.Code.Trim();
        var nameAr = request.NameAr.Trim();
        var nameEn = string.IsNullOrWhiteSpace(request.NameEn) ? null : request.NameEn.Trim();
        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        var repo = _uow.Repository<ChartOfAccount>();

        var parent = await repo.Query().FirstOrDefaultAsync(a => a.Id == request.ParentId, ct);
        if (parent is null)
            return Result<ChartOfAccountDto>.Failure("الحساب الأب غير موجود");

        if (!parent.IsGroup)
            return Result<ChartOfAccountDto>.Failure("لا يمكن إضافة حسابات فرعية إلا تحت حسابات تجميعية");

        var codeExists = await repo.Query().AnyAsync(a => a.Code == code, ct);
        if (codeExists)
            return Result<ChartOfAccountDto>.Failure($"كود الحساب «{code}» مستخدم مسبقًا");

        // Convention: child code should start with parent's code. Warn silently by still allowing,
        // but enforce to keep hierarchy consistent.
        if (!code.StartsWith(parent.Code, StringComparison.Ordinal))
            return Result<ChartOfAccountDto>.Failure($"يجب أن يبدأ كود الحساب الفرعي بكود الأب «{parent.Code}»");

        var entity = new ChartOfAccount
        {
            Code = code,
            NameAr = nameAr,
            NameEn = nameEn,
            Category = parent.Category,
            Nature = parent.Nature,
            ParentId = parent.Id,
            Level = (byte)(parent.Level + 1),
            IsGroup = false,
            IsSystem = false,
            IsActive = true,
            Currency = parent.Currency,
            Description = description,
        };

        await repo.AddAsync(entity);
        await _uow.SaveChangesAsync(ct);

        return Result<ChartOfAccountDto>.Success(ToDto(entity));
    }

    public async Task<Result<ChartOfAccountDto>> UpdateAsync(int id, UpdateChartOfAccountRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.NameAr))
            return Result<ChartOfAccountDto>.Failure("اسم الحساب بالعربية مطلوب");

        var repo = _uow.Repository<ChartOfAccount>();
        var entity = await repo.Query().FirstOrDefaultAsync(a => a.Id == id, ct);
        if (entity is null)
            return Result<ChartOfAccountDto>.Failure("الحساب غير موجود");

        if (entity.IsSystem)
            return Result<ChartOfAccountDto>.Failure("لا يمكن تعديل حسابات النظام");

        entity.NameAr = request.NameAr.Trim();
        entity.NameEn = string.IsNullOrWhiteSpace(request.NameEn) ? null : request.NameEn.Trim();
        entity.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        entity.IsActive = request.IsActive;

        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Result<ChartOfAccountDto>.Success(ToDto(entity));
    }

    private static ChartOfAccountDto ToDto(ChartOfAccount a) =>
        new(
            a.Id,
            a.Code,
            a.NameAr,
            a.NameEn,
            (byte)a.Category,
            (byte)a.Nature,
            a.ParentId,
            a.Level,
            a.IsGroup,
            a.IsSystem,
            a.IsActive,
            a.Description);
}
