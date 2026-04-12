using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// Payment Gateway
public interface IPaymentGatewayService
{
    Task<Result<List<PaymentGatewayConfigDto>>> GetConfigsAsync();
    Task<Result<PaymentGatewayConfigDto>> SaveConfigAsync(int? id, SavePaymentGatewayRequest request);
    Task<Result<bool>> DeleteConfigAsync(int id);
    Task<Result<TestGatewayResult>> TestGatewayAsync(int configId);
    Task<Result<PaymentResultDto>> InitiatePaymentAsync(InitiatePaymentRequest request);
    Task<Result<PaymentResultDto>> CheckPaymentStatusAsync(long paymentId);
    Task<Result<PaymentResultDto>> HandleCallbackAsync(string gatewayType, string transactionId, string status, string? rawBody);
}

