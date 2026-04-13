using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services;

public class UnitService : IUnitService
{
    private readonly IUnitOfWork _uow;

    public UnitService(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<List<UnitDto>>> GetAllAsync()
    {
        try
        {
            var units = await _uow.Repository<Unit>().Query()
                .Include(u => u.BaseUnit)
                .OrderBy(u => u.Name)
                .AsNoTracking()
                .ToListAsync();

            var dtos = units.Select(u => MapToDto(u)).ToList();
            return Result<List<UnitDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            return Result<List<UnitDto>>.Failure($"خطأ أثناء تحميل الوحدات: {ex.Message}");
        }
    }

    public async Task<Result<UnitDto>> GetByIdAsync(int id)
    {
        try
        {
            var unit = await _uow.Repository<Unit>().Query()
                .Include(u => u.BaseUnit)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id);

            if (unit is null)
                return Result<UnitDto>.Failure("الوحدة غير موجودة");

            return Result<UnitDto>.Success(MapToDto(unit));
        }
        catch (Exception ex)
        {
            return Result<UnitDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<UnitDto>> CreateAsync(CreateUnitRequest request)
    {
        try
        {
            // Validate base unit reference if provided
            if (!request.IsBase && request.BaseUnitId.HasValue)
            {
                var baseUnit = await _uow.Repository<Unit>().GetByIdAsync(request.BaseUnitId.Value);
                if (baseUnit is null)
                    return Result<UnitDto>.Failure("الوحدة الأساسية المرجعية غير موجودة");

                if (request.ConversionRate is null or <= 0)
                    return Result<UnitDto>.Failure("معامل التحويل مطلوب ويجب أن يكون أكبر من صفر");
            }

            // If it's a base unit, clear conversion fields
            var unit = new Unit
            {
                Name = request.Name.Trim(),
                Symbol = request.Symbol?.Trim(),
                IsBase = request.IsBase,
                BaseUnitId = request.IsBase ? null : request.BaseUnitId,
                ConversionRate = request.IsBase ? null : request.ConversionRate,
            };

            await _uow.Repository<Unit>().AddAsync(unit);
            await _uow.SaveChangesAsync();

            // Re-load with navigation to get BaseUnitName
            return await GetByIdAsync(unit.Id);
        }
        catch (Exception ex)
        {
            return Result<UnitDto>.Failure($"خطأ أثناء إنشاء الوحدة: {ex.Message}");
        }
    }

    public async Task<Result<UnitDto>> UpdateAsync(int id, UpdateUnitRequest request)
    {
        try
        {
            var unit = await _uow.Repository<Unit>().GetByIdAsync(id);
            if (unit is null)
                return Result<UnitDto>.Failure("الوحدة غير موجودة");

            if (!request.IsBase && request.BaseUnitId.HasValue)
            {
                // Prevent circular reference
                if (request.BaseUnitId.Value == id)
                    return Result<UnitDto>.Failure("لا يمكن أن تكون الوحدة مرجعية لنفسها");

                var baseUnit = await _uow.Repository<Unit>().GetByIdAsync(request.BaseUnitId.Value);
                if (baseUnit is null)
                    return Result<UnitDto>.Failure("الوحدة الأساسية المرجعية غير موجودة");

                if (request.ConversionRate is null or <= 0)
                    return Result<UnitDto>.Failure("معامل التحويل مطلوب ويجب أن يكون أكبر من صفر");
            }

            unit.Name = request.Name.Trim();
            unit.Symbol = request.Symbol?.Trim();
            unit.IsBase = request.IsBase;
            unit.BaseUnitId = request.IsBase ? null : request.BaseUnitId;
            unit.ConversionRate = request.IsBase ? null : request.ConversionRate;

            _uow.Repository<Unit>().Update(unit);
            await _uow.SaveChangesAsync();

            return await GetByIdAsync(id);
        }
        catch (Exception ex)
        {
            return Result<UnitDto>.Failure($"خطأ أثناء تحديث الوحدة: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var unit = await _uow.Repository<Unit>().GetByIdAsync(id);
            if (unit is null)
                return Result<bool>.Failure("الوحدة غير موجودة");

            // Check if any products use this unit
            var usedByProducts = await _uow.Repository<Product>().AnyAsync(p => p.UnitId == id);
            if (usedByProducts)
                return Result<bool>.Failure("لا يمكن حذف الوحدة لأنها مستخدمة في أصناف");

            // Check if any other units reference this as a base unit
            var usedAsBase = await _uow.Repository<Unit>().AnyAsync(u => u.BaseUnitId == id);
            if (usedAsBase)
                return Result<bool>.Failure("لا يمكن حذف الوحدة لأنها مرجعية لوحدات أخرى");

            unit.IsDeleted = true;
            _uow.Repository<Unit>().Update(unit);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم حذف الوحدة بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ أثناء حذف الوحدة: {ex.Message}");
        }
    }

    /// <summary>
    /// Convert a quantity from one unit to another within the same base-unit group.
    /// E.g., 1500 grams → 1.5 kilograms.
    /// </summary>
    public async Task<Result<decimal>> ConvertAsync(int fromUnitId, int toUnitId, decimal quantity)
    {
        try
        {
            if (fromUnitId == toUnitId)
                return Result<decimal>.Success(quantity);

            var from = await _uow.Repository<Unit>().GetByIdAsync(fromUnitId);
            var to = await _uow.Repository<Unit>().GetByIdAsync(toUnitId);

            if (from is null || to is null)
                return Result<decimal>.Failure("وحدة واحدة أو كلتاهما غير موجودة");

            // Resolve to base: value in base = quantity × fromRate
            var fromRate = from.IsBase ? 1m : (from.ConversionRate ?? 1m);
            var toRate = to.IsBase ? 1m : (to.ConversionRate ?? 1m);

            // Both must share the same base unit
            var fromBase = from.IsBase ? from.Id : from.BaseUnitId;
            var toBase = to.IsBase ? to.Id : to.BaseUnitId;

            if (fromBase != toBase)
                return Result<decimal>.Failure("لا يمكن التحويل بين وحدات من مجموعات مختلفة");

            var baseValue = quantity * fromRate;
            var result = toRate == 0 ? 0 : baseValue / toRate;

            return Result<decimal>.Success(Math.Round(result, 6));
        }
        catch (Exception ex)
        {
            return Result<decimal>.Failure($"خطأ في التحويل: {ex.Message}");
        }
    }

    private static UnitDto MapToDto(Unit u) => new(
        u.Id,
        u.Name,
        u.Symbol,
        u.IsBase,
        u.BaseUnitId,
        u.BaseUnit?.Name,
        u.ConversionRate);
}
