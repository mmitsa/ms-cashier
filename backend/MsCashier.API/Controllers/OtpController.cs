using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/otp")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class OtpController : BaseApiController
{
    private readonly IOtpService _service;
    public OtpController(IOtpService service) => _service = service;

    [HttpGet("configs")]
    public async Task<IActionResult> GetConfigs() => HandleResult(await _service.GetConfigsAsync());

    [HttpPost("configs")]
    public async Task<IActionResult> SaveConfig([FromBody] SaveOtpConfigRequest request)
        => HandleResult(await _service.SaveConfigAsync(null, request));

    [HttpPut("configs/{id:int}")]
    public async Task<IActionResult> UpdateConfig(int id, [FromBody] SaveOtpConfigRequest request)
        => HandleResult(await _service.SaveConfigAsync(id, request));

    [HttpDelete("configs/{id:int}")]
    public async Task<IActionResult> DeleteConfig(int id) => HandleResult(await _service.DeleteConfigAsync(id));

    [HttpPost("configs/{id:int}/test")]
    public async Task<IActionResult> TestOtp(int id, [FromBody] TestOtpRequest request)
        => HandleResult(await _service.TestOtpAsync(id, request.TestPhone));

    [HttpPost("send")]
    [Authorize]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Send([FromBody] SendOtpRequest request)
        => HandleResult(await _service.SendOtpAsync(request));

    [HttpPost("verify")]
    [Authorize]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Verify([FromBody] VerifyOtpRequest request)
        => HandleResult(await _service.VerifyOtpAsync(request));
}

// ============================================================
// EmployeeDetailController
// ============================================================

