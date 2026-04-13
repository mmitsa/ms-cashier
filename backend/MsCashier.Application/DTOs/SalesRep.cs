using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ─── SalesRep ────────────────────────────────────────────
public record SalesRepDto(
    int Id,
    Guid UserId,
    string UserName,
    string Name,
    string? Phone,
    int? AssignedWarehouseId,
    string? AssignedWarehouseName,
    decimal CommissionPercent,
    decimal FixedBonus,
    decimal OutstandingBalance,
    bool IsActive);

public record CreateSalesRepRequest(
    string Username,
    string Password,
    string FullName,
    string? Phone,
    int? AssignedWarehouseId,
    decimal CommissionPercent,
    decimal FixedBonus = 0);

public record UpdateSalesRepRequest(
    string Name,
    string? Phone,
    int? AssignedWarehouseId,
    decimal CommissionPercent,
    decimal FixedBonus,
    bool IsActive);

// ─── Transactions (Ledger) ───────────────────────────────
public record SalesRepTransactionDto(
    long Id,
    SalesRepTxnType TransactionType,
    string TransactionTypeLabel,
    decimal Amount,
    decimal BalanceAfter,
    long? InvoiceId,
    string? InvoiceNumber,
    PaymentMethod? PaymentMethod,
    DateTime TransactionDate,
    string? Notes);

// ─── Payment Collection ──────────────────────────────────
public record CollectPaymentRequest(
    long InvoiceId,
    decimal Amount,
    PaymentMethod PaymentMethod,
    string? Notes);

// ─── Commission ──────────────────────────────────────────
public record SalesRepCommissionDto(
    int Id,
    int SalesRepId,
    string SalesRepName,
    int Month,
    int Year,
    decimal TotalPaidSales,
    decimal CommissionPercent,
    decimal CommissionAmount,
    decimal FixedBonus,
    decimal TotalEarned,
    decimal PaidAmount,
    CommissionStatus Status);

public record PayCommissionRequest(
    decimal Amount,
    string? Notes);

// ─── Rep Summary ─────────────────────────────────────────
public record SalesRepSummaryDto(
    int TotalReps,
    int ActiveReps,
    decimal TotalOutstanding,
    decimal TotalCommissionUnpaid);

public record SalesRepPerformanceDto(
    int SalesRepId,
    string SalesRepName,
    int TotalInvoices,
    decimal TotalSales,
    decimal TotalCollected,
    decimal CollectionRate,
    decimal OutstandingBalance,
    int UniqueCustomers,
    decimal CommissionEarned);
