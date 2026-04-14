using Microsoft.Extensions.DependencyInjection;
using MsCashier.Application.Interfaces;
using MsCashier.Application.Interfaces.Accounting;
using MsCashier.Application.Services.Accounting;

namespace MsCashier.Application.DependencyInjection;

public static class JournalEngineExtensions
{
    public static IServiceCollection AddJournalEngine(this IServiceCollection services)
    {
        services.AddScoped<IJournalEntryService, JournalEntryService>();
        services.AddScoped<IFinanceAccountGlBridge, FinanceAccountGlBridge>();
        services.AddScoped<IPostingFailureLogger, PostingFailureLogger>();
        services.AddScoped<IOpeningBalanceImportService, OpeningBalanceImportService>();
        return services;
    }
}
