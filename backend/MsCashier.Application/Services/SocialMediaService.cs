using System.Text.Json;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MsCashier.Application.Services;

public class SocialMediaService : ISocialMediaService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;
    private readonly ILogger<SocialMediaService> _logger;
    private readonly IEncryptionService _encryption;

    public SocialMediaService(IUnitOfWork uow, ICurrentTenantService tenant, ILogger<SocialMediaService> logger, IEncryptionService encryption)
    {
        _uow = uow;
        _tenant = tenant;
        _logger = logger;
        _encryption = encryption;
    }

    // ════════════════════════════════════════════════════════
    // Accounts
    // ════════════════════════════════════════════════════════

    public async Task<Result<List<SocialMediaAccountDto>>> GetAccountsAsync()
    {
        try
        {
            var accounts = await _uow.Repository<SocialMediaAccount>().Query()
                .Where(a => a.TenantId == _tenant.TenantId && !a.IsDeleted)
                .OrderByDescending(a => a.ConnectedAt)
                .Select(a => new SocialMediaAccountDto(
                    a.Id, a.Platform, a.AccountName, a.AccountId,
                    a.PageId, a.IsActive, a.ConnectedAt, a.TokenExpiresAt))
                .AsNoTracking()
                .ToListAsync();

            return Result<List<SocialMediaAccountDto>>.Success(accounts);
        }
        catch (Exception ex)
        {
            return Result<List<SocialMediaAccountDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<SocialMediaAccountDto>> SaveAccountAsync(SaveSocialMediaAccountRequest request)
    {
        try
        {
            SocialMediaAccount account;

            if (request.Id.HasValue && request.Id > 0)
            {
                account = await _uow.Repository<SocialMediaAccount>().Query()
                    .FirstOrDefaultAsync(a => a.Id == request.Id && a.TenantId == _tenant.TenantId && !a.IsDeleted)
                    ?? throw new Exception("الحساب غير موجود");

                account.Platform = request.Platform;
                account.AccountName = request.AccountName;
                account.AccountId = request.AccountId;
                account.PageId = request.PageId;
                account.TokenExpiresAt = request.TokenExpiresAt;
                account.UpdatedAt = DateTime.UtcNow;

                if (!string.IsNullOrWhiteSpace(request.AccessToken))
                    account.AccessToken = _encryption.Encrypt(request.AccessToken);
                if (!string.IsNullOrWhiteSpace(request.RefreshToken))
                    account.RefreshToken = _encryption.Encrypt(request.RefreshToken);

                _uow.Repository<SocialMediaAccount>().Update(account);
            }
            else
            {
                account = new SocialMediaAccount
                {
                    TenantId = _tenant.TenantId,
                    Platform = request.Platform,
                    AccountName = request.AccountName,
                    AccountId = request.AccountId,
                    AccessToken = request.AccessToken != null ? _encryption.Encrypt(request.AccessToken) : null,
                    RefreshToken = request.RefreshToken != null ? _encryption.Encrypt(request.RefreshToken) : null,
                    PageId = request.PageId,
                    TokenExpiresAt = request.TokenExpiresAt,
                    IsActive = true,
                    ConnectedAt = DateTime.UtcNow,
                };
                await _uow.Repository<SocialMediaAccount>().AddAsync(account);
            }

            await _uow.SaveChangesAsync();

            var dto = new SocialMediaAccountDto(
                account.Id, account.Platform, account.AccountName, account.AccountId,
                account.PageId, account.IsActive, account.ConnectedAt, account.TokenExpiresAt);

            return Result<SocialMediaAccountDto>.Success(dto, "تم حفظ الحساب بنجاح");
        }
        catch (Exception ex)
        {
            return Result<SocialMediaAccountDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteAccountAsync(int id)
    {
        try
        {
            var account = await _uow.Repository<SocialMediaAccount>().Query()
                .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == _tenant.TenantId && !a.IsDeleted);

            if (account is null)
                return Result<bool>.Failure("الحساب غير موجود");

            account.IsDeleted = true;
            account.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<SocialMediaAccount>().Update(account);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم حذف الحساب بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    // ════════════════════════════════════════════════════════
    // Posts
    // ════════════════════════════════════════════════════════

    public async Task<Result<PagedResult<SocialMediaPostDto>>> GetPostsAsync(int page, int pageSize)
    {
        try
        {
            var query = _uow.Repository<SocialMediaPost>().Query()
                .Where(p => p.TenantId == _tenant.TenantId && !p.IsDeleted);

            var totalCount = await query.CountAsync();

            var posts = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(p => p.Targets)
                .AsNoTracking()
                .ToListAsync();

            var accountIds = posts.SelectMany(p => p.Targets).Select(t => t.SocialMediaAccountId);
            var accounts = await LoadAccountInfoAsync(accountIds);

            var dtos = posts.Select(p => MapPostToDto(p, accounts)).ToList();

            var result = new PagedResult<SocialMediaPostDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize,
            };

            return Result<PagedResult<SocialMediaPostDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<PagedResult<SocialMediaPostDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<SocialMediaPostDto>> CreatePostAsync(CreateSocialMediaPostRequest request)
    {
        try
        {
            var post = new SocialMediaPost
            {
                TenantId = _tenant.TenantId,
                Content = request.Content,
                ContentAr = request.ContentAr,
                ImageUrls = request.ImageUrls != null ? JsonSerializer.Serialize(request.ImageUrls) : null,
                VideoUrl = request.VideoUrl,
                Hashtags = request.Hashtags,
                Type = request.Type,
                ProductId = request.ProductId,
                Status = SocialMediaPostStatus.Draft,
            };

            await _uow.Repository<SocialMediaPost>().AddAsync(post);
            await _uow.SaveChangesAsync();

            // Add targets
            foreach (var accountId in request.TargetAccountIds)
            {
                var target = new SocialMediaPostTarget
                {
                    TenantId = _tenant.TenantId,
                    PostId = post.Id,
                    SocialMediaAccountId = accountId,
                    Status = SocialMediaPostStatus.Draft,
                };
                await _uow.Repository<SocialMediaPostTarget>().AddAsync(target);
            }

            await _uow.SaveChangesAsync();

            // Reload with targets
            var loaded = await _uow.Repository<SocialMediaPost>().Query()
                .Include(p => p.Targets)
                .AsNoTracking()
                .FirstAsync(p => p.Id == post.Id);

            var accounts = await LoadAccountInfoAsync(loaded.Targets.Select(t => t.SocialMediaAccountId));

            return Result<SocialMediaPostDto>.Success(MapPostToDto(loaded, accounts), "تم إنشاء المنشور بنجاح");
        }
        catch (Exception ex)
        {
            return Result<SocialMediaPostDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<SocialMediaPostDto>> SchedulePostAsync(ScheduleSocialMediaPostRequest request)
    {
        try
        {
            var post = await _uow.Repository<SocialMediaPost>().Query()
                .Include(p => p.Targets)
                .FirstOrDefaultAsync(p => p.Id == request.PostId && p.TenantId == _tenant.TenantId && !p.IsDeleted);

            if (post is null)
                return Result<SocialMediaPostDto>.Failure("المنشور غير موجود");

            post.ScheduledAt = request.ScheduledAt;
            post.Status = SocialMediaPostStatus.Scheduled;
            post.UpdatedAt = DateTime.UtcNow;

            foreach (var target in post.Targets)
                target.Status = SocialMediaPostStatus.Scheduled;

            _uow.Repository<SocialMediaPost>().Update(post);
            await _uow.SaveChangesAsync();

            var accounts = await LoadAccountInfoAsync(post.Targets.Select(t => t.SocialMediaAccountId));

            return Result<SocialMediaPostDto>.Success(MapPostToDto(post, accounts), "تم جدولة المنشور بنجاح");
        }
        catch (Exception ex)
        {
            return Result<SocialMediaPostDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<SocialMediaPostDto>> PublishPostAsync(int postId)
    {
        try
        {
            var post = await _uow.Repository<SocialMediaPost>().Query()
                .Include(p => p.Targets)
                .FirstOrDefaultAsync(p => p.Id == postId && p.TenantId == _tenant.TenantId && !p.IsDeleted);

            if (post is null)
                return Result<SocialMediaPostDto>.Failure("المنشور غير موجود");

            // Simulated publish — mark as published, log the action
            _logger.LogInformation("Publishing social media post {PostId} for tenant {TenantId}", postId, _tenant.TenantId);

            post.Status = SocialMediaPostStatus.Published;
            post.PublishedAt = DateTime.UtcNow;
            post.UpdatedAt = DateTime.UtcNow;

            var publishResults = new List<object>();

            foreach (var target in post.Targets)
            {
                target.Status = SocialMediaPostStatus.Published;
                target.PlatformPostId = $"sim_{Guid.NewGuid():N}";
                target.UpdatedAt = DateTime.UtcNow;

                publishResults.Add(new
                {
                    accountId = target.SocialMediaAccountId,
                    status = "published",
                    platformPostId = target.PlatformPostId,
                    publishedAt = DateTime.UtcNow,
                });

                _logger.LogInformation("Simulated publish to account {AccountId} — platformPostId: {PlatformPostId}",
                    target.SocialMediaAccountId, target.PlatformPostId);
            }

            post.PublishResults = JsonSerializer.Serialize(publishResults);
            _uow.Repository<SocialMediaPost>().Update(post);
            await _uow.SaveChangesAsync();

            var accounts = await LoadAccountInfoAsync(post.Targets.Select(t => t.SocialMediaAccountId));

            return Result<SocialMediaPostDto>.Success(MapPostToDto(post, accounts), "تم نشر المنشور بنجاح");
        }
        catch (Exception ex)
        {
            return Result<SocialMediaPostDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    // ════════════════════════════════════════════════════════
    // Auto Post Rules
    // ════════════════════════════════════════════════════════

    public async Task<Result<List<AutoPostRuleDto>>> GetAutoPostRulesAsync()
    {
        try
        {
            var rules = await _uow.Repository<AutoPostRule>().Query()
                .Where(r => r.TenantId == _tenant.TenantId && !r.IsDeleted)
                .OrderByDescending(r => r.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            var dtos = rules.Select(r => new AutoPostRuleDto(
                r.Id, r.TriggerEvent,
                !string.IsNullOrEmpty(r.TargetPlatforms) ? JsonSerializer.Deserialize<string[]>(r.TargetPlatforms) : null,
                r.ContentTemplate, r.ContentTemplateAr,
                r.IncludeImage, r.IncludePrice, r.IncludeStoreLink, r.IsActive
            )).ToList();

            return Result<List<AutoPostRuleDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            return Result<List<AutoPostRuleDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<AutoPostRuleDto>> SaveAutoPostRuleAsync(SaveAutoPostRuleRequest request)
    {
        try
        {
            AutoPostRule rule;

            if (request.Id.HasValue && request.Id > 0)
            {
                rule = await _uow.Repository<AutoPostRule>().Query()
                    .FirstOrDefaultAsync(r => r.Id == request.Id && r.TenantId == _tenant.TenantId && !r.IsDeleted)
                    ?? throw new Exception("القاعدة غير موجودة");

                rule.TriggerEvent = request.TriggerEvent;
                rule.TargetPlatforms = request.TargetPlatforms != null ? JsonSerializer.Serialize(request.TargetPlatforms) : null;
                rule.ContentTemplate = request.ContentTemplate;
                rule.ContentTemplateAr = request.ContentTemplateAr;
                rule.IncludeImage = request.IncludeImage;
                rule.IncludePrice = request.IncludePrice;
                rule.IncludeStoreLink = request.IncludeStoreLink;
                rule.IsActive = request.IsActive;
                rule.UpdatedAt = DateTime.UtcNow;

                _uow.Repository<AutoPostRule>().Update(rule);
            }
            else
            {
                rule = new AutoPostRule
                {
                    TenantId = _tenant.TenantId,
                    TriggerEvent = request.TriggerEvent,
                    TargetPlatforms = request.TargetPlatforms != null ? JsonSerializer.Serialize(request.TargetPlatforms) : null,
                    ContentTemplate = request.ContentTemplate,
                    ContentTemplateAr = request.ContentTemplateAr,
                    IncludeImage = request.IncludeImage,
                    IncludePrice = request.IncludePrice,
                    IncludeStoreLink = request.IncludeStoreLink,
                    IsActive = request.IsActive,
                };
                await _uow.Repository<AutoPostRule>().AddAsync(rule);
            }

            await _uow.SaveChangesAsync();

            var dto = new AutoPostRuleDto(
                rule.Id, rule.TriggerEvent,
                !string.IsNullOrEmpty(rule.TargetPlatforms) ? JsonSerializer.Deserialize<string[]>(rule.TargetPlatforms) : null,
                rule.ContentTemplate, rule.ContentTemplateAr,
                rule.IncludeImage, rule.IncludePrice, rule.IncludeStoreLink, rule.IsActive);

            return Result<AutoPostRuleDto>.Success(dto, "تم حفظ القاعدة بنجاح");
        }
        catch (Exception ex)
        {
            return Result<AutoPostRuleDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteAutoPostRuleAsync(int id)
    {
        try
        {
            var rule = await _uow.Repository<AutoPostRule>().Query()
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == _tenant.TenantId && !r.IsDeleted);

            if (rule is null)
                return Result<bool>.Failure("القاعدة غير موجودة");

            rule.IsDeleted = true;
            rule.UpdatedAt = DateTime.UtcNow;
            _uow.Repository<AutoPostRule>().Update(rule);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم حذف القاعدة بنجاح");
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    // ════════════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════════════

    private record AccountInfo(string Platform, string? AccountName);

    private async Task<Dictionary<int, AccountInfo>> LoadAccountInfoAsync(IEnumerable<int> accountIds)
    {
        var ids = accountIds.Distinct().ToList();
        if (ids.Count == 0) return new Dictionary<int, AccountInfo>();
        return await _uow.Repository<SocialMediaAccount>().Query()
            .Where(a => ids.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id, a => new AccountInfo(a.Platform, a.AccountName));
    }

    private static SocialMediaPostDto MapPostToDto(SocialMediaPost post, Dictionary<int, AccountInfo> accounts)
    {
        return new SocialMediaPostDto(
            post.Id,
            post.Content,
            post.ContentAr,
            !string.IsNullOrEmpty(post.ImageUrls) ? JsonSerializer.Deserialize<string[]>(post.ImageUrls) : null,
            post.VideoUrl,
            post.Hashtags,
            post.Type,
            post.ProductId,
            post.Status,
            post.ScheduledAt,
            post.PublishedAt,
            post.CreatedAt,
            post.Targets.Select(t =>
            {
                var acct = accounts.ContainsKey(t.SocialMediaAccountId) ? accounts[t.SocialMediaAccountId] : null;
                return new SocialMediaPostTargetDto(
                    t.Id,
                    t.SocialMediaAccountId,
                    acct?.Platform ?? "unknown",
                    acct?.AccountName,
                    t.PlatformPostId,
                    t.Status,
                    t.ErrorMessage);
            }).ToList());
    }
}
