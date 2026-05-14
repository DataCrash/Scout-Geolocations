# Architecture

## Visão de alto nível

O sistema é uma plataforma web mobile-first (PWA) composta por módulos funcionais integrados, um painel de administração, um API Gateway e infraestrutura de suporte.

### Módulos funcionais

| Módulo | Descrição |
|---|---|
| **Geocache Quest** | Hub central: desafios geolocalizados, check-in por QR/NFC, pontuação por Patrulha. Ativo desde o MVP. |
| **SafariVision** | Validação por imagem e reconhecimento visual assistido por IA. Fase 2. |
| **Heritage Trail** | Roteiros com pontos de interesse e check-in por NFC/QR. Fases 1 e 3. |

## Componentes principais

### Backend (microserviços — .NET 9+, ASP.NET Core Minimal APIs)

| Serviço | Responsabilidade | Agregados principais | Eventos de domínio |
|---|---|---|---|
| **Identity Service** | Autenticação Google OAuth, papéis de Patrulha, QR de vínculo | `User`, `Patrulha` | `PatrulhaCreated`, `MemberJoined`, `SubmonitorAssigned` |
| **Cache Service** | CRUD e consulta geoespacial de cachés | `Geocache` | `CacheCreated`, `CacheFound` |
| **Location Service** | Rastreamento GPS e geofencing | `UserLocation` | `LocationUpdated`, `EnteredGeofence`, `ExitedGeofence` |
| **Challenge Service** | Tipos de desafio, validação e pontuação | `Challenge` | `ChallengeValidated`, `ChallengeFailed`, `ChallengeCompleted` |
| **Vision Service** | Inferência de imagem (fase 2+) | — | `ImageClassified` |
| **Social Service** | Perfis, badges e rotas (fase 4) | `UserProfile`, `Badge`, `SharedRoute` | `BadgeEarned`, `RouteShared` |

Todos os serviços se comunicam via **RabbitMQ** (self-hosted) para eventos de domínio assíncronos e via chamadas diretas ao gateway para operações síncronas.

### Frontend (SPA/PWA — React + Vite + Tailwind + shadcn/ui + Zustand)

Orientado a módulos por recurso:

```
src/
├── pages/
│   ├── CacheHunt          ← fluxo principal de caça e check-in (MVP)
│   ├── HeritageTour       ← roteiros e pontos de interesse
│   ├── CameraChallenge    ← desafios fotográficos (fase 2)
│   ├── Dashboard          ← pontuação, badges e leaderboard
│   └── Admin              ← gestão de eventos, equipes e admins
├── hooks/
│   ├── useGPS             ← Geolocation API
│   ├── useCamera          ← getUserMedia
│   ├── useNFC             ← WebNFC com fallback QR
│   └── useRealtime        ← SignalR
└── store/zustand/
    ├── useMapStore
    ├── useUserStore
    └── useCacheStore
```

### Infraestrutura

| Componente | Tecnologia | Motivo |
|---|---|---|
| Mensageria | RabbitMQ (self-hosted) | Menor custo; gratuito em ambiente local/on-prem |
| Cache geoespacial | Redis (Redis Geo) | Queries de proximidade de alta performance |
| Real-time | SignalR | Leaderboard e posições ao vivo |
| Autent. institucional | Google OAuth 2.0 | Integração com contas @escoteiros.org.br |
| ORM / Query | EF Core + Dapper | ORM para escrita; Dapper para queries otimizadas |
| Eventos de domínio | MediatR | Desacoplamento interno por serviço |
| Containerização | Docker + Docker Compose | Ambiente reproduzível sem custo de orquestração |

## Fronteiras e responsabilidades

```
[Cliente Mobile PWA]
        |
        v
[API Gateway]
        |
        +-- Identity Service    <- Google OAuth + QR de vínculo de Patrulha
        +-- Cache Service       <- Geocachés e consulta por proximidade
        +-- Location Service    <- GPS em tempo real + geofencing
        +-- Challenge Service   <- Desafios, validação, pontuação
        +-- Vision Service      <- Inferência de imagem (fase 2+)
        +-- Social Service      <- Badges, perfis, rotas (fase 4)
                |
        [Event Bus - RabbitMQ]
                |
        [Notification Service]  <- Alertas de cache próximo, badges
```

## Fluxos principais

### Fluxo 1: criação de sessão de Patrulha

1. Monitor autentica com Google (@escoteiros.org.br).
2. Sistema cria sessão de Patrulha e exibe QR Code.
3. Integrantes leem QR e entram como convidados ou com conta @escoteiros.org.br.
4. Monitor pode nomear Submonitor, que também passa a poder exibir QR de autorização.

### Fluxo 2: execução de desafio em campo

1. Participante abre o mapa com localização ativada.
2. Cache próximo é indicado por geofence ou lista de proximidade.
3. Check-in por leitura de QR Code no ponto físico.
4. Desafio é exibido (pergunta, localização, foto).
5. Resposta é submetida e validada automaticamente.
6. Pontuação atualizada; leaderboard sincronizado via SignalR.

### Fluxo 3: administração de evento

1. Chefe Escoteiro cria evento com zona urbana, roteiro e cachés.
2. Define desafios por cache, tipo e critérios de conclusão.
3. Publica evento para Patrulhas participantes.
4. Acompanha progresso em painel em tempo real.
5. Encerra evento e consolida resultados e badges.

## Princípios de design

- Modularidade por domínio com baixo acoplamento entre serviços.
- Contratos explícitos e versionados entre frontend e cada serviço.
- NFC sempre com fallback QR — nunca dependência única de hardware.
- Funcionalidades críticas do MVP independentes de IA/ML.
- PWA com capacidade offline parcial: fila de submissão local (IndexedDB) + sincronização ao reconectar.
- Menor custo total: preferência por opções self-hosted e gratuitas no MVP.

## Restrições técnicas

- **Mobile-first:** interface projetada para smartphones com tela menor que 6".
- **WebNFC limitado:** QR Code é o canal primário e confiável no MVP.
- **Privacidade de localização:** dados mínimos necessários; acessíveis somente durante evento ativo; deleção somente por Admin com auditoria.
- **Dados de menores:** nenhum dado pessoal além do necessário para identificação de Patrulha e progresso.

## Estado atual e evolução prevista

| Fase | Foco | Status |
|---|---|---|
| M1 | MVP: auth, geocache, QR, localização, admin completo | Planejado |
| M2 | Visão computacional + câmera | Não iniciado |
| M3 | NFC + offline-first | Não iniciado |
| M4 | Social + gamificação avançada | Não iniciado |
