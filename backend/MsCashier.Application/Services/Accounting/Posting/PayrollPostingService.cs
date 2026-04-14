using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs.Accounting;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums.Accounting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting.Posting;

/// <summary>
/// يُرحِّل مسير الرواتب إلى قيد محاسبي:
/// مدين مصاريف رواتب، دائن رواتب مستحقة + خصومات (GOSI إن وجد).
/// </summary>
public class PayrollPostingService : IPayrollPostingService
{
    private readonly IUnitOfWork _uow;
    private readonly IJournalEntryService _journal;
    private readonly AccountResolver _resolver;

    public PayrollPostingService(IUnitOfWork uow, IJournalEntryService journal, AccountResolver resolver)
    {
        _uow = uow;
        _journal = journal;
        _resolver = resolver;
    }

    public async Task<Result<long>> PostPayrollRunAsync(int payrollId, CancellationToken ct = default)
    {
        var payroll = await _uow.Repository<Payroll>().Query()
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == payrollId, ct);

        if (payroll is null)
            return Result<long>.Failure($"مسير الرواتب رقم {payrollId} غير موجود");

        // الإجمالي = راتب أساسي + بدلات + مكافآت + أوفرتايم
        var gross = payroll.BasicSalary + payroll.Allowances + payroll.Bonus + payroll.OvertimeAmount;
        // خصومات إجمالية (خصومات + جزاءات)
        var deductions = payroll.Deductions + payroll.PenaltyAmount;
        var net = payroll.NetSalary;

        if (gross <= 0)
            return Result<long>.Failure("إجمالي الراتب صفر — لا يوجد ما يُرحَّل محاسبياً");

        var salariesExpenseId = await _resolver.GetAccountIdByCodeAsync("5201", ct); // مصاريف رواتب
        var salariesPayableId = await _resolver.GetAccountIdByCodeAsync("2110", ct); // رواتب مستحقة
        var gosiAccountId = await _resolver.TryGetAccountIdByCodeAsync("2130", ct);  // GOSI / خصومات

        var lines = new List<JournalLineDto>
        {
            new(
                AccountId: salariesExpenseId,
                Debit: gross,
                Credit: 0m,
                Description: $"مصاريف رواتب {payroll.Month:00}/{payroll.Year}")
        };

        // الدائن
        if (deductions > 0 && gosiAccountId.HasValue)
        {
            lines.Add(new JournalLineDto(
                AccountId: salariesPayableId,
                Debit: 0m,
                Credit: net,
                Description: $"صافي راتب مستحق — {payroll.Month:00}/{payroll.Year}"));

            lines.Add(new JournalLineDto(
                AccountId: gosiAccountId.Value,
                Debit: 0m,
                Credit: deductions,
                Description: $"خصومات/تأمينات — {payroll.Month:00}/{payroll.Year}"));
        }
        else
        {
            // لا يوجد حساب GOSI: اجمع الخصومات على الرواتب المستحقة
            lines.Add(new JournalLineDto(
                AccountId: salariesPayableId,
                Debit: 0m,
                Credit: gross,
                Description: $"راتب مستحق (شامل الخصومات) — {payroll.Month:00}/{payroll.Year}"));
        }

        var entryDate = new DateTime(payroll.Year, payroll.Month, 1).AddMonths(1).AddDays(-1);

        var dto = new CreateJournalEntryDto(
            EntryDate: entryDate,
            Source: JournalSource.Payroll,
            Lines: lines,
            Reference: $"PAYROLL-{payroll.Id}",
            DescriptionAr: $"قيد مسير رواتب {payroll.Month:00}/{payroll.Year}",
            DescriptionEn: $"Payroll run {payroll.Month:00}/{payroll.Year}",
            SourceType: "Payroll",
            SourceId: payroll.Id,
            BranchId: null);

        return await _journal.CreateAndPostAsync(dto, ct);
    }
}
