using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/units")]
[Authorize]
public class UnitsController : BaseApiController
{
    private readonly IUnitService _service;

    public UnitsController(IUnitService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => HandleResult(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _service.GetByIdAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUnitRequest request)
        => HandleResult(await _service.CreateAsync(request));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUnitRequest request)
        => HandleResult(await _service.UpdateAsync(id, request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _service.DeleteAsync(id));

    [HttpGet("convert")]
    public async Task<IActionResult> Convert(
        [FromQuery] int fromUnitId,
        [FromQuery] int toUnitId,
        [FromQuery] decimal quantity)
        => HandleResult(await _service.ConvertAsync(fromUnitId, toUnitId, quantity));
}
