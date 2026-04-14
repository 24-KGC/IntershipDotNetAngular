using dotnetBE.Contracts;
using dotnetBE.Services;
using Microsoft.AspNetCore.Identity;

namespace dotnetBE.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth");

        auth.MapPost("/register", Register);
        auth.MapPost("/login", Login);

        return app;
    }

    private static async Task<IResult> Register(
        RegisterRequest request,
        UserManager<IdentityUser> userManager,
        JwtTokenService tokenService)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["email"] = ["Email is required."],
                ["password"] = ["Password is required."]
            });
        }

        var existing = await userManager.FindByEmailAsync(request.Email.Trim());
        if (existing is not null)
        {
            return Results.Conflict(new { message = "Email is already registered." });
        }

        var user = new IdentityUser
        {
            UserName = request.Email.Trim(),
            Email = request.Email.Trim()
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return Results.BadRequest(new
            {
                message = "Registration failed.",
                errors = result.Errors.Select(e => e.Description)
            });
        }

        var (token, expiresAtUtc) = tokenService.CreateToken(user);
        return Results.Ok(new AuthResponse(token, user.Id, user.Email ?? string.Empty, expiresAtUtc));
    }

    private static async Task<IResult> Login(
        LoginRequest request,
        UserManager<IdentityUser> userManager,
        SignInManager<IdentityUser> signInManager,
        JwtTokenService tokenService)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["email"] = ["Email is required."],
                ["password"] = ["Password is required."]
            });
        }

        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null)
        {
            return Results.Unauthorized();
        }

        var validPassword = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
        if (!validPassword.Succeeded)
        {
            return Results.Unauthorized();
        }

        var (token, expiresAtUtc) = tokenService.CreateToken(user);
        return Results.Ok(new AuthResponse(token, user.Id, user.Email ?? string.Empty, expiresAtUtc));
    }
}