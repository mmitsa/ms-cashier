using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface IRfidInventoryService
{
    // ── RFID Tags ──────────────────────────────────────
    Task<Result<List<ProductRfidTagDto>>> GetTagsAsync(int? productId);
    Task<Result<ProductRfidTagDto>> CreateTagAsync(CreateRfidTagRequest request);
    Task<Result<bool>> DeleteTagAsync(long id);
    Task<Result<ProductRfidTagDto>> GetTagByRfidAsync(string rfidTagId);

    // ── QR Codes ───────────────────────────────────────
    Task<Result<List<WarehouseQrCodeDto>>> GetQrCodesAsync(int? warehouseId);
    Task<Result<WarehouseQrCodeDto>> CreateQrCodeAsync(CreateQrCodeRequest request);
    Task<Result<bool>> DeleteQrCodeAsync(int id);
    Task<Result<string>> GenerateQrDataAsync(int warehouseId, string type, string locationCode);

    // ── Scan Sessions ──────────────────────────────────
    Task<Result<RfidScanSessionDto>> StartScanSessionAsync(StartScanRequest request);
    Task<Result<RfidScanResultDto>> RecordScanAsync(long sessionId, string rfidTagId, string? scannedLocation);
    Task<Result<ScanSessionSummaryDto>> CompleteScanSessionAsync(long sessionId);
    Task<Result<ScanSessionSummaryDto>> GetSessionResultsAsync(long sessionId);
    Task<Result<PagedResult<RfidScanSessionDto>>> GetSessionsAsync(int? warehouseId, int page, int pageSize);

    // ── QR Count ───────────────────────────────────────
    Task<Result<QrCountSessionDto>> StartQrCountAsync(int warehouseId);
    Task<Result<bool>> RecordQrScanAsync(long sessionId, int productId, decimal quantity);
    Task<Result<QrCountSessionDto>> CompleteQrCountAsync(long sessionId);
}
