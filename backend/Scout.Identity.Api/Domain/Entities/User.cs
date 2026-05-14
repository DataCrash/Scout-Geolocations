using Scout.Identity.Api.Domain.Enums;

namespace Scout.Identity.Api.Domain.Entities;

public class User
{
    public Guid      Id        { get; set; }
    public string?   GoogleSub { get; set; }   // null para convidados
    public string    Name      { get; set; } = string.Empty;
    public string?   Email     { get; set; }   // null para convidados
    public UserRole  Role      { get; set; }
    public DateTime  CreatedAt { get; set; }

    public ICollection<PatrulhaMember> PatrulhaMembers { get; set; } = [];
}
