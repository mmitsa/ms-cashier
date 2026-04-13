using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة جهات الاتصال (العملاء والموردين)</summary>
[Route("api/v1/contacts")]
[Authorize(Roles = "SuperAdmin,Admin,Cashier,SalesRep")]
public class ContactsController : BaseApiController
{
    private readonly IContactService _contactService;

    public ContactsController(IContactService contactService) => _contactService = contactService;

    /// <summary>إنشاء جهة اتصال جديدة</summary>
    /// <param name="request">بيانات جهة الاتصال</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContactRequest request)
    {
        var result = await _contactService.CreateAsync(request);
        return HandleResult(result);
    }

    /// <summary>البحث في جهات الاتصال</summary>
    /// <param name="search">نص البحث</param>
    /// <param name="type">نوع جهة الاتصال</param>
    /// <param name="page">رقم الصفحة</param>
    /// <param name="pageSize">حجم الصفحة</param>
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

    /// <summary>عرض جهة اتصال بالمعرف</summary>
    /// <param name="id">معرف جهة الاتصال</param>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _contactService.GetByIdAsync(id);
        return HandleResult(result);
    }

    /// <summary>تحديث بيانات جهة اتصال</summary>
    /// <param name="id">معرف جهة الاتصال</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateContactRequest request)
    {
        var result = await _contactService.UpdateAsync(id, request);
        return HandleResult(result);
    }

    /// <summary>عرض رصيد جهة اتصال</summary>
    /// <param name="id">معرف جهة الاتصال</param>
    [HttpGet("{id:int}/balance")]
    public async Task<IActionResult> GetBalance(int id)
    {
        var result = await _contactService.GetBalanceAsync(id);
        return HandleResult(result);
    }

    /// <summary>تسجيل دفعة لجهة اتصال</summary>
    /// <param name="id">معرف جهة الاتصال</param>
    /// <param name="payment">بيانات الدفعة</param>
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
