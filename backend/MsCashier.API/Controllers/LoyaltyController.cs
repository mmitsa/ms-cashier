using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

// ============================================================
// LoyaltyController — برنامج نقاط الولاء
// ============================================================

/// <summary>إدارة برنامج نقاط الولاء</summary>
[Route("api/v1/loyalty")]
public class LoyaltyController : BaseApiController
{
    private readonly ILoyaltyService _loyaltyService;

    public LoyaltyController(ILoyaltyService loyaltyService) => _loyaltyService = loyaltyService;

    /// <summary>عرض إعدادات برنامج الولاء</summary>
    [HttpGet("program")]
    public async Task<IActionResult> GetProgram()
        => HandleResult(await _loyaltyService.GetProgramAsync());

    /// <summary>إنشاء أو تحديث برنامج الولاء</summary>
    /// <param name="request">إعدادات البرنامج</param>
    [HttpPost("program")]
    public async Task<IActionResult> CreateOrUpdateProgram([FromBody] CreateLoyaltyProgramRequest request)
        => HandleResult(await _loyaltyService.CreateOrUpdateProgramAsync(request));

    /// <summary>عرض بيانات ولاء عميل</summary>
    /// <param name="contactId">معرف العميل</param>
    [HttpGet("customer/{contactId:int}")]
    public async Task<IActionResult> GetCustomerLoyalty(int contactId)
        => HandleResult(await _loyaltyService.GetCustomerLoyaltyAsync(contactId));

    /// <summary>تسجيل عميل في برنامج الولاء</summary>
    /// <param name="contactId">معرف العميل</param>
    [HttpPost("customer/{contactId:int}/enroll")]
    public async Task<IActionResult> EnrollCustomer(int contactId)
        => HandleResult(await _loyaltyService.EnrollCustomerAsync(contactId));

    /// <summary>إضافة نقاط لعميل من فاتورة</summary>
    /// <param name="contactId">معرف العميل</param>
    /// <param name="invoiceId">معرف الفاتورة</param>
    /// <param name="totalAmount">المبلغ الإجمالي</param>
    [HttpPost("customer/{contactId:int}/earn")]
    public async Task<IActionResult> EarnPoints(int contactId, [FromQuery] long invoiceId, [FromQuery] decimal totalAmount)
        => HandleResult(await _loyaltyService.EarnPointsAsync(contactId, invoiceId, totalAmount));

    /// <summary>استبدال نقاط عميل</summary>
    /// <param name="contactId">معرف العميل</param>
    /// <param name="request">عدد النقاط المراد استبدالها</param>
    [HttpPost("customer/{contactId:int}/redeem")]
    public async Task<IActionResult> RedeemPoints(int contactId, [FromBody] RedeemPointsRequest request)
        => HandleResult(await _loyaltyService.RedeemPointsAsync(contactId, request.Points));

    /// <summary>عرض سجل معاملات نقاط عميل</summary>
    /// <param name="contactId">معرف العميل</param>
    /// <param name="page">رقم الصفحة</param>
    /// <param name="pageSize">حجم الصفحة</param>
    [HttpGet("customer/{contactId:int}/transactions")]
    public async Task<IActionResult> GetTransactions(int contactId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => HandleResult(await _loyaltyService.GetTransactionsAsync(contactId, page, pageSize));

    /// <summary>لوحة معلومات برنامج الولاء</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
        => HandleResult(await _loyaltyService.GetDashboardAsync());
}
