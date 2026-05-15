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

## Execução integrada (backend real)

Use quando Identity API e Challenge API estiverem ativas localmente:

```bash
cd tests/e2e
RUN_REAL_BACKEND_E2E=1 npm test -- frontend-real-backend.spec.ts
```

Variáveis opcionais:

- `IDENTITY_API_URL` (default: `http://localhost:5001`)
- `CHALLENGE_API_URL` (default: `http://localhost:5004`)
- `REAL_E2E_CHALLENGE_ID` (default: `00000000-0000-0000-0000-000000000010`)
- `REAL_E2E_PATRULHA_ID` (default: `11111111-1111-1111-1111-111111111111`)
- `REAL_E2E_QR` (default: `QR-DEMO-001`)

## Integração CI

- O workflow `CI (develop)` executa esta suíte via `npm test` em `tests/e2e`.
- O pipeline instala dependências do frontend e E2E e prepara Chromium do Playwright.
