# Scout Geolocations

Sistema mobile-first de geocaching para Safari Urbano de Escoteiros, combinando geolocalização, desafios interativos e validação automatizada para grupos escoteiros em atividades urbanas.

## Sobre o projeto

O Scout Geolocations é uma plataforma web PWA que permite a Chefes Escoteiros configurar e executar eventos de Safari Urbano com:

- Desafios geolocalizados com check-in por QR Code e NFC (futuro).
- Autenticação de Patrulha via conta Google @escoteiros.org.br (Monitor) e entrada de integrantes por QR.
- Pontuação por Patrulha e leaderboard em tempo real.
- Painel admin completo para gestão de eventos, roteiros, equipes e Chefes Escoteiros.

## Módulos

| Módulo | Status | Descrição |
|---|---|---|
| Geocache Quest | M1 (planejado) | Hub central de desafios geolocalizados |
| Heritage Trail | M1+ | Roteiros com pontos de interesse e NFC |
| SafariVision | M2 | Reconhecimento visual e desafios fotográficos |
| Social & Badges | M4 | Gamificação avançada e compartilhamento |

## Stack

- **Backend:** .NET 9+, ASP.NET Core, EF Core, Dapper, MediatR, RabbitMQ, Redis, SignalR
- **Frontend:** React + Vite + Tailwind + shadcn/ui + Zustand + Leaflet
- **Infra:** Docker + Docker Compose
- **Auth:** Google OAuth 2.0 (@escoteiros.org.br)

## Documentação

- [BluePrint](BluePrint.md) — fonte primária de intenção do projeto.
- [Índice da documentação](docs/README.md) — governance, arquitetura e planejamento.
- [Architecture](docs/architecture/Architecture.md)
- [Implementation Plan](docs/planning/Implementation-Plan.md)

## Status atual

Fase 0 (alinhamento documental) concluída. Fase 1 — MVP Base em planejamento.

Se você preferir um fluxo mais rígido, pode apagar este `README.md` da raiz antes de começar a geração dos arquivos derivados do blueprint. Ainda assim, a melhor prática tende a ser substituir, e não simplesmente remover, para que a frontpage do repositório continue útil.

## Próxima tarefa esperada

Transformar o conteúdo de `BluePrint.md` em documentação estratégica do projeto, incluindo:

- `docs/governance/Manifest.md`
- `docs/governance/Constitution.md`
- `docs/governance/Agents.md`
- `docs/governance/Guardrails.md`
- `docs/architecture/Architecture.md`
- `docs/planning/Implementation-Plan.md`
- atualização deste `README.md` para a versão específica do projeto

## Sugestão prática

Trate este repositório como um starter kit de processo. O projeto real começa quando o blueprint estiver bom o suficiente para orientar documentação, decisões e implementação sem chute.
