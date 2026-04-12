using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// HR: Payslip (for printing/export)
// ============================================================
public record PayslipDto(
    // Company
    string CompanyName, string? CompanyAddress, string? CompanyPhone, string? CompanyLogo,
    // Employee
    string EmployeeName, string? EmployeeId, string? Department, string? Position,
    string? BankName, string? BankAccount, string? IBAN,
    // Period
    int Month, int Year,
    // Attendance summary
    int WorkingDays, int PresentDays, int AbsentDays, int LateDays,
    // Earnings
    decimal BasicSalary, List<PayslipLineDto> Earnings,
    // Deductions
    List<PayslipLineDto> DeductionItems,
    // Totals
    decimal TotalEarnings, decimal TotalDeductions, decimal NetSalary,
    // Payment
    string? CheckNumber, DateTime? PaymentDate);
public record PayslipLineDto(string Description, decimal Amount);

