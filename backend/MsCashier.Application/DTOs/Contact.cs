using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Contact
public record ContactDto(int Id, ContactType ContactType, string Name, string? Phone, string? Email, string? Address, PriceType PriceType, decimal? CreditLimit, decimal Balance, bool IsActive, string? TaxNumber);
public record CreateContactRequest(ContactType ContactType, string Name, string? Phone, string? Phone2, string? Email, string? Address, string? TaxNumber, PriceType PriceType, decimal? CreditLimit);

