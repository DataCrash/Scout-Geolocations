using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Scout.Challenge.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Challenges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    QrCode = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    RadiusMeters = table.Column<int>(type: "integer", nullable: false),
                    BasePoints = table.Column<int>(type: "integer", nullable: false),
                    BonusPoints = table.Column<int>(type: "integer", nullable: false),
                    BonusTimeSeconds = table.Column<int>(type: "integer", nullable: false),
                    GeocacheId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Challenges", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChallengeAttempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChallengeId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatrulhaId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ScannedQrCode = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    DistanceMeters = table.Column<double>(type: "double precision", nullable: true),
                    PointsAwarded = table.Column<int>(type: "integer", nullable: false),
                    FailReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AttemptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ValidatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChallengeAttempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChallengeAttempts_Challenges_ChallengeId",
                        column: x => x.ChallengeId,
                        principalTable: "Challenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChallengeAttempts_ChallengeId_PatrulhaId",
                table: "ChallengeAttempts",
                columns: new[] { "ChallengeId", "PatrulhaId" });

            migrationBuilder.CreateIndex(
                name: "IX_ChallengeAttempts_PatrulhaId",
                table: "ChallengeAttempts",
                column: "PatrulhaId");

            migrationBuilder.CreateIndex(
                name: "IX_ChallengeAttempts_UserId",
                table: "ChallengeAttempts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Challenges_EventId",
                table: "Challenges",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_Challenges_GeocacheId",
                table: "Challenges",
                column: "GeocacheId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChallengeAttempts");

            migrationBuilder.DropTable(
                name: "Challenges");
        }
    }
}
