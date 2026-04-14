using Microsoft.Extensions.DependencyInjection;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Application.Services.Accounting;

namespace MsCashier.Application.DependencyInjection;

public static class AccountingReportsExtensions
{
    public static IServiceCollection AddAccountingReports(this IServiceCollection services)
    {
        services.AddScoped<IAccountingReportsService, AccountingReportsService>();
        return services;
    }
}
