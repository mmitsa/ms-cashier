using Microsoft.EntityFrameworkCore;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services;

public class SalesRepService : ISalesRepService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;
    private readonly IAuditService _audit;

    public SalesRepService(IUnitOfWork uow, ICurrentTenantService tenant, IAuditService audit)
    {
        _uow = uow;
        _tenant = tenant;
        _audit = audit;
    }

    // ─── CRUD ───────────────────────────────────────────────

    public async Task<Result<List<SalesRepDto>>> GetAllAsync()
    {
        try
        {
            var reps = await _uow.Repository<SalesRep>().Query()
                .Include(r => r.User)
                .Include(r => r.AssignedWarehouse)
                .AsNoTracking()
                .OrderBy(r => r.Name)
                .ToListAsync();

            return Result<List<SalesRepDto>>.Success(reps.Select(MapToDto).ToList());
        }
        catch (Exception ex) { return Result<List<SalesRepDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<SalesRepDto>> GetByIdAsync(int id)
    {
        try
        {
            var rep = await _uow.Repository<SalesRep>().Query()
                .Include(r => r.User).Include(r => r.AssignedWarehouse)
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id);
            if (rep is null) return Result<SalesRepDto>.Failure("المندوب غير موجود");
            return Result<SalesRepDto>.Success(MapToDto(rep));
        }
        catch (Exception ex) { return Result<SalesRepDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<SalesRepDto>> GetByUserIdAsync(Guid userId)
    {
        try
        {
            var rep = await _uow.Repository<SalesRep>().Query()
                .Include(r => r.User).Include(r => r.AssignedWarehouse)
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.UserId == userId && !r.IsDeleted);
            if (rep is null) return Result<SalesRepDto>.Failure("لا يوجد مندوب مرتبط بهذا المستخدم");
            return Result<SalesRepDto>.Success(MapToDto(rep));
        }
        catch (Exception ex) { return Result<SalesRepDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<SalesRepDto>> CreateAsync(CreateSalesRepRequest request)
    {
        try
        {
            // Create a User account for the rep with role "SalesRep"
            var existingUser = await _uow.Repository<User>().Query()
                .AnyAsync(u => u.Username == request.Username);
            if (existingUser)
                return Result<SalesRepDto>.Failure("اسم المستخدم مستخدم بالفعل");

            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                TenantId = _tenant.TenantId,
                Username = request.Username.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName.Trim(),
                Phone = request.Phone,
                Role = "SalesRep",
                IsActive = true,
            };
            await _uow.Repository<User>().AddAsync(user);

            var rep = new SalesRep
            {
                UserId = userId,
                Name = request.FullName.Trim(),
                Phone = request.Phone,
                AssignedWarehouseId = request.AssignedWarehouseId,
                CommissionPercent = request.CommissionPercent,
                FixedBonus = request.FixedBonus,
                OutstandingBalance = 0,
                IsActive = true,
            };
            await _uow.Repository<SalesRep>().AddAsync(rep);
            await _uow.SaveChangesAsync();

            return await GetByIdAsync(rep.Id);
        }
        catch (Exception ex) { return Result<SalesRepDto>.Failure($"خطأ أثناء إنشاء المندوب: {ex.Message}"); }
    }

    public async Task<Result<SalesRepDto>> UpdateAsync(int id, UpdateSalesRepRequest request)
    {
        try
        {
            var rep = await _uow.Repository<SalesRep>().GetByIdAsync(id);
            if (rep is null) return Result<SalesRepDto>.Failure("المندوب غير موجود");

            rep.Name = request.Name.Trim();
            rep.Phone = request.Phone;
            rep.AssignedWarehouseId = request.AssignedWarehouseId;
            rep.CommissionPercent = request.CommissionPercent;
            rep.FixedBonus = request.FixedBonus;
            rep.IsActive = request.IsActive;

            _uow.Repository<SalesRep>().Update(rep);
            await _uow.SaveChangesAsync();

            return await GetByIdAsync(id);
        }
        catch (Exception ex) { return Result<SalesRepDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var rep = await _uow.Repository<SalesRep>().GetByIdAsync(id);
            if (rep is null) return Result<bool>.Failure("المندوب غير موجود");
            if (rep.OutstandingBalance != 0)
                return Result<bool>.Failure($"لا يمكن حذف المندوب — عنده رصيد معلق: {rep.OutstandingBalance:N2}");

            rep.IsDeleted = true;
            rep.IsActive = false;
            _uow.Repository<SalesRep>().Update(rep);

            // Also disable the linked User account so the rep can't log in
            var user = await _uow.Repository<User>().GetByIdAsync(rep.UserId);
            if (user is not null)
            {
                user.IsActive = false;
                _uow.Repository<User>().Update(user);
            }

            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف المندوب وتعطيل حسابه");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    // ─── LEDGER ─────────────────────────────────────────────

    public async Task<Result<List<SalesRepTransactionDto>>> GetLedgerAsync(int salesRepId, DateTime? from, DateTime? to)
    {
        try
        {
            var query = _uow.Repository<SalesRepTransaction>().Query()
                .Where(t => t.SalesRepId == salesRepId)
                .Include(t => t.Invoice)
                .AsNoTracking();

            if (from.HasValue) query = query.Where(t => t.TransactionDate >= from.Value);
            if (to.HasValue) query = query.Where(t => t.TransactionDate <= to.Value);

            var txns = await query.OrderByDescending(t => t.TransactionDate).ToListAsync();
            return Result<List<SalesRepTransactionDto>>.Success(txns.Select(MapTxn).ToList());
        }
        catch (Exception ex) { return Result<List<SalesRepTransactionDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    // ─── PAYMENT COLLECTION ─────────────────────────────────

    public async Task<Result<SalesRepTransactionDto>> CollectPaymentAsync(int salesRepId, CollectPaymentRequest request)
    {
        try
        {
            var rep = await _uow.Repository<SalesRep>().GetByIdAsync(salesRepId);
            if (rep is null) return Result<SalesRepTransactionDto>.Failure("المندوب غير موجود");

            var invoice = await _uow.Repository<Invoice>().GetByIdAsync(request.InvoiceId);
            if (invoice is null) return Result<SalesRepTransactionDto>.Failure("الفاتورة غير موجودة");
            if (invoice.SalesRepId != salesRepId)
                return Result<SalesRepTransactionDto>.Failure("هذه الفاتورة ليست مرتبطة بهذا المندوب");
            if (request.Amount <= 0)
                return Result<SalesRepTransactionDto>.Failure("المبلغ يجب أن يكون أكبر من صفر");
            if (request.Amount > invoice.DueAmount)
                return Result<SalesRepTransactionDto>.Failure($"المبلغ أكبر من المتبقي ({invoice.DueAmount:N2})");

            // Update invoice
            invoice.PaidAmount += request.Amount;
            invoice.DueAmount -= request.Amount;
            invoice.PaymentStatus = invoice.DueAmount <= 0 ? PaymentStatus.Paid : PaymentStatus.Partial;
            invoice.PaymentMethod = request.PaymentMethod;
            _uow.Repository<Invoice>().Update(invoice);

            // Update rep balance (decrease outstanding)
            rep.OutstandingBalance -= request.Amount;
            _uow.Repository<SalesRep>().Update(rep);

            // Record transaction
            var txn = new SalesRepTransaction
            {
                SalesRepId = salesRepId,
                TransactionType = SalesRepTxnType.PaymentCollected,
                Amount = -request.Amount, // negative = credit
                BalanceAfter = rep.OutstandingBalance,
                InvoiceId = request.InvoiceId,
                PaymentMethod = request.PaymentMethod,
                Notes = request.Notes,
            };
            await _uow.Repository<SalesRepTransaction>().AddAsync(txn);
            await _uow.SaveChangesAsync();

            await _audit.LogAsync("CollectPayment", "SalesRep", salesRepId.ToString(),
                newValues: $"Invoice={request.InvoiceId},Amount={request.Amount},Method={request.PaymentMethod}");
            return Result<SalesRepTransactionDto>.Success(MapTxn(txn), "تم تسجيل السداد بنجاح");
        }
        catch (Exception ex) { return Result<SalesRepTransactionDto>.Failure($"خطأ: {ex.Message}"); }
    }

    // ─── COMMISSION ─────────────────────────────────────────

    public async Task<Result<SalesRepCommissionDto>> CalculateCommissionAsync(int salesRepId, int month, int year)
    {
        try
        {
            var rep = await _uow.Repository<SalesRep>().GetByIdAsync(salesRepId);
            if (rep is null) return Result<SalesRepCommissionDto>.Failure("المندوب غير موجود");

            // Check if already calculated
            var existing = await _uow.Repository<SalesRepCommission>().Query()
                .FirstOrDefaultAsync(c => c.SalesRepId == salesRepId && c.Month == month && c.Year == year);
            if (existing is not null)
                return Result<SalesRepCommissionDto>.Success(MapCommission(existing, rep.Name));

            // Calculate: sum of paid invoices for this rep in the given month
            var startDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = startDate.AddMonths(1);

            // Calculate commission on ACTUAL collected amounts (PaidAmount), not just
            // fully-paid invoices. This way partial payments also earn commission.
            var totalPaidSales = await _uow.Repository<Invoice>().Query()
                .Where(i => i.SalesRepId == salesRepId
                         && i.InvoiceDate >= startDate
                         && i.InvoiceDate < endDate
                         && (i.PaymentStatus == PaymentStatus.Paid || i.PaymentStatus == PaymentStatus.Partial))
                .SumAsync(i => i.PaidAmount);

            var commissionAmount = totalPaidSales * rep.CommissionPercent / 100;
            var totalEarned = commissionAmount + rep.FixedBonus;

            var commission = new SalesRepCommission
            {
                SalesRepId = salesRepId,
                Month = month,
                Year = year,
                TotalPaidSales = totalPaidSales,
                CommissionPercent = rep.CommissionPercent,
                CommissionAmount = commissionAmount,
                FixedBonus = rep.FixedBonus,
                TotalEarned = totalEarned,
                PaidAmount = 0,
                Status = CommissionStatus.Pending,
            };
            await _uow.Repository<SalesRepCommission>().AddAsync(commission);
            await _uow.SaveChangesAsync();

            return Result<SalesRepCommissionDto>.Success(MapCommission(commission, rep.Name),
                $"تم احتساب عمولة {rep.Name} لشهر {month}/{year}: {totalEarned:N2}");
        }
        catch (Exception ex) { return Result<SalesRepCommissionDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<List<SalesRepCommissionDto>>> GetCommissionsAsync(int salesRepId)
    {
        try
        {
            var rep = await _uow.Repository<SalesRep>().GetByIdAsync(salesRepId);
            if (rep is null) return Result<List<SalesRepCommissionDto>>.Failure("المندوب غير موجود");

            var commissions = await _uow.Repository<SalesRepCommission>().Query()
                .Where(c => c.SalesRepId == salesRepId)
                .AsNoTracking()
                .OrderByDescending(c => c.Year).ThenByDescending(c => c.Month)
                .ToListAsync();

            return Result<List<SalesRepCommissionDto>>.Success(
                commissions.Select(c => MapCommission(c, rep.Name)).ToList());
        }
        catch (Exception ex) { return Result<List<SalesRepCommissionDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<SalesRepCommissionDto>> PayCommissionAsync(int commissionId, PayCommissionRequest request)
    {
        try
        {
            var commission = await _uow.Repository<SalesRepCommission>().GetByIdAsync(commissionId);
            if (commission is null) return Result<SalesRepCommissionDto>.Failure("سجل العمولة غير موجود");

            var remaining = commission.TotalEarned - commission.PaidAmount;
            if (request.Amount > remaining)
                return Result<SalesRepCommissionDto>.Failure($"المبلغ أكبر من المتبقي ({remaining:N2})");

            commission.PaidAmount += request.Amount;
            commission.Status = commission.PaidAmount >= commission.TotalEarned
                ? CommissionStatus.Paid : CommissionStatus.PartiallyPaid;
            commission.PaidAt = DateTime.UtcNow;
            _uow.Repository<SalesRepCommission>().Update(commission);

            // Record as transaction
            var rep = await _uow.Repository<SalesRep>().GetByIdAsync(commission.SalesRepId);
            var txn = new SalesRepTransaction
            {
                SalesRepId = commission.SalesRepId,
                TransactionType = SalesRepTxnType.CommissionPaid,
                Amount = -request.Amount,
                BalanceAfter = rep?.OutstandingBalance ?? 0,
                Notes = $"عمولة شهر {commission.Month}/{commission.Year}" + (request.Notes != null ? $" — {request.Notes}" : ""),
            };
            await _uow.Repository<SalesRepTransaction>().AddAsync(txn);
            await _uow.SaveChangesAsync();

            var repName = rep?.Name ?? "";
            await _audit.LogAsync("PayCommission", "SalesRepCommission", commissionId.ToString(),
                newValues: $"Amount={request.Amount},Rep={commission.SalesRepId}");
            return Result<SalesRepCommissionDto>.Success(MapCommission(commission, repName), "تم صرف العمولة");
        }
        catch (Exception ex) { return Result<SalesRepCommissionDto>.Failure($"خطأ: {ex.Message}"); }
    }

    // ─── SUMMARY ────────────────────────────────────────────

    public async Task<Result<SalesRepSummaryDto>> GetSummaryAsync()
    {
        try
        {
            var reps = await _uow.Repository<SalesRep>().Query().AsNoTracking().ToListAsync();
            var unpaidCommissions = await _uow.Repository<SalesRepCommission>().Query()
                .Where(c => c.Status != CommissionStatus.Paid)
                .AsNoTracking()
                .SumAsync(c => c.TotalEarned - c.PaidAmount);

            return Result<SalesRepSummaryDto>.Success(new SalesRepSummaryDto(
                reps.Count,
                reps.Count(r => r.IsActive),
                reps.Sum(r => r.OutstandingBalance),
                unpaidCommissions));
        }
        catch (Exception ex) { return Result<SalesRepSummaryDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<List<SalesRepPerformanceDto>>> GetPerformanceReportAsync(int month, int year)
    {
        try
        {
            var reps = await _uow.Repository<SalesRep>().Query()
                .Where(r => r.IsActive)
                .AsNoTracking()
                .ToListAsync();

            var startDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = startDate.AddMonths(1);

            var invoices = await _uow.Repository<Invoice>().Query()
                .Where(i => i.SalesRepId.HasValue
                          && i.InvoiceDate >= startDate
                          && i.InvoiceDate < endDate)
                .AsNoTracking()
                .ToListAsync();

            var commissions = await _uow.Repository<SalesRepCommission>().Query()
                .Where(c => c.Month == month && c.Year == year)
                .AsNoTracking()
                .ToListAsync();

            var result = reps.Select(rep =>
            {
                var repInvoices = invoices.Where(i => i.SalesRepId == rep.Id).ToList();
                var totalSales = repInvoices.Sum(i => i.TotalAmount);
                var totalCollected = repInvoices.Sum(i => i.PaidAmount);
                var collectionRate = totalSales > 0 ? Math.Round(totalCollected / totalSales * 100, 1) : 0;
                var uniqueCustomers = repInvoices.Where(i => i.ContactId.HasValue).Select(i => i.ContactId).Distinct().Count();
                var commissionEarned = commissions.Where(c => c.SalesRepId == rep.Id).Sum(c => c.TotalEarned);

                return new SalesRepPerformanceDto(
                    rep.Id, rep.Name,
                    repInvoices.Count, totalSales, totalCollected,
                    collectionRate, rep.OutstandingBalance,
                    uniqueCustomers, commissionEarned);
            }).OrderByDescending(r => r.TotalSales).ToList();

            return Result<List<SalesRepPerformanceDto>>.Success(result);
        }
        catch (Exception ex) { return Result<List<SalesRepPerformanceDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    // ─── MAPPERS ────────────────────────────────────────────

    private static SalesRepDto MapToDto(SalesRep r) => new(
        r.Id, r.UserId, r.User?.Username ?? "", r.Name, r.Phone,
        r.AssignedWarehouseId, r.AssignedWarehouse?.Name,
        r.CommissionPercent, r.FixedBonus, r.OutstandingBalance, r.IsActive);

    private static readonly Dictionary<SalesRepTxnType, string> TxnLabels = new()
    {
        [SalesRepTxnType.ItemTaken] = "بضاعة مسحوبة",
        [SalesRepTxnType.PaymentCollected] = "سداد محصّل",
        [SalesRepTxnType.CommissionPaid] = "عمولة مصروفة",
        [SalesRepTxnType.Adjustment] = "تعديل يدوي",
    };

    private static SalesRepTransactionDto MapTxn(SalesRepTransaction t) => new(
        t.Id, t.TransactionType,
        TxnLabels.GetValueOrDefault(t.TransactionType, "غير معروف"),
        t.Amount, t.BalanceAfter, t.InvoiceId, t.Invoice?.InvoiceNumber,
        t.PaymentMethod, t.TransactionDate, t.Notes);

    private static SalesRepCommissionDto MapCommission(SalesRepCommission c, string repName) => new(
        c.Id, c.SalesRepId, repName, c.Month, c.Year,
        c.TotalPaidSales, c.CommissionPercent, c.CommissionAmount,
        c.FixedBonus, c.TotalEarned, c.PaidAmount, c.Status);
}
