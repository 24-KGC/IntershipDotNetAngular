using System.Globalization;
using System.Security.Claims;
using System.Text;
using dotnetBE.Contracts;
using dotnetBE.Data;
using dotnetBE.Models;
using dotnetBE.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services
    .AddIdentityCore<IdentityUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddSignInManager();

var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
    ?? throw new InvalidOperationException("JWT settings are missing.");

if (string.IsNullOrWhiteSpace(jwtSettings.SecretKey) || jwtSettings.SecretKey.Length < 32)
{
    throw new InvalidOperationException("JWT secret key must be at least 32 characters long.");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddScoped<JwtTokenService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.MapGet("/", () => Results.Redirect("/swagger/index.html"));
}

app.UseStaticFiles();
app.UseHttpsRedirection();
app.UseCors("FrontendDev");
app.UseAuthentication();
app.UseAuthorization();

var auth = app.MapGroup("/api/auth");

auth.MapPost("/register", async (
    RegisterRequest request,
    UserManager<IdentityUser> userManager,
    JwtTokenService tokenService) =>
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
});

auth.MapPost("/login", async (
    LoginRequest request,
    UserManager<IdentityUser> userManager,
    SignInManager<IdentityUser> signInManager,
    JwtTokenService tokenService) =>
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
});

var tasks = app.MapGroup("/api/tasks").RequireAuthorization();

tasks.MapGet("/", async (ClaimsPrincipal user, AppDbContext db) =>
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
            t.Done,
            t.CreatedAt.ToString("O")))
        .ToListAsync();

    return Results.Ok(result);
});

tasks.MapGet("/{id}", async (string id, ClaimsPrincipal user, AppDbContext db) =>
{
    var userId = GetUserId(user);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var entity = await db.Tasks.FirstOrDefaultAsync(t => t.OwnerUserId == userId && t.Id == id);
    return entity is null ? Results.NotFound() : Results.Ok(ToResponse(entity));
});

tasks.MapPost("/", async (CreateTaskRequest request, ClaimsPrincipal user, AppDbContext db) =>
{
    var userId = GetUserId(user);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var validation = ValidateTaskInput(request.Title, request.Priority, request.EstimatedMinutes);
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
        Done = request.Done,
        CreatedAt = ParseIsoDate(request.CreatedAt) ?? DateTimeOffset.UtcNow,
        OwnerUserId = userId
    };

    db.Tasks.Add(entity);
    await db.SaveChangesAsync();

    return Results.Created($"/api/tasks/{entity.Id}", ToResponse(entity));
});

tasks.MapPut("/{id}", async (string id, UpdateTaskRequest request, ClaimsPrincipal user, AppDbContext db) =>
{
    var userId = GetUserId(user);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var validation = ValidateTaskInput(request.Title, request.Priority, request.EstimatedMinutes);
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
    entity.Done = request.Done;

    await db.SaveChangesAsync();
    return Results.Ok(ToResponse(entity));
});

tasks.MapDelete("/{id}", async (string id, ClaimsPrincipal user, AppDbContext db) =>
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
});

app.Run();

static string? GetUserId(ClaimsPrincipal user)
{
    return user.FindFirstValue(ClaimTypes.NameIdentifier);
}

static IResult? ValidateTaskInput(string title, int priority, int estimatedMinutes)
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

    return errors.Count > 0 ? Results.ValidationProblem(errors) : null;
}

static DateTimeOffset? ParseIsoDate(string value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return null;
    }

    return DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed)
        ? parsed
        : null;
}

static TaskResponse ToResponse(TaskItem task)
{
    return new TaskResponse(
        task.Id,
        task.Title,
        task.Topic,
        task.DueDate?.ToString("O") ?? string.Empty,
        task.Priority,
        task.EstimatedMinutes,
        task.Done,
        task.CreatedAt.ToString("O"));
}
