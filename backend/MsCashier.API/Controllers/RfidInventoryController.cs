using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

[Route("api/v1/rfid-inventory")]
public class RfidInventoryController : BaseApiController
{
    private readonly IRfidInventoryService _service;

    public RfidInventoryController(IRfidInventoryService service) => _service = service;

    // ── RFID Tags ──────────────────────────────────────────────

    [HttpGet("tags")]
    public async Task<IActionResult> GetTags([FromQuery] int? productId)
        => HandleResult(await _service.GetTagsAsync(productId));

    [HttpPost("tags")]
    public async Task<IActionResult> CreateTag([FromBody] CreateRfidTagRequest request)
        => HandleResult(await _service.CreateTagAsync(request));

    [HttpDelete("tags/{id:long}")]
    public async Task<IActionResult> DeleteTag(long id)
        => HandleResult(await _service.DeleteTagAsync(id));

    [HttpGet("tags/rfid/{rfidTagId}")]
    public async Task<IActionResult> GetTagByRfid(string rfidTagId)
        => HandleResult(await _service.GetTagByRfidAsync(rfidTagId));

    // ── QR Codes ───────────────────────────────────────────────

    [HttpGet("qr-codes")]
    public async Task<IActionResult> GetQrCodes([FromQuery] int? warehouseId)
        => HandleResult(await _service.GetQrCodesAsync(warehouseId));

    [HttpPost("qr-codes")]
    public async Task<IActionResult> CreateQrCode([FromBody] CreateQrCodeRequest request)
        => HandleResult(await _service.CreateQrCodeAsync(request));

    [HttpDelete("qr-codes/{id:int}")]
    public async Task<IActionResult> DeleteQrCode(int id)
        => HandleResult(await _service.DeleteQrCodeAsync(id));

    [HttpGet("qr-codes/generate")]
    public async Task<IActionResult> GenerateQrData(
        [FromQuery] int warehouseId, [FromQuery] string type, [FromQuery] string locationCode)
        => HandleResult(await _service.GenerateQrDataAsync(warehouseId, type, locationCode));

    // ── Scan Sessions ──────────────────────────────────────────

    [HttpPost("sessions/start")]
    public async Task<IActionResult> StartSession([FromBody] StartScanRequest request)
        => HandleResult(await _service.StartScanSessionAsync(request));

    [HttpPost("sessions/{sessionId:long}/scan")]
    public async Task<IActionResult> RecordScan(long sessionId, [FromBody] RecordScanRequest request)
        => HandleResult(await _service.RecordScanAsync(sessionId, request.RfidTagId, request.ScannedLocation));

    [HttpPost("sessions/{sessionId:long}/complete")]
    public async Task<IActionResult> CompleteSession(long sessionId)
        => HandleResult(await _service.CompleteScanSessionAsync(sessionId));

    [HttpGet("sessions/{sessionId:long}/results")]
    public async Task<IActionResult> GetSessionResults(long sessionId)
        => HandleResult(await _service.GetSessionResultsAsync(sessionId));

    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions(
        [FromQuery] int? warehouseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => HandleResult(await _service.GetSessionsAsync(warehouseId, page, pageSize));

    // ── QR Count ───────────────────────────────────────────────

    [HttpPost("qr-count/start")]
    public async Task<IActionResult> StartQrCount([FromBody] StartScanRequest request)
        => HandleResult(await _service.StartQrCountAsync(request.WarehouseId));

    [HttpPost("qr-count/{sessionId:long}/scan")]
    public async Task<IActionResult> RecordQrScan(long sessionId, [FromBody] RecordQrScanRequest request)
        => HandleResult(await _service.RecordQrScanAsync(sessionId, request.ProductId, request.Quantity));

    [HttpPost("qr-count/{sessionId:long}/complete")]
    public async Task<IActionResult> CompleteQrCount(long sessionId)
        => HandleResult(await _service.CompleteQrCountAsync(sessionId));
}
