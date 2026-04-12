using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/[controller]")]
public class FloorSectionsController : BaseApiController
{
    private readonly IFloorSectionService _service;
    public FloorSectionsController(IFloorSectionService service) => _service = service;

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview([FromQuery] int? branchId)
        => HandleResult(await _service.GetFloorOverviewAsync(branchId));

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId)
        => HandleResult(await _service.GetSectionsAsync(branchId));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _service.GetByIdAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveFloorSectionRequest request)
        => HandleResult(await _service.SaveAsync(null, request));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveFloorSectionRequest request)
        => HandleResult(await _service.SaveAsync(id, request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _service.DeleteAsync(id));

    [HttpPost("reorder")]
    public async Task<IActionResult> Reorder([FromBody] List<int> sectionIds)
        => HandleResult(await _service.ReorderAsync(sectionIds));

    [HttpPost("{sectionId:int}/tables/{tableId:int}")]
    public async Task<IActionResult> AssignTable(int sectionId, int tableId)
        => HandleResult(await _service.AssignTableToSectionAsync(tableId, sectionId));

    [HttpDelete("{sectionId:int}/tables/{tableId:int}")]
    public async Task<IActionResult> RemoveTable(int sectionId, int tableId)
        => HandleResult(await _service.RemoveTableFromSectionAsync(tableId));
}

// ============================================================
// QR Config Controller (store owner — authenticated)
// ============================================================

