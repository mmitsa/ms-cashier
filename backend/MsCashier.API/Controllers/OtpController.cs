using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة رموز التحقق (OTP)</summary>
[Route("api/v1/otp")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class OtpController : BaseApiController
{
    private readonly IOtpService _service;
    public OtpController(IOtpService service) => _service = service;

    /// <summary>عرض إعدادات OTP</summary>
    [HttpGet("configs")]
    public async Task<IActionResult> GetConfigs() => HandleResult(await _service.GetConfigsAsync());

    /// <summary>إنشاء إعداد OTP</summary>
    /// <param name="request">بيانات الإعداد</param>
    [HttpPost("configs")]
    public async Task<IActionResult> SaveConfig([FromBody] SaveOtpConfigRequest request)
        => HandleResult(await _service.SaveConfigAsync(null, request));

    /// <summary>تحديث إعداد OTP</summary>
    /// <param name="id">معرف الإعداد</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("configs/{id:int}")]
    public async Task<IActionResult> UpdateConfig(int id, [FromBody] SaveOtpConfigRequest request)
        => HandleResult(await _service.SaveConfigAsync(id, request));

    /// <summary>حذف إعداد OTP</summary>
    /// <param name="id">معرف الإعداد</param>
    [HttpDelete("configs/{id:int}")]
    public async Task<IActionResult> DeleteConfig(int id) => HandleResult(await _service.DeleteConfigAsync(id));

    /// <summary>اختبار إرسال OTP</summary>
    /// <param name="id">معرف الإعداد</param>
    /// <param name="request">رقم الهاتف للاختبار</param>
    [HttpPost("configs/{id:int}/test")]
    public async Task<IActionResult> TestOtp(int id, [FromBody] TestOtpRequest request)
        => HandleResult(await _service.TestOtpAsync(id, request.TestPhone));

    /// <summary>إرسال رمز OTP</summary>
    /// <param name="request">بيانات الإرسال</param>
    [HttpPost("send")]
    [Authorize]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Send([FromBody] SendOtpRequest request)
        => HandleResult(await _service.SendOtpAsync(request));

    /// <summary>التحقق من رمز OTP</summary>
    /// <param name="request">بيانات التحقق</param>
    [HttpPost("verify")]
    [Authorize]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Verify([FromBody] VerifyOtpRequest request)
        => HandleResult(await _service.VerifyOtpAsync(request));
}

// ============================================================
// EmployeeDetailController
// ============================================================
