using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/contacts")]
public class ContactsController : BaseApiController
{
    private readonly IContactService _contactService;

    public ContactsController(IContactService contactService) => _contactService = contactService;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContactRequest request)
    {
        var result = await _contactService.CreateAsync(request);
        return HandleResult(result);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string? search,
        [FromQuery] int? type,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _contactService.SearchAsync(search, type, page, pageSize);
        return HandleResult(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _contactService.GetByIdAsync(id);
        return HandleResult(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateContactRequest request)
    {
        var result = await _contactService.UpdateAsync(id, request);
        return HandleResult(result);
    }

    [HttpGet("{id:int}/balance")]
    public async Task<IActionResult> GetBalance(int id)
    {
        var result = await _contactService.GetBalanceAsync(id);
        return HandleResult(result);
    }

    [HttpPost("{id:int}/payment")]
    public async Task<IActionResult> RecordPayment(int id, [FromBody] PaymentDto payment)
    {
        var result = await _contactService.RecordPaymentAsync(id, payment.Amount, payment.AccountId);
        return HandleResult(result);
    }
}

// ============================================================
// WarehousesController
// ============================================================

