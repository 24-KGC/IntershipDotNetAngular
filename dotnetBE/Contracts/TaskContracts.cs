namespace dotnetBE.Contracts;

public sealed record CreateTaskRequest(
    string Id,
    string Title,
    string Topic,
    DateTimeOffset DueDate,
    int Priority,
    int EstimatedMinutes,
    int ActualMinutes,
    bool Done,
    string CreatedAt,
    DateTimeOffset? CompletedAt = null);

public sealed record UpdateTaskRequest(
    string Title,
    string Topic,
    string DueDate,
    int Priority,
    int EstimatedMinutes,
    int ActualMinutes,
    bool Done,
    DateTimeOffset? CompletedAt = null);

public sealed record TaskResponse(
    string Id,
    string Title,
    string Topic,
    string DueDate,
    int Priority,
    int EstimatedMinutes,
    int ActualMinutes,
    bool Done,
    string CreatedAt,
    DateTimeOffset? CompletedAt = null);
