using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Payment Gateway
public record PaymentGatewayConfigDto(int Id, PaymentGatewayType GatewayType, string DisplayName, string? ApiKey, string? SecretKey, string? MerchantId, string? PublishableKey, string? WebhookSecret, string? CallbackUrl, bool IsLiveMode, bool IsActive, bool IsDefault, string CurrencyCode, decimal? MinAmount, decimal? MaxAmount, string? AdditionalConfig, DateTime? LastTestedAt, bool? LastTestResult);
public record SavePaymentGatewayRequest(PaymentGatewayType GatewayType, string DisplayName, string? ApiKey, string? SecretKey, string? MerchantId, string? PublishableKey, string? WebhookSecret, string? CallbackUrl, bool IsLiveMode, bool IsActive, bool IsDefault, string CurrencyCode, decimal? MinAmount, decimal? MaxAmount, string? AdditionalConfig);
public record InitiatePaymentRequest(decimal Amount, string? CustomerName, string? CustomerEmail, string? CustomerPhone, string? Description, long? InvoiceId, string? CallbackUrl);
public record PaymentResultDto(long PaymentId, string? PaymentUrl, OnlinePaymentStatus Status, string? GatewayTransactionId, decimal Amount, string? FailureReason);
public record TestGatewayRequest(int GatewayConfigId);
public record TestGatewayResult(bool Success, string Message, int? ResponseTimeMs);

