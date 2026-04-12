using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// OTP
public record OtpConfigDto(int Id, OtpProvider Provider, string DisplayName, string? ApiKey, string? ApiSecret, string? AccountSid, string? SenderId, string? ServiceSid, bool IsActive, bool IsDefault, int OtpLength, int ExpiryMinutes, int MaxRetries, int CooldownSeconds, string? MessageTemplate, DateTime? LastTestedAt, bool? LastTestResult, string? AdditionalConfig);
public record SaveOtpConfigRequest(OtpProvider Provider, string DisplayName, string? ApiKey, string? ApiSecret, string? AccountSid, string? SenderId, string? ServiceSid, bool IsActive, bool IsDefault, int OtpLength, int ExpiryMinutes, int MaxRetries, int CooldownSeconds, string? MessageTemplate, string? AdditionalConfig);
public record SendOtpRequest(string Phone, OtpPurpose Purpose);
public record VerifyOtpRequest(string Phone, string Code, OtpPurpose Purpose);
public record OtpResultDto(bool Sent, string Message, int? ExpirySeconds);
public record TestOtpRequest(int OtpConfigId, string TestPhone);
public record TestOtpResult(bool Success, string Message, int? ResponseTimeMs);

