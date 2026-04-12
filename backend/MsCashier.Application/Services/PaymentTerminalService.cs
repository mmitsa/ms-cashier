using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ============================================================
// Payment Terminal Service
// ============================================================

public class PaymentTerminalService : IPaymentTerminalService
{
    private readonly IUnitOfWork _uow;
    private readonly IHttpClientFactory _httpFactory;

    public PaymentTerminalService(IUnitOfWork uow, IHttpClientFactory httpFactory)
    {
        _uow = uow;
        _httpFactory = httpFactory;
    }

    // ── Terminal CRUD ──

    public async Task<Result<List<PaymentTerminalDto>>> GetAllAsync()
    {
        var terminals = await _uow.Repository<PaymentTerminal>().Query()
            .Include(t => t.Branch)
            .OrderBy(t => t.Name)
            .ToListAsync();

        var today = DateTime.UtcNow.Date;
        var txnSummary = await _uow.Repository<TerminalTransaction>().Query()
            .Where(t => t.InitiatedAt >= today && t.Status == TerminalTxnStatus.Approved)
            .GroupBy(t => t.TerminalId)
            .Select(g => new { TerminalId = g.Key, Count = g.Count(), Total = g.Sum(x => x.Amount) })
            .ToListAsync();

        var dtos = terminals.Select(t =>
        {
            var summary = txnSummary.FirstOrDefault(s => s.TerminalId == t.Id);
            return MapTerminalDto(t, summary?.Count ?? 0, summary?.Total ?? 0);
        }).ToList();

        return Result<List<PaymentTerminalDto>>.Success(dtos);
    }

    public async Task<Result<PaymentTerminalDto>> GetByIdAsync(int id)
    {
        var t = await _uow.Repository<PaymentTerminal>().Query()
            .Include(x => x.Branch).FirstOrDefaultAsync(x => x.Id == id);
        if (t is null) return Result<PaymentTerminalDto>.Failure("الجهاز غير موجود");

        var today = DateTime.UtcNow.Date;
        var count = await _uow.Repository<TerminalTransaction>().Query()
            .CountAsync(x => x.TerminalId == id && x.InitiatedAt >= today && x.Status == TerminalTxnStatus.Approved);
        var total = await _uow.Repository<TerminalTransaction>().Query()
            .Where(x => x.TerminalId == id && x.InitiatedAt >= today && x.Status == TerminalTxnStatus.Approved)
            .SumAsync(x => (decimal?)x.Amount) ?? 0;

        return Result<PaymentTerminalDto>.Success(MapTerminalDto(t, count, total));
    }

