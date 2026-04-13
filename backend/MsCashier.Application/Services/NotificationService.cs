using Microsoft.EntityFrameworkCore;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public NotificationService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<List<NotificationDto>>> GetMyNotificationsAsync(int limit = 50)
    {
        try
        {
            var userId = _tenant.UserId;
            var notifs = await _uow.Repository<Notification>().Query()
                .Where(n => n.UserId == null || n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(limit)
                .AsNoTracking()
                .ToListAsync();

            return Result<List<NotificationDto>>.Success(notifs.Select(Map).ToList());
        }
        catch (Exception ex) { return Result<List<NotificationDto>>.Failure(ex.Message); }
    }

    public async Task<Result<int>> GetUnreadCountAsync()
    {
        try
        {
            var userId = _tenant.UserId;
            var count = await _uow.Repository<Notification>().Query()
                .Where(n => !n.IsRead && (n.UserId == null || n.UserId == userId))
                .CountAsync();
            return Result<int>.Success(count);
        }
        catch (Exception ex) { return Result<int>.Failure(ex.Message); }
    }

    public async Task<Result<bool>> MarkAsReadAsync(long id)
    {
        try
        {
            var notif = await _uow.Repository<Notification>().GetByIdAsync(id);
            if (notif is null) return Result<bool>.Failure("الإشعار غير موجود");
            notif.IsRead = true;
            notif.ReadAt = DateTime.UtcNow;
            _uow.Repository<Notification>().Update(notif);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true);
        }
        catch (Exception ex) { return Result<bool>.Failure(ex.Message); }
    }

    public async Task<Result<bool>> MarkAllAsReadAsync()
    {
        try
        {
            var userId = _tenant.UserId;
            var unread = await _uow.Repository<Notification>().Query()
                .Where(n => !n.IsRead && (n.UserId == null || n.UserId == userId))
                .ToListAsync();
            foreach (var n in unread) { n.IsRead = true; n.ReadAt = DateTime.UtcNow; _uow.Repository<Notification>().Update(n); }
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true);
        }
        catch (Exception ex) { return Result<bool>.Failure(ex.Message); }
    }

    public async Task SendAsync(Guid? userId, string title, string? body, string type, string? entityType, string? entityId)
    {
        try
        {
            var notif = new Notification
            {
                UserId = userId,
                Title = title,
                Body = body,
                Type = type,
                EntityType = entityType,
                EntityId = entityId,
                IsRead = false,
            };
            await _uow.Repository<Notification>().AddAsync(notif);
            await _uow.SaveChangesAsync();
        }
        catch { /* notification failures must not crash the main operation */ }
    }

    private static NotificationDto Map(Notification n) => new(n.Id, n.Title, n.Body, n.Type, n.EntityType, n.EntityId, n.IsRead, n.CreatedAt);
}
