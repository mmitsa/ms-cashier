using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Subscription Request
public record SubscriptionRequestDto(int Id, string StoreName, string? BusinessType, string OwnerName, string Phone, string? Email, string? Address, string City, string VatNumber, int PlanId, string? PlanName, string AdminUsername, string AdminFullName, string? Notes, SubscriptionRequestStatus Status, string? AdminNotes, Guid? ApprovedTenantId, DateTime CreatedAt, DateTime? ReviewedAt);
public record CreateSubscriptionRequest(string StoreName, string? BusinessType, string OwnerName, string Phone, string? Email, string? Address, string City, string VatNumber, int PlanId, string AdminUsername, string AdminPassword, string AdminFullName, string? Notes);
public record ReviewSubscriptionRequest(bool Approved, string? AdminNotes);

