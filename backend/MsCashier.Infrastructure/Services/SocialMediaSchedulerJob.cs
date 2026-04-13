using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Infrastructure.Data;

namespace MsCashier.Infrastructure.Services;

/// <summary>
/// Runs every minute. Publishes social media posts whose ScheduledAt has arrived.
/// Actual platform API calls are simulated — this job marks them as Published
/// and creates PostTarget records.
/// </summary>
public class SocialMediaSchedulerJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SocialMediaSchedulerJob> _logger;

    public SocialMediaSchedulerJob(IServiceProvider serviceProvider, ILogger<SocialMediaSchedulerJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SocialMediaSchedulerJob started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PublishScheduledPostsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SocialMediaSchedulerJob encountered an error.");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task PublishScheduledPostsAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;

        var duePosts = await db.SocialMediaPosts
            .IgnoreQueryFilters()
            .Include(p => p.Targets)
            .Where(p => !p.IsDeleted
                && p.Status == SocialMediaPostStatus.Scheduled
                && p.ScheduledAt != null
                && p.ScheduledAt <= now)
            .Take(100) // batch limit
            .ToListAsync(ct);

        if (duePosts.Count == 0)
        {
            _logger.LogDebug("SocialMediaSchedulerJob: No posts due for publishing.");
            return;
        }

        foreach (var post in duePosts)
        {
            if (ct.IsCancellationRequested) break;

            try
            {
                // Simulated publish — actual platform API calls would go here.
                post.Status = SocialMediaPostStatus.Published;
                post.PublishedAt = now;

                // Update existing targets to Published
                foreach (var target in post.Targets)
                {
                    target.Status = SocialMediaPostStatus.Published;
                    target.PlatformPostId = $"sim_{Guid.NewGuid():N}";
                }

                _logger.LogInformation(
                    "SocialMediaSchedulerJob: Published post {PostId} for tenant {TenantId}.",
                    post.Id, post.TenantId);
            }
            catch (Exception ex)
            {
                post.Status = SocialMediaPostStatus.Failed;
                foreach (var target in post.Targets)
                {
                    target.Status = SocialMediaPostStatus.Failed;
                    target.ErrorMessage = ex.Message.Length > 1000 ? ex.Message[..1000] : ex.Message;
                }
                _logger.LogWarning(ex, "SocialMediaSchedulerJob: Failed to publish post {PostId}.", post.Id);
            }
        }

        await db.SaveChangesAsync(ct);
        _logger.LogInformation("SocialMediaSchedulerJob: Processed {Count} scheduled posts.", duePosts.Count);
    }
}
