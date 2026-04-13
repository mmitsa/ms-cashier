using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>إدارة جرد المخزون بتقنية RFID و QR</summary>
[Route("api/v1/rfid-inventory")]
public class RfidInventoryController : BaseApiController
{
    private readonly IRfidInventoryService _service;

    public RfidInventoryController(IRfidInventoryService service) => _service = service;

    // ── RFID Tags ──────────────────────────────────────────────

    /// <summary>عرض علامات RFID</summary>
    /// <param name="productId">معرف المنتج (اختياري)</param>
    [HttpGet("tags")]
    public async Task<IActionResult> GetTags([FromQuery] int? productId)
        => HandleResult(await _service.GetTagsAsync(productId));

    /// <summary>إنشاء علامة RFID جديدة</summary>
    /// <param name="request">بيانات العلامة</param>
    [HttpPost("tags")]
    public async Task<IActionResult> CreateTag([FromBody] CreateRfidTagRequest request)
        => HandleResult(await _service.CreateTagAsync(request));

    /// <summary>حذف علامة RFID</summary>
    /// <param name="id">معرف العلامة</param>
    [HttpDelete("tags/{id:long}")]
    public async Task<IActionResult> DeleteTag(long id)
        => HandleResult(await _service.DeleteTagAsync(id));

    /// <summary>البحث عن علامة RFID برقم التعريف</summary>
    /// <param name="rfidTagId">رقم تعريف RFID</param>
    [HttpGet("tags/rfid/{rfidTagId}")]
    public async Task<IActionResult> GetTagByRfid(string rfidTagId)
        => HandleResult(await _service.GetTagByRfidAsync(rfidTagId));

    // ── QR Codes ───────────────────────────────────────────────

    /// <summary>عرض أكواد QR</summary>
    /// <param name="warehouseId">معرف المستودع (اختياري)</param>
    [HttpGet("qr-codes")]
    public async Task<IActionResult> GetQrCodes([FromQuery] int? warehouseId)
        => HandleResult(await _service.GetQrCodesAsync(warehouseId));

    /// <summary>إنشاء كود QR جديد</summary>
    /// <param name="request">بيانات الكود</param>
    [HttpPost("qr-codes")]
    public async Task<IActionResult> CreateQrCode([FromBody] CreateQrCodeRequest request)
        => HandleResult(await _service.CreateQrCodeAsync(request));

    /// <summary>حذف كود QR</summary>
    /// <param name="id">معرف الكود</param>
    [HttpDelete("qr-codes/{id:int}")]
    public async Task<IActionResult> DeleteQrCode(int id)
        => HandleResult(await _service.DeleteQrCodeAsync(id));

    /// <summary>توليد بيانات كود QR</summary>
    /// <param name="warehouseId">معرف المستودع</param>
    /// <param name="type">نوع الكود</param>
    /// <param name="locationCode">رمز الموقع</param>
    [HttpGet("qr-codes/generate")]
    public async Task<IActionResult> GenerateQrData(
        [FromQuery] int warehouseId, [FromQuery] string type, [FromQuery] string locationCode)
        => HandleResult(await _service.GenerateQrDataAsync(warehouseId, type, locationCode));

    // ── Scan Sessions ──────────────────────────────────────────

    /// <summary>بدء جلسة مسح جديدة</summary>
    /// <param name="request">بيانات الجلسة</param>
    [HttpPost("sessions/start")]
    public async Task<IActionResult> StartSession([FromBody] StartScanRequest request)
        => HandleResult(await _service.StartScanSessionAsync(request));

    /// <summary>تسجيل عملية مسح في جلسة</summary>
    /// <param name="sessionId">معرف الجلسة</param>
    /// <param name="request">بيانات المسح</param>
    [HttpPost("sessions/{sessionId:long}/scan")]
    public async Task<IActionResult> RecordScan(long sessionId, [FromBody] RecordScanRequest request)
        => HandleResult(await _service.RecordScanAsync(sessionId, request.RfidTagId, request.ScannedLocation));

    /// <summary>إنهاء جلسة المسح</summary>
    /// <param name="sessionId">معرف الجلسة</param>
    [HttpPost("sessions/{sessionId:long}/complete")]
    public async Task<IActionResult> CompleteSession(long sessionId)
        => HandleResult(await _service.CompleteScanSessionAsync(sessionId));

    /// <summary>عرض نتائج جلسة المسح</summary>
    /// <param name="sessionId">معرف الجلسة</param>
    [HttpGet("sessions/{sessionId:long}/results")]
    public async Task<IActionResult> GetSessionResults(long sessionId)
        => HandleResult(await _service.GetSessionResultsAsync(sessionId));

    /// <summary>عرض جلسات المسح مع التصفح</summary>
    /// <param name="warehouseId">معرف المستودع (اختياري)</param>
    /// <param name="page">رقم الصفحة</param>
    /// <param name="pageSize">حجم الصفحة</param>
    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions(
        [FromQuery] int? warehouseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => HandleResult(await _service.GetSessionsAsync(warehouseId, page, pageSize));

    // ── QR Count ───────────────────────────────────────────────

    /// <summary>بدء عملية جرد بكود QR</summary>
    /// <param name="request">بيانات بدء الجرد</param>
    [HttpPost("qr-count/start")]
    public async Task<IActionResult> StartQrCount([FromBody] StartScanRequest request)
        => HandleResult(await _service.StartQrCountAsync(request.WarehouseId));

    /// <summary>تسجيل مسح QR في جلسة الجرد</summary>
    /// <param name="sessionId">معرف الجلسة</param>
    /// <param name="request">بيانات المسح</param>
    [HttpPost("qr-count/{sessionId:long}/scan")]
    public async Task<IActionResult> RecordQrScan(long sessionId, [FromBody] RecordQrScanRequest request)
        => HandleResult(await _service.RecordQrScanAsync(sessionId, request.ProductId, request.Quantity));

    /// <summary>إنهاء جلسة جرد QR</summary>
    /// <param name="sessionId">معرف الجلسة</param>
    [HttpPost("qr-count/{sessionId:long}/complete")]
    public async Task<IActionResult> CompleteQrCount(long sessionId)
        => HandleResult(await _service.CompleteQrCountAsync(sessionId));
}
