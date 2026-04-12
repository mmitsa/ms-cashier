using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// ============================================================
// HR: Enhanced Payroll DTOs
// ============================================================
public record PayrollDetailDto(int Id, int EmployeeId, string EmployeeName, string? Department,
    int Month, int Year, int WorkingDays, int PresentDays, int AbsentDays,
    int LateDays, int LeaveDays,
    decimal BasicSalary, decimal Allowances, decimal Deductions,
    decimal Bonus, decimal OvertimeAmount, decimal PenaltyAmount, decimal NetSalary,
    PayrollStatus Status, bool IsPaid, DateTime? PaidDate,
    string? ApprovedByName, DateTime? ApprovedAt, string? Notes,
    DateTime CreatedAt, List<PayrollItemDto> Items, List<PayrollCheckDto> Checks);

public record PayrollItemDto(long Id, string ItemName, PayrollItemType ItemType, decimal Amount, string? Notes);

public record GeneratePayrollRequest(int Month, int Year, List<int>? EmployeeIds);
public record ApprovePayrollRequest(List<int> PayrollIds);
public record PayPayrollRequest(int PayrollId, string? CheckNumber, string? BankName,
    string? AccountNumber, DateTime? CashDate, string? Notes);

public record PayrollCheckDto(long Id, int PayrollId, string CheckNumber, decimal Amount,
    DateTime IssueDate, DateTime? CashDate, string? BankName, string? AccountNumber,
    bool IsCashed, string? Notes);

public record PayrollFilterRequest(int? Month, int? Year, int? EmployeeId,
    PayrollStatus? Status, int Page = 1, int PageSize = 50);

public record PayrollMonthSummaryDto(int Month, int Year, int EmployeeCount,
    decimal TotalBasicSalary, decimal TotalAllowances, decimal TotalDeductions,
    decimal TotalBonus, decimal TotalNet, int PaidCount, int UnpaidCount);

