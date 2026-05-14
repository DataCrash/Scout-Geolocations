namespace Scout.Identity.Api.Domain.Entities;

public class Patrulha
{
    public Guid     Id           { get; set; }
    public string   Name         { get; set; } = string.Empty;
    public Guid     MonitorId    { get; set; }
    public Guid?    SubmonitorId { get; set; }
    public DateTime CreatedAt    { get; set; }

    public User                      Monitor    { get; set; } = null!;
    public User?                     Submonitor { get; set; }
    public ICollection<PatrulhaMember>  Members  { get; set; } = [];
    public ICollection<PatrulhaInvite>  Invites  { get; set; } = [];
}
