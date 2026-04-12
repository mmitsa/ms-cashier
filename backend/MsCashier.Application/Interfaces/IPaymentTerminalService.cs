using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// Payment Terminal Service
// ============================================================

public interface IPaymentTerminalService
{
    // Terminal CRUD
    Task<Result<List<PaymentTerminalDto>>> GetAllAsync();
    Task<Result<PaymentTerminalDto>> GetByIdAsync(int id);
    Task<Result<PaymentTerminalDto>> SaveAsync(int? id, SaveTerminalRequest request);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<bool>> SetDefaultAsync(int id);
    Task<Result<bool>> PingTerminalAsync(int id);

    // Payment Operations
    Task<Result<TerminalPaymentResultDto>> InitiatePaymentAsync(InitiateTerminalPaymentRequest request);
    Task<Result<TerminalTxnDto>> CheckTransactionStatusAsync(long txnId);
    Task<Result<TerminalPaymentResultDto>> CancelPaymentAsync(long txnId);
    Task<Result<TerminalPaymentResultDto>> RefundPaymentAsync(long txnId, decimal? amount);

    // Transaction History
    Task<Result<List<TerminalTxnDto>>> GetTransactionsAsync(int? terminalId, DateTime? from, DateTime? to, int limit = 50);
    Task<Result<TerminalReconciliationDto>> ReconcileAsync(int terminalId);
}

// ============================================================
// Recipe Management
// ============================================================

