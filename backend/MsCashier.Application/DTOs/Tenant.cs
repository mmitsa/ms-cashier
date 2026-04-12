using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Tenant
public record TenantDto(Guid Id, string Name, string BusinessType, string OwnerName, string Phone, string? Email, string? Address, string City, string? LogoUrl, int PlanId, string PlanName, TenantStatus Status, int ActiveUsers, int TotalProducts, decimal TotalSales, DateTime SubscriptionStart, DateTime? SubscriptionEnd, string? VatNumber, bool ZatcaEnabled, DateTime? TrialEndDate);
public record CreateTenantRequest(string Name, string BusinessType, string OwnerName, string Phone, string? Email, string? Address, string City, int PlanId, string AdminUsername, string AdminPassword, string AdminFullName, string VatNumber);
public record UpdateTenantRequest(string? Name, string? Phone, string? Email, string? Address, string? LogoUrl, string? TaxNumber, string? VatNumber, bool? ZatcaEnabled, string? Settings);

