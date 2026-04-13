namespace MsCashier.Application.DTOs;

public record EmailSettings
{
    public string SmtpHost { get; init; } = "smtp.gmail.com";
    public int SmtpPort { get; init; } = 587;
    public string Username { get; init; } = "";
    public string Password { get; init; } = "";
    public string FromAddress { get; init; } = "noreply@mpos.app";
    public string FromName { get; init; } = "MPOS";
    public bool EnableSsl { get; init; } = true;
}
