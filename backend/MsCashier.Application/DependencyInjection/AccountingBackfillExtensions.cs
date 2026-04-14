using Microsoft.Extensions.DependencyInjection;
using MsCashier.Application.Interfaces;
using MsCashier.Application.Services.Accounting;

namespace MsCashier.Application.DependencyInjection;

public static class AccountingBackfillExtensions
{
    public static IServiceCollection AddAccountingBackfill(this IServiceCollection services)
    {
        services.AddScoped<IAccountingBackfillService, AccountingBackfillService>();
        return services;
    }
}
