using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Finance
public record FinanceAccountDto(int Id, string Name, AccountType AccountType, decimal Balance);
public record CreateAccountRequest(string Name, AccountType AccountType);
public record CreateTransactionRequest(int AccountId, TransactionType TransactionType, string? Category, decimal Amount, string? Description, int? ContactId = null);
public record FinanceTransactionDto(long Id, int AccountId, string AccountName, TransactionType TransactionType, string? Category, decimal Amount, decimal BalanceAfter, string? Description, DateTime CreatedAt, string CreatedByName);

