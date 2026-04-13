using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة إعدادات أكواد QR للطاولات</summary>
[Route("api/[controller]")]
public class QrConfigsController : BaseApiController
{
    private readonly IQrConfigService _service;
    public QrConfigsController(IQrConfigService service) => _service = service;

    private string BaseUrl => $"{Request.Scheme}://{Request.Host}";

    /// <summary>عرض جميع إعدادات QR</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => HandleResult(await _service.GetAllAsync(BaseUrl));

    /// <summary>إنشاء إعداد QR جديد</summary>
    /// <param name="request">بيانات الإعداد</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveQrConfigRequest request)
        => HandleResult(await _service.SaveAsync(null, request, BaseUrl));

    /// <summary>تحديث إعداد QR</summary>
    /// <param name="id">معرف الإعداد</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveQrConfigRequest request)
        => HandleResult(await _service.SaveAsync(id, request, BaseUrl));

    /// <summary>حذف إعداد QR</summary>
    /// <param name="id">معرف الإعداد</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _service.DeleteAsync(id));

    /// <summary>إعادة توليد كود QR</summary>
    /// <param name="id">معرف الإعداد</param>
    [HttpPost("{id:int}/regenerate")]
    public async Task<IActionResult> Regenerate(int id)
        => HandleResult(await _service.RegenerateCodeAsync(id));
}

// ============================================================
// Customer Public Controller (NO authentication — public API)
// ============================================================
