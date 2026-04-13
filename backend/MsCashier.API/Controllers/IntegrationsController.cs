using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

[Route("api/v1/integrations")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class IntegrationsController : BaseApiController
{
    private readonly IIntegrationService _service;
    public IntegrationsController(IIntegrationService service) => _service = service;

    /// <summary>List of available providers (catalog)</summary>
    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog()
        => HandleResult(await _service.GetCatalogAsync());

    /// <summary>All configured integrations for this tenant</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => HandleResult(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _service.GetByIdAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveIntegrationRequest request)
        => HandleResult(await _service.SaveAsync(null, request));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveIntegrationRequest request)
        => HandleResult(await _service.SaveAsync(id, request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _service.DeleteAsync(id));

    [HttpPost("{id:int}/toggle")]
    public async Task<IActionResult> Toggle(int id)
        => HandleResult(await _service.ToggleAsync(id));

    [HttpPost("{id:int}/test")]
    public async Task<IActionResult> TestConnection(int id)
        => HandleResult(await _service.TestConnectionAsync(id));
}
