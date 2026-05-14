using Microsoft.EntityFrameworkCore;
using Scout.Cache.Api.Domain.Entities;

namespace Scout.Cache.Api.Infrastructure;

public class CacheDbContext : DbContext
{
    public CacheDbContext(DbContextOptions<CacheDbContext> options) : base(options) { }

    public DbSet<Geocache> Geocaches => Set<Geocache>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var geocache = modelBuilder.Entity<Geocache>();

        geocache.HasKey(g => g.Id);
        geocache.Property(g => g.Name).IsRequired().HasMaxLength(200);
        geocache.Property(g => g.Description).HasMaxLength(2000);
        geocache.Property(g => g.QrCode).HasMaxLength(500);
        geocache.Property(g => g.Type).HasConversion<string>();
        geocache.Property(g => g.Status).HasConversion<string>();

        geocache.HasIndex(g => g.EventId);
        geocache.HasIndex(g => g.QrCode).IsUnique().HasFilter("\"QrCode\" IS NOT NULL");
        geocache.HasIndex(g => new { g.Latitude, g.Longitude });
    }
}
