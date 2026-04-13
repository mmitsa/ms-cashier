using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة وحدات القياس</summary>
[Route("api/v1/units")]
[Authorize]
public class UnitsController : BaseApiController
{
    private readonly IUnitService _service;

    public UnitsController(IUnitService service) => _service = service;

    /// <summary>عرض جميع وحدات القياس</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => HandleResult(await _service.GetAllAsync());

    /// <summary>عرض وحدة قياس بالمعرف</summary>
    /// <param name="id">معرف الوحدة</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => HandleResult(await _service.GetByIdAsync(id));

    /// <summary>إنشاء وحدة قياس جديدة</summary>
    /// <param name="request">بيانات الوحدة</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUnitRequest request)
        => HandleResult(await _service.CreateAsync(request));

    /// <summary>تحديث وحدة قياس</summary>
    /// <param name="id">معرف الوحدة</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUnitRequest request)
        => HandleResult(await _service.UpdateAsync(id, request));

    /// <summary>حذف وحدة قياس</summary>
    /// <param name="id">معرف الوحدة</param>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _service.DeleteAsync(id));

    /// <summary>تحويل كمية بين وحدتين</summary>
    /// <param name="fromUnitId">معرف الوحدة المصدر</param>
    /// <param name="toUnitId">معرف الوحدة الهدف</param>
    /// <param name="quantity">الكمية</param>
    [HttpGet("convert")]
    public async Task<IActionResult> Convert(
        [FromQuery] int fromUnitId,
        [FromQuery] int toUnitId,
        [FromQuery] decimal quantity)
        => HandleResult(await _service.ConvertAsync(fromUnitId, toUnitId, quantity));
}
