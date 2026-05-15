using Microsoft.EntityFrameworkCore;
using Scout.Challenge.Api.Domain.Entities;

namespace Scout.Challenge.Api.Infrastructure;

public class ChallengeDbContext(DbContextOptions<ChallengeDbContext> options) : DbContext(options)
{
    public DbSet<Domain.Entities.Challenge> Challenges => Set<Domain.Entities.Challenge>();
    public DbSet<ChallengeAttempt> ChallengeAttempts => Set<ChallengeAttempt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Domain.Entities.Challenge>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Title).HasMaxLength(200).IsRequired();
            e.Property(c => c.Description).HasMaxLength(2000);
            e.Property(c => c.QrCode).HasMaxLength(500);
            e.HasIndex(c => c.EventId);
            e.HasIndex(c => c.GeocacheId);
            e.HasMany(c => c.Attempts)
             .WithOne(a => a.Challenge)
             .HasForeignKey(a => a.ChallengeId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChallengeAttempt>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.ScannedQrCode).HasMaxLength(500);
            e.Property(a => a.FailReason).HasMaxLength(500);
            e.HasIndex(a => a.PatrulhaId);
            e.HasIndex(a => a.UserId);
            e.HasIndex(a => new { a.ChallengeId, a.PatrulhaId });
        });
    }
}
