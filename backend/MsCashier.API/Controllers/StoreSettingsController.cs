using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

[Route("api/v1/store-settings")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class StoreSettingsController : BaseApiController
{
    private readonly IStoreSettingsService _service;
    public StoreSettingsController(IStoreSettingsService service) => _service = service;

    // ─── Branding & Invoice Design ──────────────────────
    [HttpGet]
    public async Task<IActionResult> GetSettings()
        => HandleResult(await _service.GetSettingsAsync());

    [HttpPut]
    public async Task<IActionResult> SaveSettings([FromBody] StoreSettingsDto settings)
        => HandleResult(await _service.SaveSettingsAsync(settings));

    // ─── Multi-Currency ─────────────────────────────────
    [HttpGet("currencies")]
    public async Task<IActionResult> GetCurrencies()
        => HandleResult(await _service.GetCurrenciesAsync());

    [HttpPost("currencies")]
    public async Task<IActionResult> CreateCurrency([FromBody] SaveTenantCurrencyRequest request)
        => HandleResult(await _service.SaveCurrencyAsync(null, request));

    [HttpPut("currencies/{id:int}")]
    public async Task<IActionResult> UpdateCurrency(int id, [FromBody] SaveTenantCurrencyRequest request)
        => HandleResult(await _service.SaveCurrencyAsync(id, request));

    [HttpDelete("currencies/{id:int}")]
    public async Task<IActionResult> DeleteCurrency(int id)
        => HandleResult(await _service.DeleteCurrencyAsync(id));

    // ─── Tax Config ─────────────────────────────────────
    [HttpGet("tax")]
    public async Task<IActionResult> GetTaxConfig()
        => HandleResult(await _service.GetTaxConfigAsync());

    [HttpPut("tax")]
    public async Task<IActionResult> SaveTaxConfig([FromBody] SaveTaxConfigRequest request)
        => HandleResult(await _service.SaveTaxConfigAsync(request));
}
