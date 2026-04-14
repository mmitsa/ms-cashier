using Microsoft.Extensions.DependencyInjection;
using MsCashier.Application.Services.Accounting.Posting;

namespace MsCashier.Application.DependencyInjection;

public static class PostingRulesExtensions
{
    public static IServiceCollection AddPostingRules(this IServiceCollection services)
    {
        services.AddScoped<AccountResolver>();
        services.AddScoped<ISalePostingService, SalePostingService>();
        services.AddScoped<IPaymentPostingService, PaymentPostingService>();
        services.AddScoped<IReceiptPostingService, ReceiptPostingService>();
        services.AddScoped<IPayrollPostingService, PayrollPostingService>();
        services.AddScoped<IInstallmentPaymentPostingService, InstallmentPaymentPostingService>();
        services.AddScoped<ICardSettlementService, CardSettlementService>();
        return services;
    }
}
