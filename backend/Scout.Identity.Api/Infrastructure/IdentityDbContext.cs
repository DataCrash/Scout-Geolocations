using Microsoft.EntityFrameworkCore;
using Scout.Identity.Api.Domain.Entities;

namespace Scout.Identity.Api.Infrastructure;

public class IdentityDbContext(DbContextOptions<IdentityDbContext> options) : DbContext(options)
{
    public DbSet<User>           Users           => Set<User>();
    public DbSet<Patrulha>       Patrulhas       => Set<Patrulha>();
    public DbSet<PatrulhaMember> PatrulhaMembers => Set<PatrulhaMember>();
    public DbSet<PatrulhaInvite> PatrulhaInvites => Set<PatrulhaInvite>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.GoogleSub)
                .IsUnique()
                .HasFilter("\"GoogleSub\" IS NOT NULL");
            e.HasIndex(u => u.Email)
                .IsUnique()
                .HasFilter("\"Email\" IS NOT NULL");
            e.Property(u => u.Role).HasConversion<string>();
        });

        modelBuilder.Entity<Patrulha>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasOne(p => p.Monitor)
                .WithMany()
                .HasForeignKey(p => p.MonitorId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.Submonitor)
                .WithMany()
                .HasForeignKey(p => p.SubmonitorId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);
        });

        modelBuilder.Entity<PatrulhaMember>(e =>
        {
            e.HasKey(m => new { m.PatrulhaId, m.UserId });
            e.HasOne(m => m.Patrulha)
                .WithMany(p => p.Members)
                .HasForeignKey(m => m.PatrulhaId);
            e.HasOne(m => m.User)
                .WithMany(u => u.PatrulhaMembers)
                .HasForeignKey(m => m.UserId);
        });

        modelBuilder.Entity<PatrulhaInvite>(e =>
        {
            e.HasKey(i => i.Id);
            e.HasIndex(i => i.Token).IsUnique();
            e.HasOne(i => i.Patrulha)
                .WithMany(p => p.Invites)
                .HasForeignKey(i => i.PatrulhaId);
            e.HasOne(i => i.CreatedBy)
                .WithMany()
                .HasForeignKey(i => i.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
            e.Ignore(i => i.IsValid); // computed property, not persisted
        });
    }
}
