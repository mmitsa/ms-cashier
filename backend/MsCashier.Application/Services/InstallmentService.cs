using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Application.Services.Accounting;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// 9. InstallmentService
// ════════════════════════════════════════════════════════════════

public class InstallmentService : IInstallmentService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;
    private readonly IPostingDispatcher _dispatcher;

    public InstallmentService(
        IUnitOfWork uow,
        ICurrentTenantService tenant,
        IPostingDispatcher dispatcher)
    {
        _uow = uow;
        _tenant = tenant;
        _dispatcher = dispatcher;
    }

    public async Task<Result<InstallmentDto>> CreateAsync(CreateInstallmentRequest request)
    {
        try
        {
            var invoice = await _uow.Repository<Invoice>().Query()
                .FirstOrDefaultAsync(i =>
                    i.Id == request.InvoiceId &&
                    i.TenantId == _tenant.TenantId &&
                    !i.IsDeleted);

            if (invoice is null)
                return Result<InstallmentDto>.Failure("الفاتورة غير موجودة");

            var contact = await _uow.Repository<Contact>().Query()
                .FirstOrDefaultAsync(c =>
                    c.Id == request.ContactId &&
                    c.TenantId == _tenant.TenantId &&
                    !c.IsDeleted);

            if (contact is null)
                return Result<InstallmentDto>.Failure("العميل غير موجود");

            var totalAmount = invoice.TotalAmount;
            var remainingAmount = totalAmount - request.DownPayment;

            if (remainingAmount <= 0)
                return Result<InstallmentDto>.Failure("المبلغ المتبقي يجب أن يكون أكبر من صفر");

            if (request.NumberOfPayments <= 0)
                return Result<InstallmentDto>.Failure("عدد الأقساط يجب أن يكون أكبر من صفر");

            var paymentAmount = Math.Round(remainingAmount / request.NumberOfPayments, 2);

            var installment = new Installment
            {
                TenantId = _tenant.TenantId,
                InvoiceId = request.InvoiceId,
                ContactId = request.ContactId,
                TotalAmount = totalAmount,
                DownPayment = request.DownPayment,
                NumberOfPayments = request.NumberOfPayments,
                PaymentAmount = paymentAmount,
                StartDate = request.StartDate,
                Status = InstallmentStatus.Active
            };

            await _uow.Repository<Installment>().AddAsync(installment);
            await _uow.SaveChangesAsync();

            for (int i = 1; i <= request.NumberOfPayments; i++)
            {
                var payment = new InstallmentPayment
                {
                    InstallmentId = installment.Id,
                    PaymentNumber = i,
                    DueDate = request.StartDate.AddMonths(i),
                    Amount = paymentAmount,
                    PaidAmount = 0,
                    Status = InstallmentStatus.Active
                };
                await _uow.Repository<InstallmentPayment>().AddAsync(payment);
            }
            await _uow.SaveChangesAsync();

            var dto = await BuildInstallmentDto(installment.Id);
            return Result<InstallmentDto>.Success(dto!, "تم إنشاء التقسيط بنجاح");
        }
        catch (Exception ex)
        {
            return Result<InstallmentDto>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<List<InstallmentDto>>> GetActiveAsync()
    {
        try
        {
            var installments = await _uow.Repository<Installment>().Query()
                .Where(i =>
                    i.TenantId == _tenant.TenantId &&
                    i.Status == InstallmentStatus.Active &&
                    !i.IsDeleted)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            var dtos = new List<InstallmentDto>();
            foreach (var inst in installments)
            {
                var dto = await BuildInstallmentDto(inst.Id);
                if (dto is not null)
                    dtos.Add(dto);
            }

            return Result<List<InstallmentDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            return Result<List<InstallmentDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<bool>> RecordPaymentAsync(int installmentId, int paymentNumber, decimal amount)
    {
        try
        {
            await _uow.BeginTransactionAsync();

            var installment = await _uow.Repository<Installment>().Query()
                .FirstOrDefaultAsync(i =>
                    i.Id == installmentId &&
                    i.TenantId == _tenant.TenantId &&
                    !i.IsDeleted);

            if (installment is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<bool>.Failure("التقسيط غير موجود");
            }

            var payment = await _uow.Repository<InstallmentPayment>().Query()
                .FirstOrDefaultAsync(p =>
                    p.InstallmentId == installmentId &&
                    p.PaymentNumber == paymentNumber);

            if (payment is null)
            {
                await _uow.RollbackTransactionAsync();
                return Result<bool>.Failure("القسط غير موجود");
            }

            payment.PaidAmount += amount;
            payment.PaidDate = DateTime.UtcNow;
            payment.Status = payment.PaidAmount >= payment.Amount
                ? InstallmentStatus.Completed
                : InstallmentStatus.Active;

            _uow.Repository<InstallmentPayment>().Update(payment);

            // Check if all payments completed
            var allPayments = await _uow.Repository<InstallmentPayment>().Query()
                .Where(p => p.InstallmentId == installmentId)
                .ToListAsync();

            var currentInList = allPayments.FirstOrDefault(p => p.PaymentNumber == paymentNumber);
            if (currentInList is not null)
            {
                currentInList.PaidAmount = payment.PaidAmount;
                currentInList.Status = payment.Status;
            }

            var allCompleted = allPayments.All(p => p.PaidAmount >= p.Amount);
            if (allCompleted)
            {
                installment.Status = InstallmentStatus.Completed;
                _uow.Repository<Installment>().Update(installment);
            }

            // Update contact balance
            var contact = await _uow.Repository<Contact>().GetByIdAsync(installment.ContactId);
            if (contact is not null)
            {
                contact.Balance -= amount;
                if (contact.Balance < 0) contact.Balance = 0;
                contact.UpdatedAt = DateTime.UtcNow;
                _uow.Repository<Contact>().Update(contact);
            }

            // Create finance transaction
            var defaultAccount = await _uow.Repository<FinanceAccount>().Query()
                .FirstOrDefaultAsync(a =>
                    a.TenantId == _tenant.TenantId &&
                    a.IsActive &&
                    !a.IsDeleted);

            if (defaultAccount is not null)
            {
                var balanceBefore = defaultAccount.Balance;
                defaultAccount.Balance += amount;
                _uow.Repository<FinanceAccount>().Update(defaultAccount);

                var finTx = new FinanceTransaction
                {
                    TenantId = _tenant.TenantId,
                    AccountId = defaultAccount.Id,
                    TransactionType = TransactionType.Income,
                    Category = "أقساط",
                    Amount = amount,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = defaultAccount.Balance,
                    Description = $"قسط رقم {paymentNumber} - تقسيط #{installmentId}",
                    ReferenceType = "Installment",
                    ReferenceId = installmentId.ToString(),
                    CreatedBy = _tenant.UserId,
                    CreatedAt = DateTime.UtcNow
                };
                await _uow.Repository<FinanceTransaction>().AddAsync(finTx);
            }

            await _uow.SaveChangesAsync();
            await _uow.CommitTransactionAsync();

            // GL posting (dispatched in isolated scope).
            await _dispatcher.DispatchInstallmentPaymentAsync(payment.Id);

            return Result<bool>.Success(true, "تم تسجيل الدفعة بنجاح");
        }
        catch (Exception ex)
        {
            await _uow.RollbackTransactionAsync();
            return Result<bool>.Failure($"خطأ: {ex.Message}");
        }
    }

    public async Task<Result<List<InstallmentDto>>> GetOverdueAsync()
    {
        try
        {
            var today = DateTime.UtcNow.Date;

            var overdueInstallmentIds = await _uow.Repository<InstallmentPayment>().Query()
                .Where(p =>
                    p.DueDate < today &&
                    p.PaidAmount < p.Amount &&
                    p.Status != InstallmentStatus.Cancelled)
                .Select(p => p.InstallmentId)
                .Distinct()
                .ToListAsync();

            var installments = await _uow.Repository<Installment>().Query()
                .Where(i =>
                    i.TenantId == _tenant.TenantId &&
                    overdueInstallmentIds.Contains(i.Id) &&
                    i.Status == InstallmentStatus.Active &&
                    !i.IsDeleted)
                .ToListAsync();

            var dtos = new List<InstallmentDto>();
            foreach (var inst in installments)
            {
                var dto = await BuildInstallmentDto(inst.Id);
                if (dto is not null)
                    dtos.Add(dto);
            }

            return Result<List<InstallmentDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            return Result<List<InstallmentDto>>.Failure($"خطأ: {ex.Message}");
        }
    }

    private async Task<InstallmentDto?> BuildInstallmentDto(int installmentId)
    {
        var installment = await _uow.Repository<Installment>().Query()
            .FirstOrDefaultAsync(i => i.Id == installmentId && i.TenantId == _tenant.TenantId);

        if (installment is null) return null;

        var invoice = await _uow.Repository<Invoice>().GetByIdAsync(installment.InvoiceId);
        var contact = await _uow.Repository<Contact>().GetByIdAsync(installment.ContactId);

        var payments = await _uow.Repository<InstallmentPayment>().Query()
            .Where(p => p.InstallmentId == installmentId)
            .OrderBy(p => p.PaymentNumber)
            .ToListAsync();

        var paidTotal = installment.DownPayment + payments.Sum(p => p.PaidAmount);
        var remainingAmount = installment.TotalAmount - paidTotal;

        var paymentDtos = payments.Select(p => new InstallmentPaymentDto(
            p.Id, p.PaymentNumber, p.DueDate, p.Amount, p.PaidAmount, p.PaidDate,
            p.PaidAmount >= p.Amount ? PaymentStatus.Paid
                : p.PaidAmount > 0 ? PaymentStatus.Partial
                : PaymentStatus.Unpaid
        )).ToList();

        return new InstallmentDto(
            installment.Id,
            installment.InvoiceId,
            invoice?.InvoiceNumber ?? "",
            installment.ContactId,
            contact?.Name ?? "",
            installment.TotalAmount,
            installment.DownPayment,
            installment.NumberOfPayments,
            installment.PaymentAmount,
            paidTotal,
            remainingAmount > 0 ? remainingAmount : 0,
            installment.Status,
            paymentDtos);
    }
}

// ════════════════════════════════════════════════════════════════
// 10. DashboardService
// ════════════════════════════════════════════════════════════════

