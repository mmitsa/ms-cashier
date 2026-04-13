namespace MsCashier.Application.DTOs;

public record SmsSettings
{
    public string Provider { get; init; } = "stub";
    public string ApiKey { get; init; } = "";
    public string SenderId { get; init; } = "MPOS";
}
