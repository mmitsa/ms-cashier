using MsCashier.Application.DTOs;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.Application.Interfaces;

// ============================================================
// QR Config Service (store owner)
// ============================================================

public interface IQrConfigService
{
    Task<Result<List<QrConfigDto>>> GetAllAsync(string baseUrl);
    Task<Result<QrConfigDto>> SaveAsync(int? id, SaveQrConfigRequest request, string baseUrl);
    Task<Result<bool>> DeleteAsync(int id);
    Task<Result<bool>> RegenerateCodeAsync(int id);
}

// ============================================================
// Customer Order Service (public, no auth)
// ============================================================

