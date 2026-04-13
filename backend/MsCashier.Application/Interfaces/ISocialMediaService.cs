using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;

namespace MsCashier.Application.Interfaces;

public interface ISocialMediaService
{
    // Accounts
    Task<Result<List<SocialMediaAccountDto>>> GetAccountsAsync();
    Task<Result<SocialMediaAccountDto>> SaveAccountAsync(SaveSocialMediaAccountRequest request);
    Task<Result<bool>> DeleteAccountAsync(int id);

    // Posts
    Task<Result<PagedResult<SocialMediaPostDto>>> GetPostsAsync(int page, int pageSize);
    Task<Result<SocialMediaPostDto>> CreatePostAsync(CreateSocialMediaPostRequest request);
    Task<Result<SocialMediaPostDto>> SchedulePostAsync(ScheduleSocialMediaPostRequest request);
    Task<Result<SocialMediaPostDto>> PublishPostAsync(int postId);

    // Auto Post Rules
    Task<Result<List<AutoPostRuleDto>>> GetAutoPostRulesAsync();
    Task<Result<AutoPostRuleDto>> SaveAutoPostRuleAsync(SaveAutoPostRuleRequest request);
    Task<Result<bool>> DeleteAutoPostRuleAsync(int id);
}
