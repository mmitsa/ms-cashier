using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

[Route("api/v1/subscriptions")]
public class SubscriptionController : BaseApiController
{
    private readonly ISubscriptionService _subscriptionService;
    public SubscriptionController(ISubscriptionService subscriptionService) => _subscriptionService = subscriptionService;

    [HttpPost("request")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitRequest([FromBody] CreateSubscriptionRequest request)
    {
        var result = await _subscriptionService.SubmitRequestAsync(request);
        return HandleResult(result);
    }

    [HttpGet("requests")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] SubscriptionRequestStatus? status = null)
    {
        var result = await _subscriptionService.GetAllRequestsAsync(page, pageSize, status);
        return HandleResult(result);
    }

    [HttpPost("requests/{id:int}/review")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Review(int id, [FromBody] ReviewSubscriptionRequest request)
    {
        var reviewerId = Guid.Parse(User.FindFirst("sub")!.Value);
        var result = await _subscriptionService.ReviewRequestAsync(id, request, reviewerId);
        return HandleResult(result);
    }
}

// ============================================================
// PaymentGatewayController
// ============================================================

