using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public record NotificationDto(long Id, string Title, string? Body, string Type, string? EntityType, string? EntityId, bool IsRead, DateTime CreatedAt);

public interface INotificationService
{
    Task<Result<List<NotificationDto>>> GetMyNotificationsAsync(int limit = 50);
    Task<Result<int>> GetUnreadCountAsync();
    Task<Result<bool>> MarkAsReadAsync(long id);
    Task<Result<bool>> MarkAllAsReadAsync();
    Task SendAsync(Guid? userId, string title, string? body = null, string type = "info", string? entityType = null, string? entityId = null);
}
