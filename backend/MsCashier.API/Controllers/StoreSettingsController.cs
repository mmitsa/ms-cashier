using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>إعدادات المتجر (العلامة التجارية، العملات، الضرائب)</summary>
[Route("api/v1/store-settings")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class StoreSettingsController : BaseApiController
{
    private readonly IStoreSettingsService _service;
    public StoreSettingsController(IStoreSettingsService service) => _service = service;

    // ─── Branding & Invoice Design ──────────────────────

    /// <summary>عرض إعدادات المتجر</summary>
    [HttpGet]
    public async Task<IActionResult> GetSettings()
        => HandleResult(await _service.GetSettingsAsync());

    /// <summary>حفظ إعدادات المتجر</summary>
    /// <param name="settings">الإعدادات</param>
    [HttpPut]
    public async Task<IActionResult> SaveSettings([FromBody] StoreSettingsDto settings)
        => HandleResult(await _service.SaveSettingsAsync(settings));

    // ─── Multi-Currency ─────────────────────────────────

    /// <summary>عرض العملات المفعلة</summary>
    [HttpGet("currencies")]
    public async Task<IActionResult> GetCurrencies()
        => HandleResult(await _service.GetCurrenciesAsync());

    /// <summary>إضافة عملة جديدة</summary>
    /// <param name="request">بيانات العملة</param>
    [HttpPost("currencies")]
    public async Task<IActionResult> CreateCurrency([FromBody] SaveTenantCurrencyRequest request)
        => HandleResult(await _service.SaveCurrencyAsync(null, request));

    /// <summary>تحديث عملة</summary>
    /// <param name="id">معرف العملة</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("currencies/{id:int}")]
    public async Task<IActionResult> UpdateCurrency(int id, [FromBody] SaveTenantCurrencyRequest request)
        => HandleResult(await _service.SaveCurrencyAsync(id, request));

    /// <summary>حذف عملة</summary>
    /// <param name="id">معرف العملة</param>
    [HttpDelete("currencies/{id:int}")]
    public async Task<IActionResult> DeleteCurrency(int id)
        => HandleResult(await _service.DeleteCurrencyAsync(id));

    // ─── Tax Config ─────────────────────────────────────

    /// <summary>عرض إعدادات الضريبة</summary>
    [HttpGet("tax")]
    public async Task<IActionResult> GetTaxConfig()
        => HandleResult(await _service.GetTaxConfigAsync());

    /// <summary>حفظ إعدادات الضريبة</summary>
    /// <param name="request">إعدادات الضريبة</param>
    [HttpPut("tax")]
    public async Task<IActionResult> SaveTaxConfig([FromBody] SaveTaxConfigRequest request)
        => HandleResult(await _service.SaveTaxConfigAsync(request));
}
