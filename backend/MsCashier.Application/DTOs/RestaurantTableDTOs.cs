using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Restaurant Table DTOs
// ============================================================

public record TableDto(
    int Id, string TableNumber, string? Section, int Capacity,
    string Status, bool IsActive, int? BranchId,
    int? GridRow, int? GridCol, string Shape,
    string? CurrentOrderNumber, int? CurrentGuestCount);

public record SaveTableRequest(
    string TableNumber, string? Section, int Capacity,
    bool IsActive, int? BranchId,
    int? GridRow, int? GridCol, string? Shape);

public record UpdateTableStatusRequest(string Status);

