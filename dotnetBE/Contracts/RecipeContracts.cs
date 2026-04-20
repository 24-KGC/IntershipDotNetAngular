namespace dotnetBE.Contracts;

public sealed record CreateRecipeRequest(
    string Title,
    string Ingredients,
    string Tag,
    string Description,
    int Priority,
    int CookTime,
    int NumSteps,
    string ImageUrl,
    bool Completed);

public sealed record UpdateRecipeRequest(
    string Title,
    string Ingredients,
    string Tag,
    string Description,
    int Priority,
    int CookTime,
    int NumSteps,
    string ImageUrl,
    bool Completed);

public sealed record RecipeResponse(
    string Id,
    string Title,
    string Ingredients,
    int NumIngredients,
    string Tag,
    string Description,
    int Priority,
    int CookTime,
    int NumSteps,
    bool Completed,
    string ImageUrl);