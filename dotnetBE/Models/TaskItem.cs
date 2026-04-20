using System.ComponentModel.DataAnnotations;

namespace dotnetBE.Models;

public sealed class TaskItem
{
    public long RowId { get; set; }

    [Required]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Topic { get; set; } = string.Empty;

    public DateTimeOffset? DueDate { get; set; }

    [Range(1, 5)]
    public int Priority { get; set; }

    [Range(1, int.MaxValue)]
    public int EstimatedMinutes { get; set; }

    public int ActualMinutes { get; set; }

    public bool Done { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    [Required]
    public string OwnerUserId { get; set; } = string.Empty;
}
