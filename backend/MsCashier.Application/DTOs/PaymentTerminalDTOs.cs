using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// Payment Terminal DTOs
// ============================================================

public record PaymentTerminalDto(
    int Id, string Name, string Provider, string Status,
    string? TerminalId, string? MerchantId, string? SerialNumber,
    int? BranchId, string? BranchName, string? IpAddress, int? Port,
    bool IsDefault, bool SupportsRefund, bool SupportsPreAuth,
    bool SupportsContactless, string Currency,
    DateTime? LastPingAt, DateTime? LastReconciliationAt,
    int TodayTxnCount, decimal TodayTxnTotal);

public record SaveTerminalRequest(
    string Name, string Provider, string? TerminalId, string? MerchantId,
    string? SerialNumber, string? ApiKey, string? ApiSecret, string? ApiBaseUrl,
    int? BranchId, string? IpAddress, int? Port,
    bool IsDefault, bool SupportsRefund, bool SupportsPreAuth,
    bool SupportsContactless, string? Currency);

public record InitiateTerminalPaymentRequest(
    int TerminalId, decimal Amount, long? InvoiceId,
    decimal? TipAmount, string? ReferenceNote);

public record TerminalTxnDto(
    long Id, int TerminalId, string TerminalName, long? InvoiceId,
    string? InvoiceNumber, string ReferenceNumber,
    string TxnType, string Status,
    decimal Amount, decimal? TipAmount, string Currency,
    string? CardScheme, string? CardLast4,
    string? AuthCode, string? RRN, string? ProviderTxnId,
    string? ResponseCode, string? ResponseMessage,
    string? ReceiptData,
    DateTime InitiatedAt, DateTime? CompletedAt);

public record TerminalReconciliationDto(
    int TerminalId, string TerminalName, DateTime ReconciliationDate,
    int TotalTxnCount, decimal TotalAmount,
    int ApprovedCount, decimal ApprovedAmount,
    int DeclinedCount, int CancelledCount);

public record TerminalPaymentResultDto(
    long TransactionId, string ReferenceNumber, string Status,
    string? CardScheme, string? CardLast4, string? AuthCode,
    string? ResponseMessage, string? ReceiptData, bool IsApproved);

