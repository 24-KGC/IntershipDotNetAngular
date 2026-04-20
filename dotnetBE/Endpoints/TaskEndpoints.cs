using System.Globalization;
using System.Security.Claims;
using dotnetBE.Contracts;
using dotnetBE.Data;
using dotnetBE.Models;
using Microsoft.EntityFrameworkCore;

namespace dotnetBE.Endpoints;

public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var tasks = app.MapGroup("/api/tasks").RequireAuthorization();

        tasks.MapGet("/", GetAll);
        tasks.MapGet("/{id}", GetById);
        tasks.MapPost("/", Create);
        tasks.MapPut("/{id}", Update);
        tasks.MapDelete("/{id}", Delete);

        return app;
    }

    private static async Task<IResult> GetAll(ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await db.Tasks
            .Where(t => t.OwnerUserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TaskResponse(
                t.Id,
                t.Title,
                t.Topic,
                t.DueDate.HasValue ? t.DueDate.Value.ToString("O") : string.Empty,
                t.Priority,
                t.EstimatedMinutes,
                t.ActualMinutes,
                t.Done,
                t.CreatedAt.ToString("O")))
            .ToListAsync();

        return Results.Ok(result);
    }

    private static async Task<IResult> GetById(string id, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var entity = await db.Tasks.FirstOrDefaultAsync(t => t.OwnerUserId == userId && t.Id == id);
        return entity is null ? Results.NotFound() : Results.Ok(ToResponse(entity));
    }

    private static async Task<IResult> Create(CreateTaskRequest request, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var validation = ValidateTaskInput(request.Title, request.Priority, request.EstimatedMinutes, request.ActualMinutes);
        if (validation is not null)
        {
            return validation;
        }

        if (string.IsNullOrWhiteSpace(request.Id))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["id"] = ["Task id is required."]
            });
        }

        var duplicate = await db.Tasks.AnyAsync(t => t.OwnerUserId == userId && t.Id == request.Id);
        if (duplicate)
        {
            return Results.Conflict(new { message = "Task id already exists for this user." });
        }

        var entity = new TaskItem
        {
            Id = request.Id,
            Title = request.Title.Trim(),
            Topic = request.Topic.Trim(),
            DueDate = request.DueDate,
            Priority = request.Priority,
            EstimatedMinutes = request.EstimatedMinutes,
            ActualMinutes = request.ActualMinutes,
            Done = request.Done,
            CreatedAt = ParseIsoDate(request.CreatedAt) ?? DateTimeOffset.UtcNow,
            OwnerUserId = userId
        };

        db.Tasks.Add(entity);
        await db.SaveChangesAsync();

        return Results.Created($"/api/tasks/{entity.Id}", ToResponse(entity));
    }

    private static async Task<IResult> Update(string id, UpdateTaskRequest request, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var validation = ValidateTaskInput(request.Title, request.Priority, request.EstimatedMinutes, request.ActualMinutes);
        if (validation is not null)
        {
            return validation;
        }

        var entity = await db.Tasks.FirstOrDefaultAsync(t => t.OwnerUserId == userId && t.Id == id);
        if (entity is null)
        {
            return Results.NotFound();
        }

        entity.Title = request.Title.Trim();
        entity.Topic = request.Topic.Trim();
        entity.DueDate = ParseIsoDate(request.DueDate);
        entity.Priority = request.Priority;
        entity.EstimatedMinutes = request.EstimatedMinutes;
        entity.ActualMinutes = request.ActualMinutes;
        entity.Done = request.Done;

        await db.SaveChangesAsync();
        return Results.Ok(ToResponse(entity));
    }

    private static async Task<IResult> Delete(string id, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var entity = await db.Tasks.FirstOrDefaultAsync(t => t.OwnerUserId == userId && t.Id == id);
        if (entity is null)
        {
            return Results.NotFound();
        }

        db.Tasks.Remove(entity);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static string? GetUserId(ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    private static IResult? ValidateTaskInput(string title, int priority, int estimatedMinutes, int actualMinutes)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(title))
        {
            errors["title"] = ["Title is required."];
        }

        if (priority is < 1 or > 5)
        {
            errors["priority"] = ["Priority must be between 1 and 5."];
        }

        if (estimatedMinutes < 1)
        {
            errors["estimatedMinutes"] = ["Estimated minutes must be greater than 0."];
        }
        
        if (actualMinutes < 0)
        {
            errors["actualMinutes"] = ["Actual minutes cannot be negative."];
        }

        return errors.Count > 0 ? Results.ValidationProblem(errors) : null;
    }

    private static DateTimeOffset? ParseIsoDate(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed)
            ? parsed
            : null;
    }

    private static TaskResponse ToResponse(TaskItem task)
    {
        return new TaskResponse(
            task.Id,
            task.Title,
            task.Topic,
            task.DueDate?.ToString("O") ?? string.Empty,
            task.Priority,
            task.EstimatedMinutes,
            task.ActualMinutes,
            task.Done,
            task.CreatedAt.ToString("O"));
    }
}