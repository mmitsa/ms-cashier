using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Branch DTOs
// ============================================================

public record BranchDto(
    int Id, string Name, string? Address, string? City, string? Phone, string? Email,
    string? ManagerName, string DataMode, string Status,
    DateTime ActivatedAt, DateTime? ExpiresAt, decimal MonthlyFee,
    bool IsMainBranch, string? Notes, int WarehouseCount);

public record BranchSummaryDto(
    int TotalBranches, int ActiveBranches, int MaxBranches,
    decimal TotalMonthlyFees, decimal BranchUnitPrice);

public record CreateBranchRequestDto(
    string BranchName, string? Address, string? City, string? Phone,
    string? ManagerName, string DataMode, string? Notes);

public record UpdateBranchDto(
    string Name, string? Address, string? City, string? Phone,
    string? Email, string? ManagerName, string? Notes);

public record BranchRequestDto(
    int Id, Guid TenantId, string? TenantName,
    string BranchName, string? Address, string? City, string? Phone,
    string? ManagerName, string DataMode, string Status,
    decimal RequestedFee, string? Notes, string? AdminNotes,
    int? ActivatedBranchId, string? PaymentReference,
    DateTime? PaidAt, DateTime? ReviewedAt,
    DateTime CreatedAt);

public record AdminReviewBranchRequestDto(bool Approve, string? AdminNotes);

public record BranchPaymentDto(string PaymentReference);

public record BranchPlanInfoDto(
    int PlanId, string PlanName, int MaxBranches, int CurrentBranches,
    decimal BranchMonthlyPrice, decimal? BranchYearlyPrice,
    bool CanAddMore);

public record AssignWarehouseToBranchDto(int WarehouseId, int BranchId);

