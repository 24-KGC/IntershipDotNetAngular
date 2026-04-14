using System.ComponentModel.DataAnnotations;

namespace dotnetBE.Models;

public sealed class RecipeItem
{
    public long RowId { get; set; }

    [Required]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Ingredients { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Tag { get; set; } = string.Empty;

    [Range(1, 5)]
    public int Priority { get; set; }

    [Range(1, int.MaxValue)]
    public int CookTime { get; set; }

    [Range(1, int.MaxValue)]
    public int NumSteps { get; set; }

    [Required]
    public string ImageUrl { get; set; } = string.Empty;

    public bool Completed { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    [Required]
    public string OwnerUserId { get; set; } = string.Empty;
}