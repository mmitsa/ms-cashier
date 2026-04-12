using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// Subscription
public interface ISubscriptionService
{
    Task<Result<SubscriptionRequestDto>> SubmitRequestAsync(CreateSubscriptionRequest request);
    Task<Result<PagedResult<SubscriptionRequestDto>>> GetAllRequestsAsync(int page, int pageSize, SubscriptionRequestStatus? status);
    Task<Result<SubscriptionRequestDto>> ReviewRequestAsync(int id, ReviewSubscriptionRequest review, Guid reviewerId);
}

