using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Cashier Shift DTOs
// ============================================================

public record CashierShiftDto(
    int Id,
    Guid UserId,
    string? UserName,
    int? WarehouseId,
    string? WarehouseName,
    DateTime OpenedAt,
    DateTime? ClosedAt,
    decimal OpeningCash,
    decimal? ExpectedCash,
    decimal? ActualCash,
    decimal? CashDifference,
    decimal TotalSales,
    decimal TotalCashSales,
    decimal TotalCardSales,
    int InvoiceCount,
    string? OpeningNotes,
    string? ClosingNotes,
    CashierShiftStatus Status
);

public record OpenShiftRequest(decimal OpeningCash, int? WarehouseId, string? Notes);

public record CloseShiftRequest(decimal ActualCash, string? Notes);

public record ShiftSummaryDto(
    int ShiftId,
    Guid UserId,
    string? UserName,
    DateTime OpenedAt,
    decimal OpeningCash,
    decimal TotalSales,
    decimal TotalCashSales,
    decimal TotalCardSales,
    decimal ExpectedCash,
    decimal? ActualCash,
    decimal? CashDifference,
    int InvoiceCount
);

public record ShiftListFilter(int Page = 1, int PageSize = 20, Guid? UserId = null, CashierShiftStatus? Status = null, DateTime? DateFrom = null, DateTime? DateTo = null);
