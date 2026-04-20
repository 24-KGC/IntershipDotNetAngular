using System.Security.Claims;
using dotnetBE.Contracts;
using dotnetBE.Data;
using dotnetBE.Models;
using Microsoft.EntityFrameworkCore;

namespace dotnetBE.Endpoints;

public static class RecipeEndpoints
{
    public static IEndpointRouteBuilder MapRecipeEndpoints(this IEndpointRouteBuilder app)
    {
        var recipes = app.MapGroup("/api/recipes").RequireAuthorization();

        recipes.MapGet("/", GetAll);
        recipes.MapPost("/", Create);
        recipes.MapGet("/{id}", GetById);
        recipes.MapPut("/{id}", Update);
        recipes.MapDelete("/{id}", Delete);

        return app;
    }

    private static async Task<IResult> GetAll(ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var recipesList = await db.Recipes
            .Where(r => r.OwnerUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var result = recipesList.Select(ToRecipeResponse).ToList();
        return Results.Ok(result);
    }

    private static async Task<IResult> Create(CreateRecipeRequest request, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var validation = ValidateRecipeInput(request.Title, request.Ingredients, request.Tag, request.Priority, request.CookTime, request.NumSteps);
        if (validation is not null)
        {
            return validation;
        }

        var entity = new RecipeItem
        {
            Id = Guid.NewGuid().ToString(),
            Title = request.Title.Trim(),
            Ingredients = request.Ingredients.Trim(),
            Tag = request.Tag.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Priority = request.Priority,
            CookTime = request.CookTime,
            NumSteps = request.NumSteps,
            ImageUrl = request.ImageUrl.Trim(),
            Completed = request.Completed,
            CreatedAt = DateTimeOffset.UtcNow,
            OwnerUserId = userId
        };

        db.Recipes.Add(entity);
        await db.SaveChangesAsync();

        return Results.Created($"/api/recipes/{entity.Id}", ToRecipeResponse(entity));
    }

    private static async Task<IResult> GetById(string id, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var entity = await db.Recipes.FirstOrDefaultAsync(r => r.OwnerUserId == userId && r.Id == id);
        return entity is null ? Results.NotFound() : Results.Ok(ToRecipeResponse(entity));
    }

    private static async Task<IResult> Update(string id, UpdateRecipeRequest request, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var validation = ValidateRecipeInput(request.Title, request.Ingredients, request.Tag, request.Priority, request.CookTime, request.NumSteps);
        if (validation is not null)
        {
            return validation;
        }

        var entity = await db.Recipes.FirstOrDefaultAsync(r => r.OwnerUserId == userId && r.Id == id);
        if (entity is null)
        {
            return Results.NotFound();
        }

        entity.Title = request.Title.Trim();
        entity.Ingredients = request.Ingredients.Trim();
        entity.Tag = request.Tag.Trim();
        entity.Description = request.Description?.Trim() ?? string.Empty;
        entity.Priority = request.Priority;
        entity.CookTime = request.CookTime;
        entity.NumSteps = request.NumSteps;
        entity.ImageUrl = request.ImageUrl.Trim();
        entity.Completed = request.Completed;

        await db.SaveChangesAsync();
        return Results.Ok(ToRecipeResponse(entity));
    }

    private static async Task<IResult> Delete(string id, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var entity = await db.Recipes.FirstOrDefaultAsync(r => r.OwnerUserId == userId && r.Id == id);
        if (entity is null)
        {
            return Results.NotFound();
        }

        db.Recipes.Remove(entity);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static string? GetUserId(ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    private static IResult? ValidateRecipeInput(string title, string ingredients, string tag, int priority, int cookTime, int numSteps)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(title))
        {
            errors["title"] = ["Recipe title is required."];
        }

        if (string.IsNullOrWhiteSpace(ingredients))
        {
            errors["ingredients"] = ["Ingredients are required."];
        }

        if (string.IsNullOrWhiteSpace(tag))
        {
            errors["tag"] = ["Tag is required."];
        }

        if (priority is < 1 or > 5)
        {
            errors["priority"] = ["Priority must be between 1 and 5."];
        }

        if (cookTime < 1)
        {
            errors["cookTime"] = ["Cook time must be greater than 0."];
        }

        if (numSteps < 1)
        {
            errors["numSteps"] = ["Number of steps must be greater than 0."];
        }

        return errors.Count > 0 ? Results.ValidationProblem(errors) : null;
    }

    private static RecipeResponse ToRecipeResponse(RecipeItem recipe)
    {
        return new RecipeResponse(
            recipe.Id,
            recipe.Title,
            recipe.Ingredients,
            CountIngredients(recipe.Ingredients),
            recipe.Tag,
            recipe.Description,
            recipe.Priority,
            recipe.CookTime,
            recipe.NumSteps,
            recipe.Completed,
            recipe.ImageUrl);
    }

    private static int CountIngredients(string ingredients)
    {
        if (string.IsNullOrWhiteSpace(ingredients))
        {
            return 0;
        }

        return ingredients.Split(new[] { ',', ';', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Length;
    }
}