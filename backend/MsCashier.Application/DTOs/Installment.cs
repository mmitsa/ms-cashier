using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Installment
public record CreateInstallmentRequest(long InvoiceId, int ContactId, decimal DownPayment, int NumberOfPayments, DateTime StartDate);
public record InstallmentDto(int Id, long InvoiceId, string InvoiceNumber, int ContactId, string ContactName, decimal TotalAmount, decimal DownPayment, int NumberOfPayments, decimal PaymentAmount, decimal PaidTotal, decimal RemainingAmount, InstallmentStatus Status, List<InstallmentPaymentDto> Payments);
public record InstallmentPaymentDto(int Id, int PaymentNumber, DateTime DueDate, decimal Amount, decimal PaidAmount, DateTime? PaidDate, PaymentStatus Status);

