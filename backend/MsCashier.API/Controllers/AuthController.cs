using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>المصادقة وتسجيل الدخول</summary>
[Route("api/v1/auth")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    /// <summary>تسجيل الدخول والحصول على رمز JWT</summary>
    /// <param name="request">بيانات تسجيل الدخول</param>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return HandleResult(result);
    }

    /// <summary>تجديد رمز الوصول باستخدام رمز التحديث</summary>
    /// <param name="request">رمز التحديث</param>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var result = await _authService.RefreshTokenAsync(request);
        return HandleResult(result);
    }

    /// <summary>تغيير كلمة المرور للمستخدم الحالي</summary>
    /// <param name="request">كلمة المرور القديمة والجديدة</param>
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = Guid.Parse(User.FindFirst("sub")!.Value);
        var result = await _authService.ChangePasswordAsync(userId, request.OldPassword, request.NewPassword);
        return HandleResult(result);
    }
}

// ============================================================
// TenantsController
// ============================================================

