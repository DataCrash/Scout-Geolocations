namespace Scout.Identity.Api.Domain.Entities;

public class PatrulhaMember
{
    public Guid     PatrulhaId { get; set; }
    public Guid     UserId     { get; set; }
    public DateTime JoinedAt   { get; set; }

    public Patrulha Patrulha { get; set; } = null!;
    public User     User     { get; set; } = null!;
}
