using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Contact
public record ContactDto(
    int Id, ContactType ContactType, string Name, string? Phone, string? Phone2, string? Email,
    string? Address, PriceType PriceType, decimal? CreditLimit, decimal Balance, bool IsActive,
    string? TaxNumber, bool IsCompany, string? CommercialRegister, string? NationalId,
    string? BankName, string? BankAccountNumber, string? Iban,
    int? CreditPeriodDays, string? PaymentMethod, string? ProjectName, string? Notes);

public record CreateContactRequest(
    ContactType ContactType, string Name, string? Phone, string? Phone2, string? Email,
    string? Address, string? TaxNumber, PriceType PriceType, decimal? CreditLimit,
    bool IsCompany = false, string? CommercialRegister = null, string? NationalId = null,
    string? BankName = null, string? BankAccountNumber = null, string? Iban = null,
    int? CreditPeriodDays = null, string? PaymentMethod = null, string? ProjectName = null,
    string? Notes = null);

