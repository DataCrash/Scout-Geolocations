using Microsoft.EntityFrameworkCore;
using Scout.Cache.Api.Contracts;
using Scout.Cache.Api.Domain.Entities;
using Scout.Cache.Api.Domain.Enums;
using Scout.Cache.Api.Infrastructure;

namespace Scout.Cache.Api.Services;

public class RoteiroService
{
    private readonly CacheDbContext _db;

    public RoteiroService(CacheDbContext db)
    {
        _db = db;
    }

    public async Task<RoteiroResponse> CreateAsync(CreateRoteiroRequest req, CancellationToken ct = default)
    {
        var roteiro = new Roteiro
        {
            EventId = req.EventId,
            Name = req.Name,
            Description = req.Description,
            Sequence = req.Sequence,
            Status = RoteiroStatus.Active,
        };

        _db.Roteiros.Add(roteiro);
        await _db.SaveChangesAsync(ct);

        return ToResponse(roteiro);
    }

    public async Task<RoteiroResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var roteiro = await _db.Roteiros.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);
        return roteiro is null ? null : ToResponse(roteiro);
    }

    public async Task<IEnumerable<RoteiroResponse>> ListByEventAsync(Guid eventId, CancellationToken ct = default)
    {
        var roteiros = await _db.Roteiros
            .AsNoTracking()
            .Where(r => r.EventId == eventId)
            .OrderBy(r => r.Sequence)
            .ThenBy(r => r.Name)
            .ToListAsync(ct);

        return roteiros.Select(ToResponse);
    }

    public async Task<RoteiroResponse?> UpdateAsync(Guid id, UpdateRoteiroRequest req, CancellationToken ct = default)
    {
        var roteiro = await _db.Roteiros.FindAsync([id], ct);
        if (roteiro is null) return null;

        if (req.Name is not null) roteiro.Name = req.Name;
        if (req.Description is not null) roteiro.Description = req.Description;
        if (req.Sequence.HasValue) roteiro.Sequence = req.Sequence.Value;

        if (req.Status is not null && Enum.TryParse<RoteiroStatus>(req.Status, ignoreCase: true, out var status))
        {
            roteiro.Status = status;
        }

        roteiro.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return ToResponse(roteiro);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var roteiro = await _db.Roteiros.FindAsync([id], ct);
        if (roteiro is null) return false;

        _db.Roteiros.Remove(roteiro);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static RoteiroResponse ToResponse(Roteiro roteiro) => new(
        roteiro.Id,
        roteiro.EventId,
        roteiro.Name,
        roteiro.Description,
        roteiro.Status.ToString(),
        roteiro.Sequence,
        roteiro.CreatedAt);
}
