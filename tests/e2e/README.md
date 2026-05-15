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

## Integração CI

- O workflow `CI (develop)` executa esta suíte via `npm test` em `tests/e2e`.
- O pipeline instala dependências do frontend e E2E e prepara Chromium do Playwright.
