# E2E Playwright

Testes E2E TypeScript para o frontend MVP em `frontend/scout-web`.

## Comandos

```bash
cd tests/e2e
npm install
npm test
```

## Cobertura inicial

- Renderização do dashboard
- Presença do bloco de QR check-in
- Presença do painel Admin CRUD
- Presença do leaderboard

## Cobertura atual (May 15, 2026)

- Dashboard principal renderiza corretamente.
- Leaderboard responde ao fluxo de simulação local (+15).
- Check-in QR com geolocalização usa payload esperado e trata resposta de sucesso.
- Painel Admin executa ciclo de criar, recarregar, alterar status e excluir com mocks.
- Spec integrado opcional valida autenticação real (`/auth/guest` + `/auth/me`) e tentativa real de check-in sem `page.route`.
- Spec integrado opcional valida fluxo real de Patrulha:
  criação por Monitor, convite por token QR,
  entrada de integrante e nomeação de Submonitor.
- Spec integrado opcional valida check-in real determinístico com seed,
  confirma score da Patrulha e bloqueio de validação duplicada.
- Spec integrado opcional valida caminho negativo real:
  QR inválido gera tentativa falha e score permanece zerado.
- Spec integrado opcional valida CRUD admin real de desafios
  (create/list/update/delete) e bloqueio por role sem privilégios.

## Execução integrada (backend real)

Helpers compartilhados para specs integrados estão em `specs/support/real-backend.helpers.ts`.
Os preflights de autenticação dos specs reais também foram centralizados
nesse helper para reduzir duplicação e manter mensagens de diagnóstico consistentes.
Tipos comuns de resposta usados pelos specs reais também estão centralizados nele.
Mensagens padrão de skip/healthcheck dos specs reais também saem desse helper.

Use quando Identity API e Challenge API estiverem ativas localmente:

```bash
cd tests/e2e
npm run test:real:frontend
```

Para fluxo real de Identity/Patrulha:

```bash
cd tests/e2e
npm run test:real:identity
```

Para fluxo real de Admin (Challenge API):

```bash
cd tests/e2e
npm run test:real:admin
```

Para executar todos os specs com backend real:

```bash
cd tests/e2e
npm run test:real
```

Os scripts `test:real*` usam `cross-env`, funcionando da mesma forma em Windows e Unix.

Variáveis opcionais:

- `IDENTITY_API_URL` (default: `http://localhost:5001`)
- `CHALLENGE_API_URL` (default: `http://localhost:5004`)
- `REAL_E2E_CHALLENGE_ID` (default: `00000000-0000-0000-0000-000000000010`)
- `REAL_E2E_QR` (default: `QR-DEMO-001`)
- `REAL_E2E_JWT_KEY` (default: `dev_secret_key_min_32_chars_for_testing_only`)
- `REAL_E2E_JWT_ISSUER` (default: `scout-identity`)
- `REAL_E2E_JWT_AUDIENCE` (default: `scout-apps`)

Se o spec `admin-challenge-real.spec.ts` acusar rejeição de JWT (401), alinhe as variáveis ao ambiente:

- Execução local em Development (Challenge API): issuer `scout-identity`, audience `scout-apps`.
- Execução via Docker Compose deste repositório:
  issuer `scout-geolocations`, audience `scout-geolocations-client`,
  key igual a `JWT_KEY` do `.env` usado no compose.

O spec `frontend-real-backend.spec.ts` também faz preflight de autenticação
entre Identity e Challenge e pode ser pulado com instrução explícita quando
os parâmetros de JWT estiverem desalinhados entre os serviços.

O spec `identity-patrulha-real.spec.ts` inclui preflight de `/auth/guest`
e `/auth/me` e pode ser pulado com mensagem orientativa quando houver
problema de banco/JWT no serviço de Identity.

## Integração CI

- O workflow `CI (develop)` executa esta suíte via `npm test` em `tests/e2e`.
- O pipeline instala dependências do frontend e E2E e prepara Chromium do Playwright.
