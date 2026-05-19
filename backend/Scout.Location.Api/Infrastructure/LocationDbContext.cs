using Microsoft.EntityFrameworkCore;
using Scout.Location.Api.Domain.Entities;

namespace Scout.Location.Api.Infrastructure;

public sealed class LocationDbContext(DbContextOptions<LocationDbContext> options) : DbContext(options)
{
    public DbSet<UserLocation> UserLocations => Set<UserLocation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.UseIdentityByDefaultColumns();

        modelBuilder.Entity<UserLocation>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(x => x.Latitude).IsRequired();
            e.Property(x => x.Longitude).IsRequired();
            e.Property(x => x.RecordedAt).IsRequired();
            e.Property(x => x.CreatedAt).HasDefaultValueSql("now()");

            // Índices
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.EventId);
            e.HasIndex(x => new { x.UserId, x.EventId });
            e.HasIndex(x => new { x.Latitude, x.Longitude });
            e.HasIndex(x => x.RecordedAt);
        });
    }
}