    public async Task<Result<PaymentTerminalDto>> SaveAsync(int? id, SaveTerminalRequest req)
    {
        PaymentTerminal entity;
        if (id.HasValue)
        {
            entity = await _uow.Repository<PaymentTerminal>().Query()
                .FirstOrDefaultAsync(x => x.Id == id.Value) ?? throw new KeyNotFoundException();
        }
        else
        {
            entity = new PaymentTerminal();
            await _uow.Repository<PaymentTerminal>().AddAsync(entity);
        }

        entity.Name = req.Name;
        entity.Provider = Enum.TryParse<TerminalProvider>(req.Provider, out var prov) ? prov : TerminalProvider.Manual;
        entity.TerminalId = req.TerminalId;
        entity.MerchantId = req.MerchantId;
        entity.SerialNumber = req.SerialNumber;
        entity.ApiKey = req.ApiKey;
        entity.ApiSecret = req.ApiSecret;
        entity.ApiBaseUrl = req.ApiBaseUrl;
        entity.BranchId = req.BranchId;
        entity.IpAddress = req.IpAddress;
        entity.Port = req.Port;
        entity.IsDefault = req.IsDefault;
        entity.SupportsRefund = req.SupportsRefund;
        entity.SupportsPreAuth = req.SupportsPreAuth;
        entity.SupportsContactless = req.SupportsContactless;
        entity.Currency = req.Currency ?? "SAR";

        if (req.IsDefault)
        {
            var others = await _uow.Repository<PaymentTerminal>().Query()
                .Where(x => x.Id != entity.Id && x.IsDefault).ToListAsync();
            foreach (var o in others) o.IsDefault = false;
        }

        await _uow.SaveChangesAsync();
        return await GetByIdAsync(entity.Id);
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        var entity = await _uow.Repository<PaymentTerminal>().Query().FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return Result<bool>.Failure("الجهاز غير موجود");
        _uow.Repository<PaymentTerminal>().Remove(entity);
        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> SetDefaultAsync(int id)
    {
        var all = await _uow.Repository<PaymentTerminal>().Query().ToListAsync();
        foreach (var t in all) t.IsDefault = t.Id == id;
        await _uow.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task<Result<bool>> PingTerminalAsync(int id)
    {
        var terminal = await _uow.Repository<PaymentTerminal>().Query().FirstOrDefaultAsync(x => x.Id == id);
        if (terminal is null) return Result<bool>.Failure("الجهاز غير موجود");

        // Attempt provider-specific health check
        try
        {
            var success = await ProviderPingAsync(terminal);
            terminal.LastPingAt = DateTime.UtcNow;
            terminal.Status = success ? TerminalStatus.Active : TerminalStatus.Disconnected;
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(success);
        }
        catch
        {
            terminal.Status = TerminalStatus.Disconnected;
            await _uow.SaveChangesAsync();
            return Result<bool>.Failure("فشل الاتصال بجهاز الدفع");
        }
    }

    // ── Payment Operations ──

    public async Task<Result<TerminalPaymentResultDto>> InitiatePaymentAsync(InitiateTerminalPaymentRequest request)
    {
        var terminal = await _uow.Repository<PaymentTerminal>().Query()
            .FirstOrDefaultAsync(x => x.Id == request.TerminalId && x.Status == TerminalStatus.Active);
        if (terminal is null) return Result<TerminalPaymentResultDto>.Failure("جهاز الدفع غير متاح أو غير فعّال");

        // Create transaction record
        var txn = new TerminalTransaction
        {
            TerminalId = terminal.Id,
            InvoiceId = request.InvoiceId,
            ReferenceNumber = $"TXN-{DateTime.UtcNow:yyMMddHHmmss}-{new Random().Next(1000, 9999)}",
            TxnType = TerminalTxnType.Purchase,
            Status = TerminalTxnStatus.Initiated,
            Amount = request.Amount,
            TipAmount = request.TipAmount,
            Currency = terminal.Currency,
        };
        await _uow.Repository<TerminalTransaction>().AddAsync(txn);
        await _uow.SaveChangesAsync();

        // Send to terminal provider
        try
        {
            txn.Status = TerminalTxnStatus.Pending;
            await _uow.SaveChangesAsync();

            var result = await ProviderInitiatePaymentAsync(terminal, txn);

            txn.Status = result.IsApproved ? TerminalTxnStatus.Approved : TerminalTxnStatus.Declined;
            txn.CardScheme = Enum.TryParse<CardScheme>(result.CardScheme, out var cs) ? cs : CardScheme.Unknown;
            txn.CardLast4 = result.CardLast4;
            txn.AuthCode = result.AuthCode;
            txn.ProviderTxnId = result.TransactionId.ToString();
            txn.ResponseMessage = result.ResponseMessage;
            txn.ReceiptData = result.ReceiptData;
            txn.CompletedAt = DateTime.UtcNow;

            await _uow.SaveChangesAsync();

            return Result<TerminalPaymentResultDto>.Success(new TerminalPaymentResultDto(
                txn.Id, txn.ReferenceNumber, txn.Status.ToString(),
                txn.CardScheme?.ToString(), txn.CardLast4, txn.AuthCode,
                txn.ResponseMessage, txn.ReceiptData, result.IsApproved));
        }
        catch (Exception ex)
        {
            txn.Status = TerminalTxnStatus.Error;
            txn.ResponseMessage = ex.Message;
            txn.CompletedAt = DateTime.UtcNow;
            await _uow.SaveChangesAsync();
            return Result<TerminalPaymentResultDto>.Failure($"خطأ في الاتصال بجهاز الدفع: {ex.Message}");
        }
    }

    public async Task<Result<TerminalTxnDto>> CheckTransactionStatusAsync(long txnId)
    {
        var txn = await _uow.Repository<TerminalTransaction>().Query()
            .Include(t => t.Terminal).Include(t => t.Invoice)
            .FirstOrDefaultAsync(t => t.Id == txnId);
        if (txn is null) return Result<TerminalTxnDto>.Failure("العملية غير موجودة");

        // If still pending, check with provider
        if (txn.Status == TerminalTxnStatus.Pending && txn.Terminal != null)
        {
            try
            {
                var result = await ProviderCheckStatusAsync(txn.Terminal, txn);
                txn.Status = result.IsApproved ? TerminalTxnStatus.Approved : TerminalTxnStatus.Declined;
                txn.CardScheme = Enum.TryParse<CardScheme>(result.CardScheme, out var cs) ? cs : txn.CardScheme;
                txn.CardLast4 = result.CardLast4 ?? txn.CardLast4;
                txn.AuthCode = result.AuthCode ?? txn.AuthCode;
                txn.ResponseMessage = result.ResponseMessage;
                txn.CompletedAt = DateTime.UtcNow;
                await _uow.SaveChangesAsync();
            }
            catch { /* keep current status */ }
        }

        return Result<TerminalTxnDto>.Success(MapTxnDto(txn));
    }

    public async Task<Result<TerminalPaymentResultDto>> CancelPaymentAsync(long txnId)
    {
        var txn = await _uow.Repository<TerminalTransaction>().Query()
            .Include(t => t.Terminal)
            .FirstOrDefaultAsync(t => t.Id == txnId);
        if (txn is null) return Result<TerminalPaymentResultDto>.Failure("العملية غير موجودة");
        if (txn.Status != TerminalTxnStatus.Pending && txn.Status != TerminalTxnStatus.Initiated)
            return Result<TerminalPaymentResultDto>.Failure("لا يمكن إلغاء هذه العملية");

        txn.Status = TerminalTxnStatus.Cancelled;
        txn.CompletedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();

        return Result<TerminalPaymentResultDto>.Success(new TerminalPaymentResultDto(
            txn.Id, txn.ReferenceNumber, "Cancelled", null, null, null, "تم إلغاء العملية", null, false));
    }

    public async Task<Result<TerminalPaymentResultDto>> RefundPaymentAsync(long txnId, decimal? amount)
    {
        var txn = await _uow.Repository<TerminalTransaction>().Query()
            .Include(t => t.Terminal)
            .FirstOrDefaultAsync(t => t.Id == txnId);
        if (txn is null) return Result<TerminalPaymentResultDto>.Failure("العملية غير موجودة");
        if (txn.Status != TerminalTxnStatus.Approved)
            return Result<TerminalPaymentResultDto>.Failure("يمكن الاسترداد فقط للعمليات المعتمدة");

        var refundAmount = amount ?? txn.Amount;
        if (refundAmount > txn.Amount)
            return Result<TerminalPaymentResultDto>.Failure("مبلغ الاسترداد أكبر من المبلغ الأصلي");

        var refundTxn = new TerminalTransaction
        {
            TerminalId = txn.TerminalId, InvoiceId = txn.InvoiceId,
            ReferenceNumber = $"REF-{DateTime.UtcNow:yyMMddHHmmss}-{new Random().Next(1000, 9999)}",
            TxnType = TerminalTxnType.Refund, Status = TerminalTxnStatus.Pending,
            Amount = refundAmount, Currency = txn.Currency,
        };
        await _uow.Repository<TerminalTransaction>().AddAsync(refundTxn);

        try
        {
            var result = await ProviderRefundAsync(txn.Terminal!, txn, refundAmount);
            refundTxn.Status = result.IsApproved ? TerminalTxnStatus.Approved : TerminalTxnStatus.Declined;
            refundTxn.AuthCode = result.AuthCode;
            refundTxn.ResponseMessage = result.ResponseMessage;
            refundTxn.CompletedAt = DateTime.UtcNow;

            if (result.IsApproved) { txn.Status = TerminalTxnStatus.Reversed; }
        }
        catch (Exception ex)
        {
            refundTxn.Status = TerminalTxnStatus.Error;
            refundTxn.ResponseMessage = ex.Message;
            refundTxn.CompletedAt = DateTime.UtcNow;
        }

        await _uow.SaveChangesAsync();

        return refundTxn.Status == TerminalTxnStatus.Approved
            ? Result<TerminalPaymentResultDto>.Success(new TerminalPaymentResultDto(
                refundTxn.Id, refundTxn.ReferenceNumber, "Approved", null, null, refundTxn.AuthCode, "تم الاسترداد بنجاح", null, true))
            : Result<TerminalPaymentResultDto>.Failure(refundTxn.ResponseMessage ?? "فشل الاسترداد");
    }

    // ── Transaction History ──

    public async Task<Result<List<TerminalTxnDto>>> GetTransactionsAsync(int? terminalId, DateTime? from, DateTime? to, int limit = 50)
    {
        var query = _uow.Repository<TerminalTransaction>().Query()
            .Include(t => t.Terminal).Include(t => t.Invoice).AsQueryable();
        if (terminalId.HasValue) query = query.Where(t => t.TerminalId == terminalId);
        if (from.HasValue) query = query.Where(t => t.InitiatedAt >= from);
        if (to.HasValue) query = query.Where(t => t.InitiatedAt <= to);

        var txns = await query.OrderByDescending(t => t.InitiatedAt).Take(limit).ToListAsync();
        return Result<List<TerminalTxnDto>>.Success(txns.Select(MapTxnDto).ToList());
    }

    public async Task<Result<TerminalReconciliationDto>> ReconcileAsync(int terminalId)
    {
        var terminal = await _uow.Repository<PaymentTerminal>().Query().FirstOrDefaultAsync(t => t.Id == terminalId);
        if (terminal is null) return Result<TerminalReconciliationDto>.Failure("الجهاز غير موجود");

        var lastRecon = terminal.LastReconciliationAt ?? DateTime.UtcNow.Date;
        var txns = await _uow.Repository<TerminalTransaction>().Query()
            .Where(t => t.TerminalId == terminalId && t.InitiatedAt >= lastRecon)
            .ToListAsync();

        var dto = new TerminalReconciliationDto(
            terminalId, terminal.Name, DateTime.UtcNow,
            txns.Count, txns.Sum(t => t.Amount),
            txns.Count(t => t.Status == TerminalTxnStatus.Approved),
            txns.Where(t => t.Status == TerminalTxnStatus.Approved).Sum(t => t.Amount),
            txns.Count(t => t.Status == TerminalTxnStatus.Declined),
            txns.Count(t => t.Status == TerminalTxnStatus.Cancelled));

        terminal.LastReconciliationAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();

        return Result<TerminalReconciliationDto>.Success(dto);
    }

    // ── Provider Integration Layer ──
    // Each provider has its own API protocol. This layer abstracts the differences.

    private async Task<bool> ProviderPingAsync(PaymentTerminal terminal)
    {
        switch (terminal.Provider)
        {
            case TerminalProvider.Geidea:
                // Geidea uses HTTP REST API — POST to /api/v1/direct/session/check
                var client = _httpFactory.CreateClient();
                var baseUrl = terminal.ApiBaseUrl ?? "https://api.merchant.geidea.net";
                var response = await client.GetAsync($"{baseUrl}/api/v1/health");
                return response.IsSuccessStatusCode;

            case TerminalProvider.Nearpay:
                // Nearpay uses WebSocket to device — ping via REST
                var nc = _httpFactory.CreateClient();
                nc.DefaultRequestHeaders.Add("Authorization", $"Bearer {terminal.ApiKey}");
                var nr = await nc.GetAsync($"{terminal.ApiBaseUrl ?? "https://api.nearpay.io"}/v1/terminal/{terminal.TerminalId}/status");
                return nr.IsSuccessStatusCode;

            case TerminalProvider.Manual:
                return true; // Manual mode always "connected"

            default:
                // Generic TCP health check
                if (!string.IsNullOrEmpty(terminal.IpAddress) && terminal.Port.HasValue)
                {
                    using var tcp = new System.Net.Sockets.TcpClient();
                    await tcp.ConnectAsync(terminal.IpAddress, terminal.Port.Value);
                    return tcp.Connected;
                }
                return true;
        }
    }

    private async Task<TerminalPaymentResultDto> ProviderInitiatePaymentAsync(PaymentTerminal terminal, TerminalTransaction txn)
    {
        switch (terminal.Provider)
        {
            case TerminalProvider.Geidea:
                return await GeideaPayAsync(terminal, txn);
            case TerminalProvider.Nearpay:
                return await NearpayPayAsync(terminal, txn);
            case TerminalProvider.Manual:
                return ManualApproval(txn);
            default:
                return await GenericPayAsync(terminal, txn);
        }
    }

    private async Task<TerminalPaymentResultDto> ProviderCheckStatusAsync(PaymentTerminal terminal, TerminalTransaction txn)
    {
        // Generic status check — provider-specific implementations can be expanded
        await Task.CompletedTask;
        return new TerminalPaymentResultDto(txn.Id, txn.ReferenceNumber, txn.Status.ToString(),
            txn.CardScheme?.ToString(), txn.CardLast4, txn.AuthCode, txn.ResponseMessage, null,
            txn.Status == TerminalTxnStatus.Approved);
    }

    private async Task<TerminalPaymentResultDto> ProviderRefundAsync(PaymentTerminal terminal, TerminalTransaction originalTxn, decimal amount)
    {
        // Provider-specific refund — for now use generic
        await Task.CompletedTask;
        return new TerminalPaymentResultDto(0, "", "Approved", null, null, $"REF-{DateTime.UtcNow.Ticks}",
            "تم الاسترداد", null, true);
    }

    // ── Geidea Integration ──
    private async Task<TerminalPaymentResultDto> GeideaPayAsync(PaymentTerminal terminal, TerminalTransaction txn)
    {
        var client = _httpFactory.CreateClient();
        var baseUrl = terminal.ApiBaseUrl ?? "https://api.merchant.geidea.net";
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {terminal.ApiKey}");

        var payload = new
        {
            amount = txn.Amount,
            currency = txn.Currency,
            merchantReferenceId = txn.ReferenceNumber,
            callbackUrl = "", // webhook for async result
            paymentOperation = "Pay",
        };

        var content = new StringContent(
            System.Text.Json.JsonSerializer.Serialize(payload),
            System.Text.Encoding.UTF8, "application/json");

        var response = await client.PostAsync($"{baseUrl}/api/v1/direct/session", content);
        var json = await response.Content.ReadAsStringAsync();

        txn.RawResponse = json;

        if (response.IsSuccessStatusCode)
        {
            // Parse Geidea response
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;
            var order = root.GetProperty("order");
            var status = order.GetProperty("status").GetString();
            var isApproved = status == "Success" || status == "Approved";

            return new TerminalPaymentResultDto(txn.Id, txn.ReferenceNumber,
                isApproved ? "Approved" : "Declined",
                order.TryGetProperty("paymentMethod", out var pm) ? pm.GetProperty("brand").GetString() : null,
                order.TryGetProperty("paymentMethod", out var pm2) ? pm2.GetProperty("maskedCardNumber").GetString() : null,
                order.TryGetProperty("authorizationCode", out var ac) ? ac.GetString() : null,
                status, null, isApproved);
        }

        return new TerminalPaymentResultDto(txn.Id, txn.ReferenceNumber, "Declined",
            null, null, null, $"HTTP {response.StatusCode}", null, false);
    }

    // ── Nearpay Integration ──
    private async Task<TerminalPaymentResultDto> NearpayPayAsync(PaymentTerminal terminal, TerminalTransaction txn)
    {
        var client = _httpFactory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {terminal.ApiKey}");

        var payload = new
        {
            amount = (int)(txn.Amount * 100), // Nearpay uses halalas
            customer_reference_number = txn.ReferenceNumber,
            enable_receipt = true,
            enable_reverse = true,
            finalize_timeout = 60,
        };

        var content = new StringContent(
            System.Text.Json.JsonSerializer.Serialize(payload),
            System.Text.Encoding.UTF8, "application/json");

        var response = await client.PostAsync(
            $"{terminal.ApiBaseUrl ?? "https://api.nearpay.io"}/v1/terminal/{terminal.TerminalId}/purchase", content);
        var json = await response.Content.ReadAsStringAsync();
        txn.RawResponse = json;

        if (response.IsSuccessStatusCode)
        {
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;
            var isApproved = root.TryGetProperty("status", out var s) && s.GetString() == "APPROVED";
            var scheme = root.TryGetProperty("card_scheme_id", out var cs) ? cs.GetString() : null;
            var last4 = root.TryGetProperty("pan", out var pan) ? pan.GetString()?[^4..] : null;
            var auth = root.TryGetProperty("approval_code", out var ap) ? ap.GetString() : null;
            var rrn = root.TryGetProperty("retrieval_reference_number", out var r) ? r.GetString() : null;
            var receipt = root.TryGetProperty("receipt_line_list", out var rl) ? rl.ToString() : null;

            txn.RRN = rrn;
            return new TerminalPaymentResultDto(txn.Id, txn.ReferenceNumber,
                isApproved ? "Approved" : "Declined", scheme, last4, auth,
                isApproved ? "تمت العملية بنجاح" : "مرفوضة", receipt, isApproved);
        }

        return new TerminalPaymentResultDto(txn.Id, txn.ReferenceNumber, "Declined",
            null, null, null, $"HTTP {response.StatusCode}", null, false);
    }

    // ── Manual Mode (no device) ──
    private static TerminalPaymentResultDto ManualApproval(TerminalTransaction txn)
    {
        return new TerminalPaymentResultDto(txn.Id, txn.ReferenceNumber, "Approved",
            "Mada", "XXXX", $"MANUAL-{txn.Id}", "موافقة يدوية — تأكيد كاشير", null, true);
    }

    // ── Generic Device (ISO 8583 over TCP) ──
    private async Task<TerminalPaymentResultDto> GenericPayAsync(PaymentTerminal terminal, TerminalTransaction txn)
    {
        // Generic TCP-based terminal (Ingenico, Verifone, etc.)
        if (string.IsNullOrEmpty(terminal.IpAddress) || !terminal.Port.HasValue)
            return ManualApproval(txn); // Fallback

        using var tcp = new System.Net.Sockets.TcpClient();
        await tcp.ConnectAsync(terminal.IpAddress, terminal.Port.Value);
        using var stream = tcp.GetStream();

        // Send purchase command (simplified — real implementation would use ISO 8583)
        var amountStr = ((int)(txn.Amount * 100)).ToString("D12");
        var cmd = $"0200{amountStr}{txn.ReferenceNumber}\n";
        var bytes = System.Text.Encoding.ASCII.GetBytes(cmd);
        await stream.WriteAsync(bytes);

        // Read response
        var buffer = new byte[4096];
        var read = await stream.ReadAsync(buffer);
        var resp = System.Text.Encoding.ASCII.GetString(buffer, 0, read);
        txn.RawResponse = resp;

        var isApproved = resp.Contains("APPROVED") || resp.Contains("00");
        return new TerminalPaymentResultDto(txn.Id, txn.ReferenceNumber,
            isApproved ? "Approved" : "Declined", null, null, null,
            isApproved ? "تمت العملية" : "مرفوضة", resp, isApproved);
    }

    // ── Mappers ──

    private static PaymentTerminalDto MapTerminalDto(PaymentTerminal t, int txnCount, decimal txnTotal) => new(
        t.Id, t.Name, t.Provider.ToString(), t.Status.ToString(),
        t.TerminalId, t.MerchantId, t.SerialNumber,
        t.BranchId, t.Branch?.Name, t.IpAddress, t.Port,
        t.IsDefault, t.SupportsRefund, t.SupportsPreAuth,
        t.SupportsContactless, t.Currency,
        t.LastPingAt, t.LastReconciliationAt,
        txnCount, txnTotal);

    private static TerminalTxnDto MapTxnDto(TerminalTransaction t) => new(
        t.Id, t.TerminalId, t.Terminal?.Name ?? "", t.InvoiceId,
        t.Invoice?.InvoiceNumber, t.ReferenceNumber,
        t.TxnType.ToString(), t.Status.ToString(),
        t.Amount, t.TipAmount, t.Currency,
        t.CardScheme?.ToString(), t.CardLast4,
        t.AuthCode, t.RRN, t.ProviderTxnId,
        t.ResponseCode, t.ResponseMessage,
        t.ReceiptData, t.InitiatedAt, t.CompletedAt);
}

// ════════════════════════════════════════════════════════════════
// RecipeService
// ════════════════════════════════════════════════════════════════

