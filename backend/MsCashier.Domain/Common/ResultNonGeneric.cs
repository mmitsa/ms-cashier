namespace MsCashier.Domain.Common;

/// <summary>
/// Non-generic Result used when an operation has no payload to return.
/// Mirrors the shape of <see cref="Result{T}"/>.
/// </summary>
public class Result
{
    public bool IsSuccess { get; private set; }
    public string? Message { get; private set; }
    public List<string> Errors { get; private set; } = new();

    public static Result Success(string? message = null) =>
        new() { IsSuccess = true, Message = message };

    public static Result Failure(string error) =>
        new() { IsSuccess = false, Errors = new List<string> { error } };

    public static Result Failure(List<string> errors) =>
        new() { IsSuccess = false, Errors = errors };
}
