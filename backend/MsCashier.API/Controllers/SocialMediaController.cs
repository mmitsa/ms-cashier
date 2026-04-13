using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

namespace MsCashier.API.Controllers;

[Route("api/v1/social-media")]
public class SocialMediaController : BaseApiController
{
    private readonly ISocialMediaService _socialMediaService;

    public SocialMediaController(ISocialMediaService socialMediaService) => _socialMediaService = socialMediaService;

    // ─── Accounts ───────────────────────────────────

    [HttpGet("accounts")]
    public async Task<IActionResult> GetAccounts()
        => HandleResult(await _socialMediaService.GetAccountsAsync());

    [HttpPost("accounts")]
    public async Task<IActionResult> SaveAccount([FromBody] SaveSocialMediaAccountRequest request)
        => HandleResult(await _socialMediaService.SaveAccountAsync(request));

    [HttpDelete("accounts/{id:int}")]
    public async Task<IActionResult> DeleteAccount(int id)
        => HandleResult(await _socialMediaService.DeleteAccountAsync(id));

    // ─── Posts ───────────────────────────────────────

    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => HandleResult(await _socialMediaService.GetPostsAsync(page, pageSize));

    [HttpPost("posts")]
    public async Task<IActionResult> CreatePost([FromBody] CreateSocialMediaPostRequest request)
        => HandleResult(await _socialMediaService.CreatePostAsync(request));

    [HttpPost("posts/{id:int}/schedule")]
    public async Task<IActionResult> SchedulePost(int id, [FromBody] ScheduleSocialMediaPostRequest request)
        => HandleResult(await _socialMediaService.SchedulePostAsync(request with { PostId = id }));

    [HttpPost("posts/{id:int}/publish")]
    public async Task<IActionResult> PublishPost(int id)
        => HandleResult(await _socialMediaService.PublishPostAsync(id));

    // ─── Auto Post Rules ────────────────────────────

    [HttpGet("auto-rules")]
    public async Task<IActionResult> GetAutoPostRules()
        => HandleResult(await _socialMediaService.GetAutoPostRulesAsync());

    [HttpPost("auto-rules")]
    public async Task<IActionResult> SaveAutoPostRule([FromBody] SaveAutoPostRuleRequest request)
        => HandleResult(await _socialMediaService.SaveAutoPostRuleAsync(request));

    [HttpDelete("auto-rules/{id:int}")]
    public async Task<IActionResult> DeleteAutoPostRule(int id)
        => HandleResult(await _socialMediaService.DeleteAutoPostRuleAsync(id));
}
