using System.Text.Json;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// RfidInventoryService
// ════════════════════════════════════════════════════════════════

public class RfidInventoryService : IRfidInventoryService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public RfidInventoryService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    // ── RFID Tags ──────────────────────────────────────────────

    public async Task<Result<List<ProductRfidTagDto>>> GetTagsAsync(int? productId)
    {
        try
        {
            var query = _uow.Repository<ProductRfidTag>().Query()
                .Where(t => t.TenantId == _tenant.TenantId && t.IsActive);

            if (productId.HasValue)
                query = query.Where(t => t.ProductId == productId.Value);

            var tags = await query.OrderByDescending(t => t.TaggedAt).ToListAsync();

            var productIds = tags.Select(t => t.ProductId).Distinct().ToList();
            var products = await _uow.Repository<Product>().Query()
                .Where(p => productIds.Contains(p.Id) && !p.IsDeleted)
                .ToDictionaryAsync(p => p.Id, p => p.Name);

            var warehouseIds = tags.Where(t => t.WarehouseId.HasValue).Select(t => t.WarehouseId!.Value).Distinct().ToList();
            var warehouses = warehouseIds.Count > 0
                ? await _uow.Repository<Warehouse>().Query()
                    .Where(w => warehouseIds.Contains(w.Id) && !w.IsDeleted)
                    .ToDictionaryAsync(w => w.Id, w => w.Name)
                : new Dictionary<int, string>();

            var dtos = tags.Select(t => new ProductRfidTagDto(
                t.Id, t.ProductId,
                products.GetValueOrDefault(t.ProductId),
                t.ProductVariantId, t.RfidTagId, t.TagType,
                t.WarehouseId,
                t.WarehouseId.HasValue ? warehouses.GetValueOrDefault(t.WarehouseId.Value) : null,
                t.ShelfLocation, t.IsActive, t.TaggedAt, t.LastScannedAt
            )).ToList();

            return Result<List<ProductRfidTagDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            return Result<List<ProductRfidTagDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<ProductRfidTagDto>> CreateTagAsync(CreateRfidTagRequest request)
    {
        try
        {
            var exists = await _uow.Repository<ProductRfidTag>().AnyAsync(
                t => t.TenantId == _tenant.TenantId && t.RfidTagId == request.RfidTagId && t.IsActive);
            if (exists)
                return Result<ProductRfidTagDto>.Failure("رقم RFID موجود مسبقاً");

            var product = await _uow.Repository<Product>().Query()
                .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.TenantId == _tenant.TenantId && !p.IsDeleted);
            if (product is null)
                return Result<ProductRfidTagDto>.Failure("المنتج غير موجود");

            var tag = new ProductRfidTag
            {
                TenantId = _tenant.TenantId,
                ProductId = request.ProductId,
                ProductVariantId = request.ProductVariantId,
                RfidTagId = request.RfidTagId,
                TagType = request.TagType ?? "UHF",
                WarehouseId = request.WarehouseId,
                ShelfLocation = request.ShelfLocation,
                IsActive = true,
                TaggedAt = DateTime.UtcNow
            };

            await _uow.Repository<ProductRfidTag>().AddAsync(tag);
            await _uow.SaveChangesAsync();

            string? warehouseName = null;
            if (tag.WarehouseId.HasValue)
            {
                var wh = await _uow.Repository<Warehouse>().GetByIdAsync(tag.WarehouseId.Value);
                warehouseName = (wh as Warehouse)?.Name;
            }

            var dto = new ProductRfidTagDto(
                tag.Id, tag.ProductId, product.Name, tag.ProductVariantId,
                tag.RfidTagId, tag.TagType, tag.WarehouseId, warehouseName,
                tag.ShelfLocation, tag.IsActive, tag.TaggedAt, tag.LastScannedAt);

            return Result<ProductRfidTagDto>.Success(dto, "تم إضافة تاج RFID بنجاح");
        }
        catch (Exception ex)
        {
            return Result<ProductRfidTagDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteTagAsync(long id)
    {
        try
        {
            var tag = await _uow.Repository<ProductRfidTag>().Query()
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == _tenant.TenantId);
            if (tag is null)
                return Result<bool>.Failure("التاج غير موجود");

            tag.IsActive = false;
            tag.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<ProductRfidTag>().Update(tag);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم حذف التاج بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<ProductRfidTagDto>> GetTagByRfidAsync(string rfidTagId)
    {
        try
        {
            var tag = await _uow.Repository<ProductRfidTag>().Query()
                .FirstOrDefaultAsync(t => t.TenantId == _tenant.TenantId && t.RfidTagId == rfidTagId && t.IsActive);
            if (tag is null)
                return Result<ProductRfidTagDto>.Failure("التاج غير موجود");

            var product = await _uow.Repository<Product>().GetByIdAsync(tag.ProductId);
            string? warehouseName = null;
            if (tag.WarehouseId.HasValue)
            {
                var wh = await _uow.Repository<Warehouse>().GetByIdAsync(tag.WarehouseId.Value);
                warehouseName = (wh as Warehouse)?.Name;
            }

            var dto = new ProductRfidTagDto(
                tag.Id, tag.ProductId, (product as Product)?.Name, tag.ProductVariantId,
                tag.RfidTagId, tag.TagType, tag.WarehouseId, warehouseName,
                tag.ShelfLocation, tag.IsActive, tag.TaggedAt, tag.LastScannedAt);

            return Result<ProductRfidTagDto>.Success(dto);
        }
        catch (Exception ex)
        {
            return Result<ProductRfidTagDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    // ── QR Codes ───────────────────────────────────────────────

    public async Task<Result<List<WarehouseQrCodeDto>>> GetQrCodesAsync(int? warehouseId)
    {
        try
        {
            var query = _uow.Repository<WarehouseQrCode>().Query()
                .Where(q => q.TenantId == _tenant.TenantId);

            if (warehouseId.HasValue)
                query = query.Where(q => q.WarehouseId == warehouseId.Value);

            var codes = await query.OrderBy(q => q.LocationCode).ToListAsync();

            var whIds = codes.Select(c => c.WarehouseId).Distinct().ToList();
            var warehouses = await _uow.Repository<Warehouse>().Query()
                .Where(w => whIds.Contains(w.Id) && !w.IsDeleted)
                .ToDictionaryAsync(w => w.Id, w => w.Name);

            var dtos = codes.Select(c => new WarehouseQrCodeDto(
                c.Id, c.WarehouseId,
                warehouses.GetValueOrDefault(c.WarehouseId),
                c.QrCodeData, c.QrType, c.LocationCode, c.Description
            )).ToList();

            return Result<List<WarehouseQrCodeDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            return Result<List<WarehouseQrCodeDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<WarehouseQrCodeDto>> CreateQrCodeAsync(CreateQrCodeRequest request)
    {
        try
        {
            var warehouse = await _uow.Repository<Warehouse>().Query()
                .FirstOrDefaultAsync(w => w.Id == request.WarehouseId && w.TenantId == _tenant.TenantId && !w.IsDeleted);
            if (warehouse is null)
                return Result<WarehouseQrCodeDto>.Failure("المخزن غير موجود");

            var qrData = JsonSerializer.Serialize(new
            {
                warehouseId = request.WarehouseId,
                type = request.QrType,
                locationCode = request.LocationCode,
                tenantId = _tenant.TenantId
            });

            var code = new WarehouseQrCode
            {
                TenantId = _tenant.TenantId,
                WarehouseId = request.WarehouseId,
                QrCodeData = qrData,
                QrType = request.QrType,
                LocationCode = request.LocationCode,
                Description = request.Description
            };

            await _uow.Repository<WarehouseQrCode>().AddAsync(code);
            await _uow.SaveChangesAsync();

            var dto = new WarehouseQrCodeDto(
                code.Id, code.WarehouseId, warehouse.Name,
                code.QrCodeData, code.QrType, code.LocationCode, code.Description);

            return Result<WarehouseQrCodeDto>.Success(dto, "تم إنشاء رمز QR بنجاح");
        }
        catch (Exception ex)
        {
            return Result<WarehouseQrCodeDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteQrCodeAsync(int id)
    {
        try
        {
            var code = await _uow.Repository<WarehouseQrCode>().Query()
                .FirstOrDefaultAsync(q => q.Id == id && q.TenantId == _tenant.TenantId);
            if (code is null)
                return Result<bool>.Failure("رمز QR غير موجود");

            _uow.Repository<WarehouseQrCode>().Remove(code);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم حذف رمز QR بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<string>> GenerateQrDataAsync(int warehouseId, string type, string locationCode)
    {
        try
        {
            var warehouse = await _uow.Repository<Warehouse>().Query()
                .FirstOrDefaultAsync(w => w.Id == warehouseId && w.TenantId == _tenant.TenantId && !w.IsDeleted);
            if (warehouse is null)
                return Result<string>.Failure("المخزن غير موجود");

            var qrData = JsonSerializer.Serialize(new
            {
                warehouseId,
                type,
                locationCode,
                tenantId = _tenant.TenantId
            });

            return Result<string>.Success(qrData);
        }
        catch (Exception ex)
        {
            return Result<string>.Failure($"خطأ: {ex.Message}");
        }
    }

    // ── Scan Sessions ──────────────────────────────────────────

    public async Task<Result<RfidScanSessionDto>> StartScanSessionAsync(StartScanRequest request)
    {
        try
        {
            var warehouse = await _uow.Repository<Warehouse>().Query()
                .FirstOrDefaultAsync(w => w.Id == request.WarehouseId && w.TenantId == _tenant.TenantId && !w.IsDeleted);
            if (warehouse is null)
                return Result<RfidScanSessionDto>.Failure("المخزن غير موجود");

            var session = new RfidScanSession
            {
                TenantId = _tenant.TenantId,
                WarehouseId = request.WarehouseId,
                UserId = _tenant.UserId,
                SessionType = request.SessionType ?? "full_count",
                Status = RfidScanStatus.InProgress,
                StartedAt = DateTime.UtcNow
            };

            await _uow.Repository<RfidScanSession>().AddAsync(session);
            await _uow.SaveChangesAsync();

            var dto = new RfidScanSessionDto(
                session.Id, session.WarehouseId, warehouse.Name, session.UserId,
                session.SessionType, session.Status.ToString(),
                0, 0, 0, 0, session.StartedAt, null);

            return Result<RfidScanSessionDto>.Success(dto, "تم بدء جلسة الجرد");
        }
        catch (Exception ex)
        {
            return Result<RfidScanSessionDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<RfidScanResultDto>> RecordScanAsync(long sessionId, string rfidTagId, string? scannedLocation)
    {
        try
        {
            var session = await _uow.Repository<RfidScanSession>().Query()
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.TenantId == _tenant.TenantId);
            if (session is null)
                return Result<RfidScanResultDto>.Failure("جلسة الجرد غير موجودة");
            if (session.Status != RfidScanStatus.InProgress)
                return Result<RfidScanResultDto>.Failure("جلسة الجرد مكتملة أو ملغاة");

            var tag = await _uow.Repository<ProductRfidTag>().Query()
                .FirstOrDefaultAsync(t => t.TenantId == _tenant.TenantId && t.RfidTagId == rfidTagId && t.IsActive);

            RfidScanResultType resultType;
            int? productId = null;
            string? expectedLocation = null;
            string? productName = null;

            if (tag is null)
            {
                resultType = RfidScanResultType.Unknown;
            }
            else
            {
                productId = tag.ProductId;
                expectedLocation = tag.ShelfLocation;

                var product = await _uow.Repository<Product>().GetByIdAsync(tag.ProductId);
                productName = (product as Product)?.Name;

                tag.LastScannedAt = DateTime.UtcNow;
                _uow.Repository<ProductRfidTag>().Update(tag);

                if (string.IsNullOrEmpty(scannedLocation) || string.IsNullOrEmpty(expectedLocation))
                    resultType = RfidScanResultType.Matched;
                else if (scannedLocation.Equals(expectedLocation, StringComparison.OrdinalIgnoreCase))
                    resultType = RfidScanResultType.Matched;
                else
                    resultType = RfidScanResultType.Misplaced;
            }

            var result = new RfidScanResult
            {
                TenantId = _tenant.TenantId,
                ScanSessionId = sessionId,
                RfidTagId = rfidTagId,
                ProductId = productId,
                ScannedLocation = scannedLocation,
                ExpectedLocation = expectedLocation,
                ResultType = resultType,
                ScannedAt = DateTime.UtcNow
            };

            await _uow.Repository<RfidScanResult>().AddAsync(result);

            session.TotalTagsScanned++;
            if (resultType == RfidScanResultType.Matched)
                session.MatchedItems++;
            else
                session.UnmatchedTags++;
            _uow.Repository<RfidScanSession>().Update(session);

            await _uow.SaveChangesAsync();

            var dto = new RfidScanResultDto(
                result.Id, result.ScanSessionId, result.RfidTagId,
                result.ProductId, productName,
                result.ScannedLocation, result.ExpectedLocation,
                result.ResultType.ToString(), result.ScannedAt);

            return Result<RfidScanResultDto>.Success(dto);
        }
        catch (Exception ex)
        {
            return Result<RfidScanResultDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<ScanSessionSummaryDto>> CompleteScanSessionAsync(long sessionId)
    {
        try
        {
            var session = await _uow.Repository<RfidScanSession>().Query()
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.TenantId == _tenant.TenantId);
            if (session is null)
                return Result<ScanSessionSummaryDto>.Failure("جلسة الجرد غير موجودة");
            if (session.Status != RfidScanStatus.InProgress)
                return Result<ScanSessionSummaryDto>.Failure("جلسة الجرد مكتملة أو ملغاة بالفعل");

            var results = await _uow.Repository<RfidScanResult>().Query()
                .Where(r => r.ScanSessionId == sessionId)
                .ToListAsync();

            var scannedRfidIds = results.Select(r => r.RfidTagId).ToHashSet();

            var allTags = await _uow.Repository<ProductRfidTag>().Query()
                .Where(t => t.TenantId == _tenant.TenantId
                    && t.WarehouseId == session.WarehouseId
                    && t.IsActive)
                .ToListAsync();

            var missingTags = allTags.Where(t => !scannedRfidIds.Contains(t.RfidTagId)).ToList();

            foreach (var missing in missingTags)
            {
                var product = await _uow.Repository<Product>().GetByIdAsync(missing.ProductId);
                var missingResult = new RfidScanResult
                {
                    TenantId = _tenant.TenantId,
                    ScanSessionId = sessionId,
                    RfidTagId = missing.RfidTagId,
                    ProductId = missing.ProductId,
                    ExpectedLocation = missing.ShelfLocation,
                    ResultType = RfidScanResultType.Missing,
                    ScannedAt = DateTime.UtcNow
                };
                await _uow.Repository<RfidScanResult>().AddAsync(missingResult);
            }

            session.MissingItems = missingTags.Count;
            session.Status = RfidScanStatus.Completed;
            session.CompletedAt = DateTime.UtcNow;
            _uow.Repository<RfidScanSession>().Update(session);

            await _uow.SaveChangesAsync();

            return await GetSessionResultsAsync(sessionId);
        }
        catch (Exception ex)
        {
            return Result<ScanSessionSummaryDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<ScanSessionSummaryDto>> GetSessionResultsAsync(long sessionId)
    {
        try
        {
            var session = await _uow.Repository<RfidScanSession>().Query()
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.TenantId == _tenant.TenantId);
            if (session is null)
                return Result<ScanSessionSummaryDto>.Failure("جلسة الجرد غير موجودة");

            var results = await _uow.Repository<RfidScanResult>().Query()
                .Where(r => r.ScanSessionId == sessionId)
                .OrderByDescending(r => r.ScannedAt)
                .ToListAsync();

            var productIds = results.Where(r => r.ProductId.HasValue).Select(r => r.ProductId!.Value).Distinct().ToList();
            var products = productIds.Count > 0
                ? await _uow.Repository<Product>().Query()
                    .Where(p => productIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id, p => p.Name)
                : new Dictionary<int, string>();

            var dtos = results.Select(r => new RfidScanResultDto(
                r.Id, r.ScanSessionId, r.RfidTagId, r.ProductId,
                r.ProductId.HasValue ? products.GetValueOrDefault(r.ProductId.Value) : null,
                r.ScannedLocation, r.ExpectedLocation,
                r.ResultType.ToString(), r.ScannedAt
            )).ToList();

            var summary = new ScanSessionSummaryDto(
                sessionId,
                dtos.Count(r => r.ResultType != "Missing"),
                dtos.Count(r => r.ResultType == "Matched"),
                dtos.Count(r => r.ResultType == "Misplaced"),
                dtos.Count(r => r.ResultType == "Unknown"),
                dtos.Count(r => r.ResultType == "Missing"),
                dtos);

            return Result<ScanSessionSummaryDto>.Success(summary);
        }
        catch (Exception ex)
        {
            return Result<ScanSessionSummaryDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<PagedResult<RfidScanSessionDto>>> GetSessionsAsync(int? warehouseId, int page, int pageSize)
    {
        try
        {
            var query = _uow.Repository<RfidScanSession>().Query()
                .Where(s => s.TenantId == _tenant.TenantId);

            if (warehouseId.HasValue)
                query = query.Where(s => s.WarehouseId == warehouseId.Value);

            var totalCount = await query.CountAsync();

            var sessions = await query
                .OrderByDescending(s => s.StartedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var whIds = sessions.Select(s => s.WarehouseId).Distinct().ToList();
            var warehouses = await _uow.Repository<Warehouse>().Query()
                .Where(w => whIds.Contains(w.Id))
                .ToDictionaryAsync(w => w.Id, w => w.Name);

            var dtos = sessions.Select(s => new RfidScanSessionDto(
                s.Id, s.WarehouseId,
                warehouses.GetValueOrDefault(s.WarehouseId),
                s.UserId, s.SessionType, s.Status.ToString(),
                s.TotalTagsScanned, s.MatchedItems, s.UnmatchedTags, s.MissingItems,
                s.StartedAt, s.CompletedAt
            )).ToList();

            var result = new PagedResult<RfidScanSessionDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize
            };

            return Result<PagedResult<RfidScanSessionDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<PagedResult<RfidScanSessionDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    // ── QR Count ───────────────────────────────────────────────

    public async Task<Result<QrCountSessionDto>> StartQrCountAsync(int warehouseId)
    {
        try
        {
            var warehouse = await _uow.Repository<Warehouse>().Query()
                .FirstOrDefaultAsync(w => w.Id == warehouseId && w.TenantId == _tenant.TenantId && !w.IsDeleted);
            if (warehouse is null)
                return Result<QrCountSessionDto>.Failure("المخزن غير موجود");

            var session = new RfidScanSession
            {
                TenantId = _tenant.TenantId,
                WarehouseId = warehouseId,
                UserId = _tenant.UserId,
                SessionType = "qr_count",
                Status = RfidScanStatus.InProgress,
                StartedAt = DateTime.UtcNow
            };

            await _uow.Repository<RfidScanSession>().AddAsync(session);
            await _uow.SaveChangesAsync();

            return Result<QrCountSessionDto>.Success(new QrCountSessionDto(
                session.Id, session.WarehouseId, session.Status.ToString(),
                0, session.StartedAt, null), "تم بدء جلسة الجرد بالـ QR");
        }
        catch (Exception ex)
        {
            return Result<QrCountSessionDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> RecordQrScanAsync(long sessionId, int productId, decimal quantity)
    {
        try
        {
            var session = await _uow.Repository<RfidScanSession>().Query()
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.TenantId == _tenant.TenantId);
            if (session is null)
                return Result<bool>.Failure("الجلسة غير موجودة");
            if (session.Status != RfidScanStatus.InProgress)
                return Result<bool>.Failure("الجلسة مكتملة أو ملغاة");

            var product = await _uow.Repository<Product>().Query()
                .FirstOrDefaultAsync(p => p.Id == productId && p.TenantId == _tenant.TenantId && !p.IsDeleted);
            if (product is null)
                return Result<bool>.Failure("المنتج غير موجود");

            var result = new RfidScanResult
            {
                TenantId = _tenant.TenantId,
                ScanSessionId = sessionId,
                RfidTagId = $"QR-{productId}-{DateTime.UtcNow.Ticks}",
                ProductId = productId,
                ResultType = RfidScanResultType.Matched,
                ScannedAt = DateTime.UtcNow
            };

            await _uow.Repository<RfidScanResult>().AddAsync(result);

            session.TotalTagsScanned++;
            session.MatchedItems++;
            _uow.Repository<RfidScanSession>().Update(session);

            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<QrCountSessionDto>> CompleteQrCountAsync(long sessionId)
    {
        try
        {
            var session = await _uow.Repository<RfidScanSession>().Query()
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.TenantId == _tenant.TenantId);
            if (session is null)
                return Result<QrCountSessionDto>.Failure("الجلسة غير موجودة");

            session.Status = RfidScanStatus.Completed;
            session.CompletedAt = DateTime.UtcNow;
            _uow.Repository<RfidScanSession>().Update(session);
            await _uow.SaveChangesAsync();

            return Result<QrCountSessionDto>.Success(new QrCountSessionDto(
                session.Id, session.WarehouseId, session.Status.ToString(),
                session.TotalTagsScanned, session.StartedAt, session.CompletedAt),
                "تم إكمال جلسة الجرد");
        }
        catch (Exception ex)
        {
            return Result<QrCountSessionDto>.Failure($"خطأ: {ex.Message}");
        }
    }
}
