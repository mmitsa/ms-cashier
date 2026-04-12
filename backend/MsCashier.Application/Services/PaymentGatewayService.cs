using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// PaymentGatewayService
// ════════════════════════════════════════════════════════════════

public class PaymentGatewayService : IPaymentGatewayService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenantService;
    private readonly IHttpClientFactory _httpClientFactory;

    public PaymentGatewayService(IUnitOfWork uow, ICurrentTenantService tenantService, IHttpClientFactory httpClientFactory)
    {
        _uow = uow;
        _tenantService = tenantService;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<Result<List<PaymentGatewayConfigDto>>> GetConfigsAsync()
    {
        try
        {
            var configs = await _uow.Repository<PaymentGatewayConfig>().Query()
                .Where(c => !c.IsDeleted)
                .OrderByDescending(c => c.IsDefault)
                .ThenBy(c => c.DisplayName)
                .ToListAsync();

            return Result<List<PaymentGatewayConfigDto>>.Success(configs.Select(MapGateway).ToList());
        }
        catch (Exception ex) { return Result<List<PaymentGatewayConfigDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<PaymentGatewayConfigDto>> SaveConfigAsync(int? id, SavePaymentGatewayRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.DisplayName))
                return Result<PaymentGatewayConfigDto>.Failure("اسم البوابة مطلوب");

            PaymentGatewayConfig config;
            if (id.HasValue && id > 0)
            {
                config = await _uow.Repository<PaymentGatewayConfig>().Query()
                    .FirstOrDefaultAsync(c => c.Id == id.Value && !c.IsDeleted)
                    ?? throw new Exception("إعداد البوابة غير موجود");
            }
            else
            {
                config = new PaymentGatewayConfig();
                await _uow.Repository<PaymentGatewayConfig>().AddAsync(config);
            }

            config.GatewayType = request.GatewayType;
            config.DisplayName = request.DisplayName;
            config.ApiKey = request.ApiKey;
            config.SecretKey = request.SecretKey;
            config.MerchantId = request.MerchantId;
            config.PublishableKey = request.PublishableKey;
            config.WebhookSecret = request.WebhookSecret;
            config.CallbackUrl = request.CallbackUrl;
            config.IsLiveMode = request.IsLiveMode;
            config.IsActive = request.IsActive;
            config.IsDefault = request.IsDefault;
            config.CurrencyCode = request.CurrencyCode;
            config.MinAmount = request.MinAmount;
            config.MaxAmount = request.MaxAmount;
            config.AdditionalConfig = request.AdditionalConfig;

            // If set as default, unset others
            if (request.IsDefault)
            {
                var others = await _uow.Repository<PaymentGatewayConfig>().Query()
                    .Where(c => c.IsDefault && !c.IsDeleted && (id == null || c.Id != id.Value))
                    .ToListAsync();
                foreach (var o in others) { o.IsDefault = false; _uow.Repository<PaymentGatewayConfig>().Update(o); }
            }

            if (id.HasValue) _uow.Repository<PaymentGatewayConfig>().Update(config);
            await _uow.SaveChangesAsync();

            return Result<PaymentGatewayConfigDto>.Success(MapGateway(config), "تم حفظ إعدادات البوابة بنجاح");
        }
        catch (Exception ex) { return Result<PaymentGatewayConfigDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeleteConfigAsync(int id)
    {
        try
        {
            var config = await _uow.Repository<PaymentGatewayConfig>().Query()
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (config is null) return Result<bool>.Failure("البوابة غير موجودة");
            config.IsDeleted = true;
            _uow.Repository<PaymentGatewayConfig>().Update(config);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف البوابة");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<TestGatewayResult>> TestGatewayAsync(int configId)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            var config = await _uow.Repository<PaymentGatewayConfig>().Query()
                .FirstOrDefaultAsync(c => c.Id == configId && !c.IsDeleted);
            if (config is null) return Result<TestGatewayResult>.Failure("البوابة غير موجودة");

            var client = _httpClientFactory.CreateClient();
            bool success = false;
            string message;

            switch (config.GatewayType)
            {
                case PaymentGatewayType.Moyasar:
                    var baseUrl = config.IsLiveMode ? "https://api.moyasar.com" : "https://api.moyasar.com";
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                        "Basic", Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{config.SecretKey}:")));
                    var moyRes = await client.GetAsync($"{baseUrl}/v1/payments?page=1&per_page=1");
                    success = moyRes.IsSuccessStatusCode;
                    message = success ? "تم الاتصال بـ Moyasar بنجاح" : $"فشل الاتصال: {moyRes.StatusCode}";
                    break;

                case PaymentGatewayType.Tap:
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", config.SecretKey);
                    var tapRes = await client.GetAsync("https://api.tap.company/v2/charges?limit=1");
                    success = tapRes.IsSuccessStatusCode;
                    message = success ? "تم الاتصال بـ Tap بنجاح" : $"فشل الاتصال: {tapRes.StatusCode}";
                    break;

                case PaymentGatewayType.HyperPay:
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", config.ApiKey);
                    var hpUrl = config.IsLiveMode ? "https://eu-prod.oppwa.com" : "https://eu-test.oppwa.com";
                    var hpRes = await client.GetAsync($"{hpUrl}/v1/checkouts?authentication.entityId={config.MerchantId}");
                    success = hpRes.StatusCode != System.Net.HttpStatusCode.Unauthorized;
                    message = success ? "تم الاتصال بـ HyperPay بنجاح" : "فشل المصادقة: تحقق من البيانات";
                    break;

                case PaymentGatewayType.PayTabs:
                    client.DefaultRequestHeaders.Add("authorization", config.SecretKey);
                    var ptRes = await client.PostAsync("https://secure.paytabs.sa/payment/request", null);
                    success = ptRes.StatusCode != System.Net.HttpStatusCode.Unauthorized;
                    message = success ? "تم الاتصال بـ PayTabs بنجاح" : "فشل المصادقة";
                    break;

                case PaymentGatewayType.Stripe:
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", config.SecretKey);
                    var strRes = await client.GetAsync("https://api.stripe.com/v1/balance");
                    success = strRes.IsSuccessStatusCode;
                    message = success ? "تم الاتصال بـ Stripe بنجاح" : $"فشل الاتصال: {strRes.StatusCode}";
                    break;

                case PaymentGatewayType.Tabby:
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", config.SecretKey);
                    var tabRes = await client.GetAsync("https://api.tabby.ai/api/v1/merchants");
                    success = tabRes.IsSuccessStatusCode;
                    message = success ? "تم الاتصال بـ Tabby بنجاح" : $"فشل الاتصال: {tabRes.StatusCode}";
                    break;

                default:
                    message = "نوع بوابة غير مدعوم";
                    break;
            }

            sw.Stop();
            config.LastTestedAt = DateTime.UtcNow;
            config.LastTestResult = success;
            _uow.Repository<PaymentGatewayConfig>().Update(config);
            await _uow.SaveChangesAsync();

            return Result<TestGatewayResult>.Success(new TestGatewayResult(success, message, (int)sw.ElapsedMilliseconds));
        }
        catch (Exception ex)
        {
            sw.Stop();
            return Result<TestGatewayResult>.Success(new TestGatewayResult(false, $"خطأ في الاتصال: {ex.Message}", (int)sw.ElapsedMilliseconds));
        }
    }

    public async Task<Result<PaymentResultDto>> InitiatePaymentAsync(InitiatePaymentRequest request)
    {
        try
        {
            var config = await _uow.Repository<PaymentGatewayConfig>().Query()
                .FirstOrDefaultAsync(c => c.IsActive && !c.IsDeleted && c.IsDefault)
                ?? await _uow.Repository<PaymentGatewayConfig>().Query()
                    .FirstOrDefaultAsync(c => c.IsActive && !c.IsDeleted);

            if (config is null) return Result<PaymentResultDto>.Failure("لا توجد بوابة دفع مفعلة. يرجى إعداد بوابة من الإعدادات.");

            if (config.MinAmount.HasValue && request.Amount < config.MinAmount)
                return Result<PaymentResultDto>.Failure($"الحد الأدنى للدفع: {config.MinAmount} {config.CurrencyCode}");
            if (config.MaxAmount.HasValue && request.Amount > config.MaxAmount)
                return Result<PaymentResultDto>.Failure($"الحد الأقصى للدفع: {config.MaxAmount} {config.CurrencyCode}");

            var payment = new OnlinePayment
            {
                GatewayConfigId = config.Id,
                GatewayType = config.GatewayType,
                Amount = request.Amount,
                CurrencyCode = config.CurrencyCode,
                Status = OnlinePaymentStatus.Pending,
                CustomerName = request.CustomerName,
                CustomerEmail = request.CustomerEmail,
                CustomerPhone = request.CustomerPhone,
                Description = request.Description,
                InvoiceId = request.InvoiceId,
            };

            await _uow.Repository<OnlinePayment>().AddAsync(payment);
            await _uow.SaveChangesAsync();

            // Build payment URL based on gateway type
            string? paymentUrl = null;
            // The actual payment initiation with the gateway would happen here
            // For now we store the payment record — the actual gateway call depends on the SDK

            return Result<PaymentResultDto>.Success(
                new PaymentResultDto(payment.Id, paymentUrl, payment.Status, null, payment.Amount, null),
                "تم إنشاء طلب الدفع. يرجى إتمام الدفع عبر بوابة الدفع.");
        }
        catch (Exception ex) { return Result<PaymentResultDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<PaymentResultDto>> CheckPaymentStatusAsync(long paymentId)
    {
        try
        {
            var payment = await _uow.Repository<OnlinePayment>().Query()
                .FirstOrDefaultAsync(p => p.Id == paymentId);
            if (payment is null) return Result<PaymentResultDto>.Failure("المعاملة غير موجودة");

            return Result<PaymentResultDto>.Success(
                new PaymentResultDto(payment.Id, payment.PaymentUrl, payment.Status, payment.GatewayTransactionId, payment.Amount, payment.FailureReason));
        }
        catch (Exception ex) { return Result<PaymentResultDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<PaymentResultDto>> HandleCallbackAsync(string gatewayType, string transactionId, string status, string? rawBody)
    {
        try
        {
            var payment = await _uow.Repository<OnlinePayment>().Query()
                .FirstOrDefaultAsync(p => p.GatewayTransactionId == transactionId);
            if (payment is null) return Result<PaymentResultDto>.Failure("معاملة غير معروفة");

            payment.GatewayResponse = rawBody;
            var normalizedStatus = status.ToLower();
            if (normalizedStatus == "paid" || normalizedStatus == "captured" || normalizedStatus == "succeeded")
            {
                payment.Status = OnlinePaymentStatus.Paid;
                payment.PaidAt = DateTime.UtcNow;
            }
            else if (normalizedStatus == "failed" || normalizedStatus == "declined")
            {
                payment.Status = OnlinePaymentStatus.Failed;
                payment.FailureReason = rawBody;
            }
            else if (normalizedStatus == "refunded")
            {
                payment.Status = OnlinePaymentStatus.Refunded;
            }

            _uow.Repository<OnlinePayment>().Update(payment);
            await _uow.SaveChangesAsync();

            return Result<PaymentResultDto>.Success(
                new PaymentResultDto(payment.Id, null, payment.Status, payment.GatewayTransactionId, payment.Amount, payment.FailureReason));
        }
        catch (Exception ex) { return Result<PaymentResultDto>.Failure($"خطأ: {ex.Message}"); }
    }

    private static PaymentGatewayConfigDto MapGateway(PaymentGatewayConfig c) =>
        new(c.Id, c.GatewayType, c.DisplayName, MaskKey(c.ApiKey), MaskKey(c.SecretKey),
            c.MerchantId, MaskKey(c.PublishableKey), MaskKey(c.WebhookSecret), c.CallbackUrl,
            c.IsLiveMode, c.IsActive, c.IsDefault, c.CurrencyCode, c.MinAmount, c.MaxAmount,
            c.AdditionalConfig, c.LastTestedAt, c.LastTestResult);

    private static string? MaskKey(string? key)
    {
        if (string.IsNullOrEmpty(key) || key.Length < 8) return key;
        return key[..4] + new string('*', key.Length - 8) + key[^4..];
    }
}

// ════════════════════════════════════════════════════════════════
// OtpService
// ════════════════════════════════════════════════════════════════

