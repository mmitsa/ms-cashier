using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// Restaurant Tables
// ============================================================

public interface ITableService
{
    Task<Result<List<TableDto>>> GetTablesAsync(int? branchId);
    Task<Result<TableDto>> GetByIdAsync(int id);
    Task<Result<TableDto>> SaveAsync(int? id, SaveTableRequest dto);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<TableDto>> UpdateStatusAsync(int id, UpdateTableStatusRequest dto);
}

// ============================================================
// Dine / Waiter Order
// ============================================================

