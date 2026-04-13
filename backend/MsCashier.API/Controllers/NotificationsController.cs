using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>إدارة الإشعارات</summary>
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : BaseApiController
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service) => _service = service;

    /// <summary>عرض إشعاراتي</summary>
    /// <param name="limit">الحد الأقصى للنتائج</param>
    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] int limit = 50)
        => HandleResult(await _service.GetMyNotificationsAsync(limit));

    /// <summary>عرض عدد الإشعارات غير المقروءة</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
        => HandleResult(await _service.GetUnreadCountAsync());

    /// <summary>تحديد إشعار كمقروء</summary>
    /// <param name="id">معرف الإشعار</param>
    [HttpPost("{id:long}/read")]
    public async Task<IActionResult> MarkRead(long id)
        => HandleResult(await _service.MarkAsReadAsync(id));

    /// <summary>تحديد جميع الإشعارات كمقروءة</summary>
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
        => HandleResult(await _service.MarkAllAsReadAsync());
}
