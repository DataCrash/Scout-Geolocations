# 🚀 Quick Start — Scout Geolocations

## Status Atual

✅ **Completed Phase 1** — Infrastructure & Identity Service

- Docker Compose configuration (PostgreSQL, Redis, RabbitMQ, Identity API)
- Identity Service (.NET 8) — Authentication, Patrulha management, QR Code join flow
- EF Core migrations ready to apply
- Strategic documentation (blueprint, governance, architecture)

## Prerequisites

- **Docker Desktop** — for container orchestration
- **.NET 8 SDK** — for local development
- **Git** — version control

## Getting Started

### 1. Configure Environment

```bash
cd infra
cp .env.example .env
# Edit .env with your values:
# - GOOGLE_CLIENT_ID (from Google Cloud Console)
# - JWT_KEY (generate: openssl rand -base64 32)
# - INITIAL_ADMIN_EMAIL (first user via Google OAuth)
```

### 2. Start Infrastructure

```bash
cd infra
docker compose up -d
# Verify services:
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - RabbitMQ UI: http://localhost:15672 (scout / scout_dev_pass)
```

### 3. Apply Database Migrations

```bash
cd backend/Scout.Identity.Api
dotnet ef database update
```

### 4. Run Identity Service Locally (without Docker)

```bash
cd backend/Scout.Identity.Api
dotnet run
# API: http://localhost:5001
# Swagger UI: http://localhost:5001/openapi/v1.json
```

Or via Docker (from `infra/docker-compose.yml`):
```bash
docker compose up identity-api
```

## API Endpoints

### Authentication
- `POST /auth/google` — Google OAuth token exchange
- `POST /auth/guest` — Guest login (temporary session)
- `GET /auth/me` — Current user info [auth required]

### Patrulha Management
- `POST /patrulha` — Create patrulha [auth required]
- `GET /patrulha/{id}` — Patrulha info
- `GET /patrulha/{id}/members` — List members
- `GET /patrulha/{id}/invite` — Generate QR code invite [Monitor/Submonitor only]
- `POST /patrulha/join` — Join via token [auth required]
- `PUT /patrulha/{id}/submonitor` — Assign submonitor [Monitor only]

### Admin
- `GET /admin/users` — All users [ChefesEscoteiro only]
- `PUT /admin/users/{id}/role` — Change user role [ChefesEscoteiro only]
- `GET /admin/patrulhas` — All patrulhas
- `DELETE /admin/users/{id}/location-data` — Request location deletion

## Troubleshooting

**Docker services not healthy?**
```bash
docker compose logs <service-name>
docker compose restart <service-name>
```

**Migration errors?**
```bash
# Reset database (development only)
dotnet ef database drop --force
dotnet ef database update
```

**.NET 8 not found?**
```bash
dotnet --version  # must be 8.0.x
# Download: https://dotnet.microsoft.com/download
```

## Documentation

- [BluePrint.md](BluePrint.md) — Project decisions & vision
- [docs/governance/](docs/governance/) — Principles & rules
- [docs/architecture/](docs/architecture/) — System design
- [docs/planning/](docs/planning/) — Implementation roadmap

## Next Steps

- [ ] Implement Location Service microservice
- [ ] Build mobile frontend (React Native)
- [ ] Set up CI/CD pipeline
- [ ] Deploy to staging/production
