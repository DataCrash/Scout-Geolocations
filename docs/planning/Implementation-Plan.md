# Implementation Plan

## Fase 0: alinhamento documental

- [x] `BluePrint.md` preenchido e validado.
- [x] Documentação estratégica derivada: Manifest, Constitution, Agents, Guardrails, Architecture.
- [x] `docs/README.md` atualizado com índice da documentação.
- [x] `README.md` do repositório atualizado.

---

## Fase 1 — M1: MVP Base

**Objetivo:** sistema operacional em campo com autent. de Patrulha, geocache por QR e leaderboard.

**Estimativa:** 2–3 semanas.

### Critérios de aceite

- [ ] Criação de evento com ao menos 1 roteiro e 5 cachés de teste.
- [ ] Login do Monitor via Google @escoteiros.org.br e criação de Patrulha.
- [ ] Entrada de integrantes via QR (convidado ou @escoteiros.org.br) funcionando ponta a ponta.
- [ ] Check-in e validação de desafio por QR funcionando ponta a ponta.
- [ ] Registro de pontuação e exibição de leaderboard em tempo quase real.
- [ ] Painel admin com CRUD de roteiros, cachés, desafios, equipes e gestão de Chefes.
- [ ] Logs de execução e trilha de auditoria disponíveis.

### Entregas técnicas

- Identity Service com Google OAuth e fluxo de QR de Patrulha (Monitor/Submonitor).
- Cache Service (CRUD + consulta por proximidade com Redis Geo).
- Location Service (atualização de posição + geofence básico).
- Challenge Service (QR + localização como tipos de desafio).
- Frontend: mapa, tela de caça, check-in, leaderboard e painel admin.
- Infra: Docker Compose com RabbitMQ, Redis e SignalR.

### Status incremental atual (May 15, 2026)

- [x] Challenge Service implementado com validação por QR/localização e leaderboard realtime via SignalR.
- [x] Frontend MVP com mapa, check-in QR, leaderboard e painel Admin CRUD.
- [x] Base de E2E Playwright criada e expandida para fluxos mockados de check-in e admin.
- [x] Pipeline `CI (develop)` atualizado para executar E2E do frontend.
- [x] Spec E2E integrado opt-in adicionado para autenticação real
      (`/auth/guest` + `/auth/me`) e tentativa de check-in sem mocks.
- [x] Spec E2E integrado opt-in adicionado para fluxo real de Patrulha
      (criar patrulha, gerar convite QR token, entrar na patrulha e definir submonitor).
- [ ] Fluxos ponta a ponta completos com autenticação real e backend real ainda pendentes.

---

## Fase 2 — M2: Visão Computacional

**Objetivo:** habilitar desafios fotográficos com validação automática por IA.

**Estimativa:** 2–3 semanas.

### Critérios de aceite

- [ ] Câmera ativada no cliente com captura de foto para desafio.
- [ ] Modelo básico de classificação integrado (TensorFlow.js no cliente).
- [ ] Fallback para validação manual quando confiança da inferência for baixa.
- [ ] Vision Service no backend com ONNX Runtime como opção de fallback do modelo.

### Entregas técnicas

- Componente de câmera + inferência local (TensorFlow.js).
- Vision Service básico no backend (ONNX Runtime).
- Tipo de desafio `PhotoChallenge` no Challenge Service.

---

## Fase 3 — M3: NFC + Offline-First

**Objetivo:** suporte a NFC e operação parcial sem internet durante o evento.

**Estimativa:** 1–2 semanas.

### Critérios de aceite

- [ ] WebNFC funcionando em dispositivos compatíveis como alternativa ao QR.
- [ ] Service Worker capturando submissões offline e sincronizando ao reconectar.
- [ ] Vínculo de Patrulha por NFC avaliado e documentado (POC ou decisão de pendência).

### Entregas técnicas

- Hook `useNFC` com fallback graciosa para QR.
- Service Worker + IndexedDB para fila offline.
- Sincronização de submissões pendentes ao reconectar.

---

## Fase 4 — M4: Social + Gamificação Avançada

**Objetivo:** enriquecer a experiência com badges, conquistas e compartilhamento de rotas.

**Estimativa:** 1–2 semanas.

### Critérios de aceite

- [ ] Sistema de badges com critérios configuráveis por evento.
- [ ] Leaderboard histórico entre eventos.
- [ ] Compartilhamento de rotas personalizadas.
- [ ] Social Service ativo com perfis de Patrulha.

### Entregas técnicas

- Social Service com badges e rotas compartilhadas.
- Tela de perfil de Patrulha e histórico de eventos.
- Lógica de desbloqueio de badge por evento.

---

## Convenções de trabalho

- Cada entrega deve satisfazer os critérios de aceite definidos antes de avançar de fase.
- Mudanças de escopo devem ser registradas em `BluePrint.md` e refletidas nos documentos afetados.
- A IA pode implementar, mas decisões estruturais e de privacidade exigem revisão humana.
- Commits atômicos e semânticos; branches por feature/fix alinhados ao milestone.
