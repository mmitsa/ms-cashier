using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : BaseApiController
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] int limit = 50)
        => HandleResult(await _service.GetMyNotificationsAsync(limit));

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
        => HandleResult(await _service.GetUnreadCountAsync());

    [HttpPost("{id:long}/read")]
    public async Task<IActionResult> MarkRead(long id)
        => HandleResult(await _service.MarkAsReadAsync(id));

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
        => HandleResult(await _service.MarkAllAsReadAsync());
}
