using MsCashier.Domain.Entities;

namespace MsCashier.Application.DTOs;

// ─── برنامج الولاء ─────────────────────────────────

public record LoyaltyProgramDto(
    int Id,
    string Name,
    decimal PointsPerCurrency,
    decimal RedemptionValue,
    int MinRedemptionPoints,
    int PointsExpireDays,
    bool IsActive);

public record CreateLoyaltyProgramRequest(
    string Name,
    decimal PointsPerCurrency,
    decimal RedemptionValue,
    int MinRedemptionPoints,
    int PointsExpireDays,
    bool IsActive);

// ─── عضوية العميل ──────────────────────────────────

public record CustomerLoyaltyDto(
    int Id,
    int ContactId,
    string? ContactName,
    int LoyaltyProgramId,
    string? ProgramName,
    int CurrentPoints,
    int TotalEarnedPoints,
    int TotalRedeemedPoints,
    string? LoyaltyCardBarcode,
    DateTime EnrolledAt);

// ─── حركات النقاط ──────────────────────────────────

public record LoyaltyTransactionDto(
    long Id,
    int CustomerLoyaltyId,
    long? InvoiceId,
    LoyaltyTransactionType Type,
    int Points,
    string? Description,
    DateTime? ExpiresAt,
    DateTime CreatedAt);

// ─── استبدال النقاط ─────────────────────────────────

public record RedeemPointsRequest(int Points);

// ─── لوحة بيانات الولاء ─────────────────────────────

public record LoyaltyDashboardDto(
    int TotalMembers,
    int ActiveMembers,
    long TotalPointsIssued,
    long TotalPointsRedeemed,
    long TotalPointsActive,
    decimal TotalRedemptionValue,
    List<LoyaltyTopCustomerDto> TopCustomers);

public record LoyaltyTopCustomerDto(
    int ContactId,
    string? ContactName,
    int CurrentPoints,
    int TotalEarnedPoints);
