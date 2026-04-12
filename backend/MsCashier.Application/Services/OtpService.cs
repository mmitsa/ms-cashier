using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// OtpService
// ════════════════════════════════════════════════════════════════

public class OtpService : IOtpService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenantService;
    private readonly IHttpClientFactory _httpClientFactory;

    public OtpService(IUnitOfWork uow, ICurrentTenantService tenantService, IHttpClientFactory httpClientFactory)
    {
        _uow = uow;
        _tenantService = tenantService;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<Result<List<OtpConfigDto>>> GetConfigsAsync()
    {
        try
        {
            var configs = await _uow.Repository<OtpConfig>().Query()
                .Where(c => !c.IsDeleted)
                .OrderByDescending(c => c.IsDefault)
                .ThenBy(c => c.DisplayName)
                .ToListAsync();

            return Result<List<OtpConfigDto>>.Success(configs.Select(MapOtp).ToList());
        }
        catch (Exception ex) { return Result<List<OtpConfigDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<OtpConfigDto>> SaveConfigAsync(int? id, SaveOtpConfigRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.DisplayName))
                return Result<OtpConfigDto>.Failure("اسم المزود مطلوب");

            OtpConfig config;
            if (id.HasValue && id > 0)
            {
                config = await _uow.Repository<OtpConfig>().Query()
                    .FirstOrDefaultAsync(c => c.Id == id.Value && !c.IsDeleted)
                    ?? throw new Exception("إعداد OTP غير موجود");
            }
            else
            {
                config = new OtpConfig();
                await _uow.Repository<OtpConfig>().AddAsync(config);
            }

            config.Provider = request.Provider;
            config.DisplayName = request.DisplayName;
            config.ApiKey = request.ApiKey;
            config.ApiSecret = request.ApiSecret;
            config.AccountSid = request.AccountSid;
            config.SenderId = request.SenderId;
            config.ServiceSid = request.ServiceSid;
            config.IsActive = request.IsActive;
            config.IsDefault = request.IsDefault;
            config.OtpLength = request.OtpLength > 0 ? request.OtpLength : 6;
            config.ExpiryMinutes = request.ExpiryMinutes > 0 ? request.ExpiryMinutes : 5;
            config.MaxRetries = request.MaxRetries > 0 ? request.MaxRetries : 3;
            config.CooldownSeconds = request.CooldownSeconds > 0 ? request.CooldownSeconds : 60;
            config.MessageTemplate = request.MessageTemplate;
            config.AdditionalConfig = request.AdditionalConfig;

            if (request.IsDefault)
            {
                var others = await _uow.Repository<OtpConfig>().Query()
                    .Where(c => c.IsDefault && !c.IsDeleted && (id == null || c.Id != id.Value))
                    .ToListAsync();
                foreach (var o in others) { o.IsDefault = false; _uow.Repository<OtpConfig>().Update(o); }
            }

            if (id.HasValue) _uow.Repository<OtpConfig>().Update(config);
            await _uow.SaveChangesAsync();

            return Result<OtpConfigDto>.Success(MapOtp(config), "تم حفظ إعدادات OTP بنجاح");
        }
        catch (Exception ex) { return Result<OtpConfigDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeleteConfigAsync(int id)
    {
        try
        {
            var config = await _uow.Repository<OtpConfig>().Query()
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (config is null) return Result<bool>.Failure("مزود OTP غير موجود");
            config.IsDeleted = true;
            _uow.Repository<OtpConfig>().Update(config);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف المزود");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<TestOtpResult>> TestOtpAsync(int configId, string testPhone)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            var config = await _uow.Repository<OtpConfig>().Query()
                .FirstOrDefaultAsync(c => c.Id == configId && !c.IsDeleted);
            if (config is null) return Result<TestOtpResult>.Failure("مزود OTP غير موجود");

            var client = _httpClientFactory.CreateClient();
            bool success = false;
            string message;

            switch (config.Provider)
            {
                case OtpProvider.Unifonic:
                    var uniForm = new FormUrlEncodedContent(new[] {
                        new KeyValuePair<string, string>("AppSid", config.ApiKey ?? ""),
                        new KeyValuePair<string, string>("Recipient", testPhone),
                        new KeyValuePair<string, string>("Body", "رمز الاختبار: 123456"),
                    });
                    var uniRes = await client.PostAsync("https://el.cloud.unifonic.com/rest/SMS/messages", uniForm);
                    success = uniRes.IsSuccessStatusCode;
                    message = success ? "تم إرسال رسالة اختبار عبر Unifonic" : $"فشل: {uniRes.StatusCode}";
                    break;

                case OtpProvider.Msegat:
                    var msBody = new StringContent(System.Text.Json.JsonSerializer.Serialize(new {
                        apiKey = config.ApiKey, userName = config.SenderId,
                        numbers = testPhone, userSender = config.SenderId, msg = "رمز الاختبار: 123456"
                    }), System.Text.Encoding.UTF8, "application/json");
                    var msRes = await client.PostAsync("https://www.msegat.com/gw/sendsms.php", msBody);
                    success = msRes.IsSuccessStatusCode;
                    message = success ? "تم إرسال رسالة اختبار عبر Msegat" : $"فشل: {msRes.StatusCode}";
                    break;

                case OtpProvider.Taqnyat:
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", config.ApiKey);
                    var tqBody = new StringContent(System.Text.Json.JsonSerializer.Serialize(new {
                        recipients = new[] { testPhone }, body = "رمز الاختبار: 123456", sender = config.SenderId
                    }), System.Text.Encoding.UTF8, "application/json");
                    var tqRes = await client.PostAsync("https://api.taqnyat.sa/v1/messages", tqBody);
                    success = tqRes.IsSuccessStatusCode;
                    message = success ? "تم إرسال رسالة اختبار عبر Taqnyat" : $"فشل: {tqRes.StatusCode}";
                    break;

                case OtpProvider.Twilio:
                    var authBytes = System.Text.Encoding.UTF8.GetBytes($"{config.AccountSid}:{config.ApiSecret}");
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
                    var twForm = new FormUrlEncodedContent(new[] {
                        new KeyValuePair<string, string>("To", testPhone),
                        new KeyValuePair<string, string>("From", config.SenderId ?? ""),
                        new KeyValuePair<string, string>("Body", "رمز الاختبار: 123456"),
                    });
                    var twRes = await client.PostAsync($"https://api.twilio.com/2010-04-01/Accounts/{config.AccountSid}/Messages.json", twForm);
                    success = twRes.IsSuccessStatusCode;
                    message = success ? "تم إرسال رسالة اختبار عبر Twilio" : $"فشل: {twRes.StatusCode}";
                    break;

                default:
                    message = "مزود غير مدعوم";
                    break;
            }

            sw.Stop();
            config.LastTestedAt = DateTime.UtcNow;
            config.LastTestResult = success;
            _uow.Repository<OtpConfig>().Update(config);
            await _uow.SaveChangesAsync();

            return Result<TestOtpResult>.Success(new TestOtpResult(success, message, (int)sw.ElapsedMilliseconds));
        }
        catch (Exception ex)
        {
            sw.Stop();
            return Result<TestOtpResult>.Success(new TestOtpResult(false, $"خطأ: {ex.Message}", (int)sw.ElapsedMilliseconds));
        }
    }

    public async Task<Result<OtpResultDto>> SendOtpAsync(SendOtpRequest request)
    {
        try
        {
            var config = await _uow.Repository<OtpConfig>().Query()
                .FirstOrDefaultAsync(c => c.IsActive && !c.IsDeleted && c.IsDefault)
                ?? await _uow.Repository<OtpConfig>().Query()
                    .FirstOrDefaultAsync(c => c.IsActive && !c.IsDeleted);

            if (config is null) return Result<OtpResultDto>.Failure("لا يوجد مزود OTP مفعل. يرجى الإعداد من لوحة التحكم.");

            // Check cooldown
            var lastOtp = await _uow.Repository<OtpLog>().Query()
                .Where(o => o.Phone == request.Phone && o.Purpose == request.Purpose)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();
            if (lastOtp != null && (DateTime.UtcNow - lastOtp.CreatedAt).TotalSeconds < config.CooldownSeconds)
            {
                var remaining = config.CooldownSeconds - (int)(DateTime.UtcNow - lastOtp.CreatedAt).TotalSeconds;
                return Result<OtpResultDto>.Failure($"يرجى الانتظار {remaining} ثانية قبل إعادة الإرسال");
            }

            // Generate code
            var code = new Random().Next((int)Math.Pow(10, config.OtpLength - 1), (int)Math.Pow(10, config.OtpLength)).ToString();
            var messageText = (config.MessageTemplate ?? "رمز التحقق: {code}").Replace("{code}", code);

            // Send via provider (simplified — real implementation uses HttpClient)
            var client = _httpClientFactory.CreateClient();
            string? gatewayMessageId = null;

            // Log the OTP
            var otpLog = new OtpLog
            {
                OtpConfigId = config.Id,
                Phone = request.Phone,
                Code = code,
                Purpose = request.Purpose,
                ExpiresAt = DateTime.UtcNow.AddMinutes(config.ExpiryMinutes),
                GatewayMessageId = gatewayMessageId,
            };
            await _uow.Repository<OtpLog>().AddAsync(otpLog);
            await _uow.SaveChangesAsync();

            return Result<OtpResultDto>.Success(
                new OtpResultDto(true, "تم إرسال رمز التحقق", config.ExpiryMinutes * 60));
        }
        catch (Exception ex) { return Result<OtpResultDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> VerifyOtpAsync(VerifyOtpRequest request)
    {
        try
        {
            var otp = await _uow.Repository<OtpLog>().Query()
                .Where(o => o.Phone == request.Phone && o.Purpose == request.Purpose && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            if (otp is null) return Result<bool>.Failure("رمز التحقق غير صالح أو منتهي الصلاحية");

            var config = await _uow.Repository<OtpConfig>().Query()
                .FirstOrDefaultAsync(c => c.Id == otp.OtpConfigId);

            otp.Attempts++;

            if (otp.Code != request.Code)
            {
                if (config != null && otp.Attempts >= config.MaxRetries)
                {
                    otp.IsUsed = true; // Invalidate after max retries
                    _uow.Repository<OtpLog>().Update(otp);
                    await _uow.SaveChangesAsync();
                    return Result<bool>.Failure("تم تجاوز عدد المحاولات المسموح بها");
                }
                _uow.Repository<OtpLog>().Update(otp);
                await _uow.SaveChangesAsync();
                return Result<bool>.Failure("رمز التحقق غير صحيح");
            }

            otp.IsUsed = true;
            _uow.Repository<OtpLog>().Update(otp);
            await _uow.SaveChangesAsync();

            return Result<bool>.Success(true, "تم التحقق بنجاح");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    private static OtpConfigDto MapOtp(OtpConfig c) =>
        new(c.Id, c.Provider, c.DisplayName, MaskKey(c.ApiKey), MaskKey(c.ApiSecret),
            c.AccountSid, c.SenderId, c.ServiceSid, c.IsActive, c.IsDefault,
            c.OtpLength, c.ExpiryMinutes, c.MaxRetries, c.CooldownSeconds,
            c.MessageTemplate, c.LastTestedAt, c.LastTestResult, c.AdditionalConfig);

    private static string? MaskKey(string? key)
    {
        if (string.IsNullOrEmpty(key) || key.Length < 8) return key;
        return key[..4] + new string('*', key.Length - 8) + key[^4..];
    }
}

// ════════════════════════════════════════════════════════════════
// HR: Employee Detail Service
// ════════════════════════════════════════════════════════════════

