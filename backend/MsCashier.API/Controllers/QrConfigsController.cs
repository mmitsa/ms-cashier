using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/[controller]")]
public class QrConfigsController : BaseApiController
{
    private readonly IQrConfigService _service;
    public QrConfigsController(IQrConfigService service) => _service = service;

    private string BaseUrl => $"{Request.Scheme}://{Request.Host}";

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => HandleResult(await _service.GetAllAsync(BaseUrl));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveQrConfigRequest request)
        => HandleResult(await _service.SaveAsync(null, request, BaseUrl));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveQrConfigRequest request)
        => HandleResult(await _service.SaveAsync(id, request, BaseUrl));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _service.DeleteAsync(id));

    [HttpPost("{id:int}/regenerate")]
    public async Task<IActionResult> Regenerate(int id)
        => HandleResult(await _service.RegenerateCodeAsync(id));
}

// ============================================================
// Customer Public Controller (NO authentication — public API)
// ============================================================

