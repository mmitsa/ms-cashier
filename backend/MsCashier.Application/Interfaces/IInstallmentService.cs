using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

public interface IInstallmentService
{
    Task<Result<InstallmentDto>> CreateAsync(CreateInstallmentRequest request);
    Task<Result<List<InstallmentDto>>> GetActiveAsync();
    Task<Result<bool>> RecordPaymentAsync(int installmentId, int paymentNumber, decimal amount);
    Task<Result<List<InstallmentDto>>> GetOverdueAsync();
}

