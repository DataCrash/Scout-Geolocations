namespace Scout.Identity.Api.Domain.Entities;

public class PatrulhaInvite
{
    public Guid     Id          { get; set; }
    public Guid     PatrulhaId  { get; set; }
    public string   Token       { get; set; } = string.Empty;
    public Guid     CreatedById { get; set; }
    public DateTime ExpiresAt   { get; set; }
    public bool     IsRevoked   { get; set; }

    public Patrulha Patrulha  { get; set; } = null!;
    public User     CreatedBy { get; set; } = null!;

    public bool IsValid => !IsRevoked && DateTime.UtcNow < ExpiresAt;
}
