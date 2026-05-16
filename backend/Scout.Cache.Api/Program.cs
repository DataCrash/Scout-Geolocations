using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scout.Cache.Api.Endpoints;
using Scout.Cache.Api.Infrastructure;
using Scout.Cache.Api.Services;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// ── Banco de dados ────────────────────────────────────────────────────────────
builder.Services.AddDbContext<CacheDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Redis ─────────────────────────────────────────────────────────────────────
var redisConn = builder.Configuration.GetConnectionString("Redis")
    ?? throw new InvalidOperationException("Redis connection string não configurada");

builder.Services.AddSingleton<IConnectionMultiplexer>(
    ConnectionMultiplexer.Connect(redisConn));

// ── Autenticação JWT ──────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key deve ser configurado via variável de ambiente");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });

// ── Autorização ───────────────────────────────────────────────────────────────
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly",
        policy => policy.RequireClaim("role", "ChefesEscoteiro"));
});

// ── MediatR ───────────────────────────────────────────────────────────────────
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssemblyContaining<Program>());

// ── Serviços de domínio ───────────────────────────────────────────────────────
builder.Services.AddScoped<GeocacheService>();
builder.Services.AddScoped<RoteiroService>();

// ── OpenAPI / Documentação ────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
    }
    else
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        options.AddDefaultPolicy(p => p.WithOrigins(origins).AllowAnyMethod().AllowAnyHeader());
    }
});

// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Migrações automáticas em desenvolvimento ──────────────────────────────────
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<CacheDbContext>();
    var redis = scope.ServiceProvider.GetRequiredService<IConnectionMultiplexer>()
        .GetDatabase();

    var hasMigrations = db.Database.GetMigrations().Any();
    if (hasMigrations)
    {
        await db.Database.MigrateAsync();
    }
    else
    {
        // Sem migrations no projeto: garante schema consistente para seed em ambiente dev.
        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();
    }

    await DevDataSeeder.EnsureOfficialEventSeedAsync(db, redis);

    app.UseSwagger();
    app.UseSwaggerUI();
}

// ── Pipeline ──────────────────────────────────────────────────────────────────
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// ── Endpoints ─────────────────────────────────────────────────────────────────
app.MapGeocacheEndpoints();
app.MapAdminRoteiroEndpoints();

app.MapGet("/health", () => Results.Ok(new { Status = "healthy", Service = "scout-cache-api" }))
   .WithTags("Health")
   .AllowAnonymous();

await app.RunAsync();
