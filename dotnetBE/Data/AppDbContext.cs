using dotnetBE.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace dotnetBE.Data;

public sealed class AppDbContext : IdentityDbContext<IdentityUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<RecipeItem> Recipes => Set<RecipeItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<TaskItem>(entity =>
        {
            entity.HasKey(t => t.RowId);
            entity.HasIndex(t => new { t.OwnerUserId, t.Id }).IsUnique();
            entity.Property(t => t.CreatedAt).HasPrecision(0);
            entity.Property(t => t.DueDate).HasPrecision(0);
        });

        builder.Entity<RecipeItem>(entity =>
        {
            entity.HasKey(r => r.RowId);
            entity.HasIndex(r => new { r.OwnerUserId, r.Id }).IsUnique();
            entity.Property(r => r.CreatedAt).HasPrecision(0);
        });
    }
}
