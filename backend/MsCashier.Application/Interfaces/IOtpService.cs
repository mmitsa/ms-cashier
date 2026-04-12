using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// OTP
public interface IOtpService
{
    Task<Result<List<OtpConfigDto>>> GetConfigsAsync();
    Task<Result<OtpConfigDto>> SaveConfigAsync(int? id, SaveOtpConfigRequest request);
    Task<Result<bool>> DeleteConfigAsync(int id);
    Task<Result<TestOtpResult>> TestOtpAsync(int configId, string testPhone);
    Task<Result<OtpResultDto>> SendOtpAsync(SendOtpRequest request);
    Task<Result<bool>> VerifyOtpAsync(VerifyOtpRequest request);
}

