using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ============================================================
// QR Config Service (store owner management)
// ============================================================

public class QrConfigService : IQrConfigService
{
    private readonly IUnitOfWork _uow;
    public QrConfigService(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<List<QrConfigDto>>> GetAllAsync(string baseUrl)
    {
        var configs = await _uow.Repository<StoreQrConfig>().Query()
            .Include(q => q.Table)
            .OrderByDescending(q => q.Id)
            .ToListAsync();

        var dtos = configs.Select(q => MapToDto(q, baseUrl)).ToList();
        return Result<List<QrConfigDto>>.Success(dtos);
    }

    public async Task<Result<QrConfigDto>> SaveAsync(int? id, SaveQrConfigRequest req, string baseUrl)
    {
        StoreQrConfig entity;
        if (id.HasValue)
        {
            entity = await _uow.Repository<StoreQrConfig>().Query()
                .FirstOrDefaultAsync(q => q.Id == id.Value)
                ?? throw new KeyNotFoundException();
        }
        else
        {
            entity = new StoreQrConfig();
            await _uow.Repository<StoreQrConfig>().AddAsync(entity);
        }

        entity.TableId = req.TableId;
        entity.BranchId = req.BranchId;
        entity.DefaultType = Enum.TryParse<QrSessionType>(req.DefaultType, out var dt) ? dt : QrSessionType.DineIn;
        entity.IsActive = req.IsActive;
        entity.AllowRemoteOrder = req.AllowRemoteOrder;
        entity.RequirePhone = req.RequirePhone;
        entity.AllowCashPayment = req.AllowCashPayment;
        entity.AllowOnlinePayment = req.AllowOnlinePayment;
        entity.ServiceChargePercent = req.ServiceChargePercent;
        entity.WelcomeMessage = req.WelcomeMessage;
        entity.LogoUrl = req.LogoUrl;
        entity.ThemeColor = req.ThemeColor ?? "#6366f1";

        await _uow.SaveChangesAsync();

        var saved = await _uow.Repository<StoreQrConfig>().Query()
            .Include(q => q.Table).FirstOrDefaultAsync(q => q.Id == entity.Id);
        return Result<QrConfigDto>.Success(MapToDto(saved!, baseUrl));
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var entity = await _uow.Repository<StoreQrConfig>().Query().FirstOrDefaultAsync(q => q.Id == id);
        if (entity is null) return Result<bool>.Failure("الكود غير موجود");
        _uow.Repository<StoreQrConfig>().Remove(entity);
        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> RegenerateCodeAsync(int id)
    {
        var entity = await _uow.Repository<StoreQrConfig>().Query().FirstOrDefaultAsync(q => q.Id == id);
        if (entity is null) return Result<bool>.Failure("الكود غير موجود");
        entity.Code = Guid.NewGuid().ToString("N")[..12];
        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    private static QrConfigDto MapToDto(StoreQrConfig q, string baseUrl) => new(
        q.Id, q.Code, q.TableId, q.Table?.TableNumber, q.BranchId,
        q.DefaultType.ToString(), q.IsActive, q.AllowRemoteOrder,
        q.RequirePhone, q.AllowCashPayment, q.AllowOnlinePayment,
        q.ServiceChargePercent, q.WelcomeMessage,
        q.LogoUrl, q.ThemeColor,
        $"{baseUrl}/order/{q.Code}");
}

// ============================================================
// Customer Order Service (PUBLIC — no authentication)
// ============================================================

