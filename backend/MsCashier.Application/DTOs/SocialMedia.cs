using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ─── Social Media Account ───────────────────────────
public record SocialMediaAccountDto(
    int Id,
    string Platform,
    string? AccountName,
    string? AccountId,
    string? PageId,
    bool IsActive,
    DateTime ConnectedAt,
    DateTime? TokenExpiresAt);

public record SaveSocialMediaAccountRequest(
    int? Id,
    string Platform,
    string? AccountName,
    string? AccountId,
    string? AccessToken,
    string? RefreshToken,
    string? PageId,
    DateTime? TokenExpiresAt);

// ─── Social Media Post ──────────────────────────────
public record SocialMediaPostDto(
    int Id,
    string? Content,
    string? ContentAr,
    string[]? ImageUrls,
    string? VideoUrl,
    string? Hashtags,
    SocialMediaPostType Type,
    int? ProductId,
    SocialMediaPostStatus Status,
    DateTime? ScheduledAt,
    DateTime? PublishedAt,
    DateTime CreatedAt,
    List<SocialMediaPostTargetDto> Targets);

public record SocialMediaPostTargetDto(
    int Id,
    int SocialMediaAccountId,
    string Platform,
    string? AccountName,
    string? PlatformPostId,
    SocialMediaPostStatus Status,
    string? ErrorMessage);

public record CreateSocialMediaPostRequest(
    string? Content,
    string? ContentAr,
    string[]? ImageUrls,
    string? VideoUrl,
    string? Hashtags,
    SocialMediaPostType Type,
    int? ProductId,
    List<int> TargetAccountIds);

public record ScheduleSocialMediaPostRequest(
    int PostId,
    DateTime ScheduledAt);

// ─── Auto Post Rule ─────────────────────────────────
public record AutoPostRuleDto(
    int Id,
    string TriggerEvent,
    string[]? TargetPlatforms,
    string? ContentTemplate,
    string? ContentTemplateAr,
    bool IncludeImage,
    bool IncludePrice,
    bool IncludeStoreLink,
    bool IsActive);

public record SaveAutoPostRuleRequest(
    int? Id,
    string TriggerEvent,
    string[]? TargetPlatforms,
    string? ContentTemplate,
    string? ContentTemplateAr,
    bool IncludeImage,
    bool IncludePrice,
    bool IncludeStoreLink,
    bool IsActive);
