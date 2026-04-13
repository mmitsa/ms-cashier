namespace MsCashier.Application.DTOs;

// ── RFID Tags ────────────────────────────────────────────

public record ProductRfidTagDto(
    long Id,
    int ProductId,
    string? ProductName,
    int? ProductVariantId,
    string RfidTagId,
    string TagType,
    int? WarehouseId,
    string? WarehouseName,
    string? ShelfLocation,
    bool IsActive,
    DateTime TaggedAt,
    DateTime? LastScannedAt);

public record CreateRfidTagRequest(
    int ProductId,
    int? ProductVariantId,
    string RfidTagId,
    string TagType,
    int? WarehouseId,
    string? ShelfLocation);

// ── QR Codes ─────────────────────────────────────────────

public record WarehouseQrCodeDto(
    int Id,
    int WarehouseId,
    string? WarehouseName,
    string QrCodeData,
    string QrType,
    string LocationCode,
    string? Description);

public record CreateQrCodeRequest(
    int WarehouseId,
    string QrType,
    string LocationCode,
    string? Description);

// ── Scan Sessions ────────────────────────────────────────

public record RfidScanSessionDto(
    long Id,
    int WarehouseId,
    string? WarehouseName,
    Guid UserId,
    string SessionType,
    string Status,
    int TotalTagsScanned,
    int MatchedItems,
    int UnmatchedTags,
    int MissingItems,
    DateTime StartedAt,
    DateTime? CompletedAt);

public record RfidScanResultDto(
    long Id,
    long ScanSessionId,
    string RfidTagId,
    int? ProductId,
    string? ProductName,
    string? ScannedLocation,
    string? ExpectedLocation,
    string ResultType,
    DateTime ScannedAt);

public record StartScanRequest(
    int WarehouseId,
    string SessionType);

public record RecordScanRequest(
    string RfidTagId,
    string? ScannedLocation);

public record ScanSessionSummaryDto(
    long SessionId,
    int TotalTagsScanned,
    int MatchedItems,
    int MisplacedItems,
    int UnknownTags,
    int MissingItems,
    List<RfidScanResultDto> Results);

// ── QR Count Sessions ────────────────────────────────────

public record QrCountSessionDto(
    long SessionId,
    int WarehouseId,
    string Status,
    int TotalScanned,
    DateTime StartedAt,
    DateTime? CompletedAt);

public record RecordQrScanRequest(
    int ProductId,
    decimal Quantity);
