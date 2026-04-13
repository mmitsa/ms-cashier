using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

/// <summary>إدارة حسابات ومنشورات التواصل الاجتماعي</summary>
[Route("api/v1/social-media")]
public class SocialMediaController : BaseApiController
{
    private readonly ISocialMediaService _socialMediaService;

    public SocialMediaController(ISocialMediaService socialMediaService) => _socialMediaService = socialMediaService;

    // ─── Accounts ───────────────────────────────────

    /// <summary>عرض جميع حسابات التواصل الاجتماعي</summary>
    [HttpGet("accounts")]
    public async Task<IActionResult> GetAccounts()
        => HandleResult(await _socialMediaService.GetAccountsAsync());

    /// <summary>حفظ حساب تواصل اجتماعي</summary>
    /// <param name="request">بيانات الحساب</param>
    [HttpPost("accounts")]
    public async Task<IActionResult> SaveAccount([FromBody] SaveSocialMediaAccountRequest request)
        => HandleResult(await _socialMediaService.SaveAccountAsync(request));

    /// <summary>حذف حساب تواصل اجتماعي</summary>
    /// <param name="id">معرف الحساب</param>
    [HttpDelete("accounts/{id:int}")]
    public async Task<IActionResult> DeleteAccount(int id)
        => HandleResult(await _socialMediaService.DeleteAccountAsync(id));

    // ─── Posts ───────────────────────────────────────

    /// <summary>عرض المنشورات مع التصفح</summary>
    /// <param name="page">رقم الصفحة</param>
    /// <param name="pageSize">حجم الصفحة</param>
    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => HandleResult(await _socialMediaService.GetPostsAsync(page, pageSize));

    /// <summary>إنشاء منشور جديد</summary>
    /// <param name="request">بيانات المنشور</param>
    [HttpPost("posts")]
    public async Task<IActionResult> CreatePost([FromBody] CreateSocialMediaPostRequest request)
        => HandleResult(await _socialMediaService.CreatePostAsync(request));

    /// <summary>جدولة منشور للنشر لاحقاً</summary>
    /// <param name="id">معرف المنشور</param>
    /// <param name="request">بيانات الجدولة</param>
    [HttpPost("posts/{id:int}/schedule")]
    public async Task<IActionResult> SchedulePost(int id, [FromBody] ScheduleSocialMediaPostRequest request)
        => HandleResult(await _socialMediaService.SchedulePostAsync(request with { PostId = id }));

    /// <summary>نشر منشور فوراً</summary>
    /// <param name="id">معرف المنشور</param>
    [HttpPost("posts/{id:int}/publish")]
    public async Task<IActionResult> PublishPost(int id)
        => HandleResult(await _socialMediaService.PublishPostAsync(id));

    // ─── Auto Post Rules ────────────────────────────

    /// <summary>عرض قواعد النشر التلقائي</summary>
    [HttpGet("auto-rules")]
    public async Task<IActionResult> GetAutoPostRules()
        => HandleResult(await _socialMediaService.GetAutoPostRulesAsync());

    /// <summary>حفظ قاعدة نشر تلقائي</summary>
    /// <param name="request">بيانات القاعدة</param>
    [HttpPost("auto-rules")]
    public async Task<IActionResult> SaveAutoPostRule([FromBody] SaveAutoPostRuleRequest request)
        => HandleResult(await _socialMediaService.SaveAutoPostRuleAsync(request));

    /// <summary>حذف قاعدة نشر تلقائي</summary>
    /// <param name="id">معرف القاعدة</param>
    [HttpDelete("auto-rules/{id:int}")]
    public async Task<IActionResult> DeleteAutoPostRule(int id)
        => HandleResult(await _socialMediaService.DeleteAutoPostRuleAsync(id));
}
