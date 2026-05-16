using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scout.Vision.Api.Contracts;
using Scout.Vision.Api.Services;

namespace Scout.Vision.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        var jwtKey = builder.Configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key deve ser configurado via variavel de ambiente");

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

        builder.Services.AddAuthorization();
        builder.Services.AddScoped<VisionAnalysisService>();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();
        builder.Services.AddHealthChecks();

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

        var app = builder.Build();

        app.UseSwagger();
        app.UseSwaggerUI();
        app.UseCors();
        app.UseAuthentication();
        app.UseAuthorization();

        app.MapPost("/api/vision/analyze-photo", (
            AnalyzePhotoRequest req,
            ClaimsPrincipal principal,
            VisionAnalysisService svc,
            ILogger<Program> logger) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";
            var result = svc.Analyze(req.PhotoBase64);

            logger.LogInformation(
                "AUDIT vision.photo.analyzed actorId={ActorId} engine={Engine} confidence={Confidence} requiresManualReview={RequiresManualReview}",
                actorId,
                result.Engine,
                result.Confidence,
                result.RequiresManualReview);

            return Results.Ok(result);
        })
        .RequireAuthorization()
        .WithName("AnalyzePhoto")
        .Produces<AnalyzePhotoResponse>();

        app.MapHealthChecks("/health");
        app.Run();
    }
}
