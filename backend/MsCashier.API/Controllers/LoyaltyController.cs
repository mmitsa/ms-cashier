using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

// ============================================================
// LoyaltyController — برنامج نقاط الولاء
// ============================================================

[Route("api/v1/loyalty")]
public class LoyaltyController : BaseApiController
{
    private readonly ILoyaltyService _loyaltyService;

    public LoyaltyController(ILoyaltyService loyaltyService) => _loyaltyService = loyaltyService;

    [HttpGet("program")]
    public async Task<IActionResult> GetProgram()
        => HandleResult(await _loyaltyService.GetProgramAsync());

    [HttpPost("program")]
    public async Task<IActionResult> CreateOrUpdateProgram([FromBody] CreateLoyaltyProgramRequest request)
        => HandleResult(await _loyaltyService.CreateOrUpdateProgramAsync(request));

    [HttpGet("customer/{contactId:int}")]
    public async Task<IActionResult> GetCustomerLoyalty(int contactId)
        => HandleResult(await _loyaltyService.GetCustomerLoyaltyAsync(contactId));

    [HttpPost("customer/{contactId:int}/enroll")]
    public async Task<IActionResult> EnrollCustomer(int contactId)
        => HandleResult(await _loyaltyService.EnrollCustomerAsync(contactId));

    [HttpPost("customer/{contactId:int}/earn")]
    public async Task<IActionResult> EarnPoints(int contactId, [FromQuery] long invoiceId, [FromQuery] decimal totalAmount)
        => HandleResult(await _loyaltyService.EarnPointsAsync(contactId, invoiceId, totalAmount));

    [HttpPost("customer/{contactId:int}/redeem")]
    public async Task<IActionResult> RedeemPoints(int contactId, [FromBody] RedeemPointsRequest request)
        => HandleResult(await _loyaltyService.RedeemPointsAsync(contactId, request.Points));

    [HttpGet("customer/{contactId:int}/transactions")]
    public async Task<IActionResult> GetTransactions(int contactId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => HandleResult(await _loyaltyService.GetTransactionsAsync(contactId, page, pageSize));

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
        => HandleResult(await _loyaltyService.GetDashboardAsync());
}
