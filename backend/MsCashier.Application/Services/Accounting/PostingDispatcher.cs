using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MsCashier.Application.Interfaces;
using MsCashier.Application.Services.Accounting.Posting;
using MsCashier.Domain.Interfaces;

namespace MsCashier.Application.Services.Accounting;

/// <summary>
/// Dispatches GL posting in an isolated DI scope so the caller's DbContext
/// is never shared with the posting pipeline. Solves the EF Core
/// "a second operation was started on this context" concurrency error.
/// </summary>
public interface IPostingDispatcher
{
    Task DispatchSaleAsync(long invoiceId, string operation = "Sale");
    Task DispatchPayrollAsync(int payrollId);
    Task DispatchFinanceTransactionAsync(long transactionId, string operation);
    Task DispatchInstallmentPaymentAsync(int paymentId);
}

public class PostingDispatcher : IPostingDispatcher
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ICurrentTenantService _tenant;
    private readonly ILogger<PostingDispatcher> _logger;

    public PostingDispatcher(IServiceScopeFactory scopeFactory, ICurrentTenantService tenant, ILogger<PostingDispatcher> logger)
    {
        _scopeFactory = scopeFactory;
        _tenant = tenant;
        _logger = logger;
    }

    public async Task DispatchSaleAsync(long invoiceId, string operation = "Sale")
    {
        await RunInScopeAsync(async (sp) =>
        {
            var svc = sp.GetRequiredService<ISalePostingService>();
            var result = await svc.PostSaleAsync(invoiceId);
            if (!result.IsSuccess)
                await LogFailureAsync(sp, "Invoice", invoiceId, operation, string.Join("; ", result.Errors));
        }, "Invoice", invoiceId, operation);
    }

    public async Task DispatchPayrollAsync(int payrollId)
    {
        await RunInScopeAsync(async (sp) =>
        {
            var svc = sp.GetRequiredService<IPayrollPostingService>();
            var result = await svc.PostPayrollRunAsync(payrollId);
            if (!result.IsSuccess)
                await LogFailureAsync(sp, "Payroll", payrollId, "PayrollRun", string.Join("; ", result.Errors));
        }, "Payroll", payrollId, "PayrollRun");
    }

    public async Task DispatchFinanceTransactionAsync(long transactionId, string operation)
    {
        await RunInScopeAsync(async (sp) =>
        {
            if (operation == "Receipt")
            {
                var svc = sp.GetRequiredService<IReceiptPostingService>();
                var result = await svc.RepostFromFinanceTransactionAsync(transactionId);
                if (!result.IsSuccess)
                    await LogFailureAsync(sp, "FinanceTransaction", transactionId, operation, string.Join("; ", result.Errors));
            }
            else
            {
                var svc = sp.GetRequiredService<IPaymentPostingService>();
                var result = await svc.RepostFromFinanceTransactionAsync(transactionId);
                if (!result.IsSuccess)
                    await LogFailureAsync(sp, "FinanceTransaction", transactionId, operation, string.Join("; ", result.Errors));
            }
        }, "FinanceTransaction", transactionId, operation);
    }

    public async Task DispatchInstallmentPaymentAsync(int paymentId)
    {
        await RunInScopeAsync(async (sp) =>
        {
            var svc = sp.GetRequiredService<IInstallmentPaymentPostingService>();
            var result = await svc.PostInstallmentPaymentAsync(paymentId);
            if (!result.IsSuccess)
                await LogFailureAsync(sp, "InstallmentPayment", paymentId, "Receipt", string.Join("; ", result.Errors));
        }, "InstallmentPayment", paymentId, "Receipt");
    }

    private async Task RunInScopeAsync(Func<IServiceProvider, Task> action, string sourceType, long sourceId, string operation)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var tenantSvc = scope.ServiceProvider.GetRequiredService<ICurrentTenantService>();
            tenantSvc.SetTenant(_tenant.TenantId, _tenant.UserId, _tenant.Role);
            await action(scope.ServiceProvider);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Posting dispatch failed: {SourceType}#{SourceId} ({Operation})", sourceType, sourceId, operation);
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var tenantSvc = scope.ServiceProvider.GetRequiredService<ICurrentTenantService>();
                tenantSvc.SetTenant(_tenant.TenantId, _tenant.UserId, _tenant.Role);
                await LogFailureAsync(scope.ServiceProvider, sourceType, sourceId, operation, ex.Message);
            }
            catch { /* best effort */ }
        }
    }

    private static async Task LogFailureAsync(IServiceProvider sp, string sourceType, long sourceId, string operation, string error)
    {
        try
        {
            var logger = sp.GetRequiredService<IPostingFailureLogger>();
            await logger.LogAsync(sourceType, sourceId, operation, error);
        }
        catch { /* best effort */ }
    }
}
