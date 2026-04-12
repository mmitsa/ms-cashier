namespace MsCashier.Domain.Common;

public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public T? Data { get; private set; }
    public string? Message { get; private set; }
    public List<string> Errors { get; private set; } = new();

    public static Result<T> Success(T data, string? message = null) =>
        new() { IsSuccess = true, Data = data, Message = message };

    public static Result<T> Failure(string error) =>
        new() { IsSuccess = false, Errors = new List<string> { error } };

    public static Result<T> Failure(List<string> errors) =>
        new() { IsSuccess = false, Errors = errors };
}
