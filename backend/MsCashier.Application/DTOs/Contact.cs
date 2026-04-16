using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Contact
public record ContactDto(
    int Id, ContactType ContactType, string Name, string? Phone, string? Phone2, string? Email,
    string? Address, PriceType PriceType, decimal? CreditLimit, decimal Balance, bool IsActive,
    string? TaxNumber, bool IsCompany, string? CommercialRegister, string? NationalId,
    string? BankName, string? BankAccountNumber, string? Iban,
    int? CreditPeriodDays, string? PaymentMethod, string? ProjectName, string? Notes,
    // ZATCA fields
    string? Street, string? District, string? City, string? Province, string? PostalCode,
    string? CountryCode, string? BuildingNumber, string? PlotIdentification,
    string? IdScheme, string? OtherId, string? ContactPerson);

public record CreateContactRequest(
    ContactType ContactType, string Name, string? Phone, string? Phone2, string? Email,
    string? Address, string? TaxNumber, PriceType PriceType, decimal? CreditLimit,
    bool IsCompany = false, string? CommercialRegister = null, string? NationalId = null,
    string? BankName = null, string? BankAccountNumber = null, string? Iban = null,
    int? CreditPeriodDays = null, string? PaymentMethod = null, string? ProjectName = null,
    string? Notes = null,
    // ZATCA fields
    string? Street = null, string? District = null, string? City = null, string? Province = null,
    string? PostalCode = null, string? CountryCode = "SA", string? BuildingNumber = null,
    string? PlotIdentification = null, string? IdScheme = null, string? OtherId = null,
    string? ContactPerson = null);
