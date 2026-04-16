using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MsCashier.API.Controllers;

/// <summary>GitHub Webhook endpoint for auto-deploy</summary>
[ApiController]
[Route("api/v1/webhook")]
[AllowAnonymous]
public class WebhookController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ILogger<WebhookController> _logger;
    private static bool _deploying;

    public WebhookController(IConfiguration config, ILogger<WebhookController> logger)
    {
        _config = config;
        _logger = logger;
    }

    [HttpPost("github")]
    public async Task<IActionResult> GitHub()
    {
        var secret = _config["Webhook:Secret"] ?? "ded6bb36135f4b332f5fbfed0031ea6a36b8d7b8";
        var deployScript = _config["Webhook:DeployScript"] ?? @"D:\Mohamed\mpos\ms-cashier\deploy\webhook\deploy.bat";

        // Read body
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync();

        // Verify signature
        var signature = Request.Headers["X-Hub-Signature-256"].FirstOrDefault();
        if (!VerifySignature(payload, signature, secret))
        {
            _logger.LogWarning("Webhook: Invalid signature");
            return Unauthorized("Invalid signature");
        }

        var ghEvent = Request.Headers["X-GitHub-Event"].FirstOrDefault();
        _logger.LogInformation("Webhook event: {Event}", ghEvent);

        if (ghEvent == "ping")
            return Ok(new { ok = true, message = "pong" });

        if (ghEvent != "push")
            return Ok(new { ok = true, message = $"ignored event: {ghEvent}" });

        // Parse push
        using var doc = JsonDocument.Parse(payload);
        var root = doc.RootElement;
        var branch = root.GetProperty("ref").GetString()?.Replace("refs/heads/", "");

        if (branch != "main")
        {
            _logger.LogInformation("Webhook: Ignoring branch {Branch}", branch);
            return Ok(new { ok = true, message = $"ignored branch: {branch}" });
        }

        var pusher = root.GetProperty("pusher").GetProperty("name").GetString();
        _logger.LogInformation("Webhook: Push to main by {Pusher}", pusher);

        if (_deploying)
        {
            _logger.LogWarning("Webhook: Deploy already in progress");
            return StatusCode(202, new { ok = false, message = "deploy already in progress" });
        }

        // Start deploy in background
        _deploying = true;
        _ = Task.Run(() =>
        {
            try
            {
                _logger.LogInformation("Webhook: Starting deploy...");
                var psi = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/c \"{deployScript}\"",
                    WorkingDirectory = Path.GetDirectoryName(deployScript),
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };
                var proc = System.Diagnostics.Process.Start(psi)!;
                proc.WaitForExit(300_000); // 5 min timeout
                var exitCode = proc.ExitCode;
                _logger.LogInformation("Webhook: Deploy finished with exit code {ExitCode}", exitCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Webhook: Deploy failed");
            }
            finally
            {
                _deploying = false;
            }
        });

        return Ok(new { ok = true, message = "deploy started" });
    }

    private static bool VerifySignature(string payload, string? signature, string secret)
    {
        if (string.IsNullOrEmpty(signature)) return false;
        var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var expected = "sha256=" + BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected),
            Encoding.UTF8.GetBytes(signature));
    }
}
