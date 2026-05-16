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

- [x] Criação de evento com ao menos 1 roteiro e 5 cachés de teste.
- [x] Login do Monitor via Google @escoteiros.org.br e criação de Patrulha.
- [x] Entrada de integrantes via QR (convidado ou @escoteiros.org.br) funcionando ponta a ponta.
- [x] Check-in e validação de desafio por QR funcionando ponta a ponta.
- [x] Registro de pontuação e exibição de leaderboard em tempo quase real.
- [x] Painel admin com CRUD de roteiros, cachés, desafios, equipes e gestão de Chefes.
- [x] Logs de execução e trilha de auditoria disponíveis.

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
- [x] Login Google OAuth validado manualmente em navegador real (fora do browser embutido de automação).
- [x] Fluxo real de Patrulha via QR validado para convidado (criar patrulha, gerar invite, join e membros).
- [x] Check-in real validado em cenário positivo e negativo com score consistente (25 pontos no sucesso; 0 no QR inválido).
- [x] Base de E2E Playwright criada e expandida para fluxos mockados de check-in e admin.
- [x] Pipeline `CI (develop)` atualizado para executar E2E do frontend.
- [x] Spec E2E integrado opt-in adicionado para autenticação real
      (`/auth/guest` + `/auth/me`) e tentativa de check-in sem mocks.
- [x] Spec E2E integrado opt-in adicionado para fluxo real de Patrulha
      (criar patrulha, gerar convite QR token, entrar na patrulha e definir submonitor).
- [x] Spec E2E integrado opt-in adicionado para check-in real determinístico
      com desafio seed, validação de score e bloqueio de duplicidade.
- [x] Spec E2E integrado opt-in adicionado para caminho negativo real
      (QR inválido com tentativa falha e score da Patrulha zerado).
- [x] Spec E2E integrado opt-in adicionado para admin real da Challenge API
      (CRUD de desafios com role ChefesEscoteiro e bloqueio de role sem privilégio).
- [x] Spec E2E integrado opt-in adicionado para admin real da Identity API
      (listagem de usuários/patrulhas, alteração de role e solicitação de exclusão de dados de localização).
- [x] Spec E2E integrado opt-in adicionado para admin real da Cache API
      (CRUD de caches com role ChefesEscoteiro e bloqueio de delete sem privilégio).
- [x] Spec E2E integrado opt-in adicionado para admin real de Roteiros
      (CRUD em `/api/admin/roteiros` com role ChefesEscoteiro e bloqueio de role sem privilégio).
- [x] Suíte admin real expandida para incluir roteiros (`admin-roteiro-real.spec.ts`) no script `test:real:admin`.
- [x] Spec real de roteiros validado com sucesso em execução isolada (2 testes passados).
- [x] Hardening dos specs E2E reais concluído com preflights padronizados,
      mensagens de skip/healthcheck consistentes e tipos compartilhados em helper comum.
- [x] Falha histórica da PR #20 no CI diagnosticada (helper compartilhado ausente no run) e
      resolvida no fluxo seguinte com PR #21 e execução CI verde.
- [x] Fluxos ponta a ponta completos com autenticação real e backend real validados para encerramento do M1.

### Diretrizes transversais de stack (Roadmap)

- [ ] Adotar Zod gradualmente no frontend para validação de payloads de API, formulários e normalização de erros.
- [ ] Expandir uso de Radix UI gradualmente nos componentes de interface, priorizando acessibilidade e consistência visual.
- [ ] Ao final do roadmap, se houver áreas sem Zod/Radix, organizar força-tarefa dedicada para concluir a implantação.
- [ ] tRPC permanece fora do escopo atual com backend .NET; adotar somente se for criado um BFF em TypeScript.

### Plano de fechamento do M1 (M1-Closing)

**Objetivo:** converter o status funcional atual em aceite formal do MVP Base.

**Janela sugerida:** 1 sprint curta (3-5 dias úteis).

#### Critérios de saída do M1

- [x] Evento seed oficial disponível com pelo menos 1 roteiro e 5 caches para validação.
- [x] Fluxo real de login do Monitor via Google @escoteiros.org.br validado ponta a ponta.
- [x] Fluxo real de entrada por QR de Patrulha validado para convidado e conta @escoteiros.org.br.
- [x] Check-in real por QR validado em cenário positivo e negativo com score consistente.
- [x] Painel admin validado com cobertura de CRUD para roteiros, caches, desafios, equipes e Chefes.
- [x] Logs estruturados e trilha de auditoria mínimos documentados e verificáveis.
      Evidência: `docs/operations/Observability-Audit.md` + eventos `AUDIT` implementados nos fluxos críticos.

#### Pacotes de entrega (ordem recomendada)

1. **Dados e seed de aceite**
   - Consolidar seed determinístico de evento completo para testes de aceite (roteiro + 5 caches).
   - Publicar contrato do seed de aceite (IDs fixos e expectativas de pontuação).
2. **Autenticação real de produção piloto**
   - Validar login Google real para Monitor e sessão autenticada no frontend.
   - Registrar configuração mínima de ambiente para execução controlada do piloto.
     - [Backlog UX] Definir personalização do fluxo de login: branding da tela de consentimento OAuth
       (nome/logo/cor no Google Cloud) e evolução da página interna de pré-login no frontend.
       Observação: a tela hospedada do Google não permite customização completa de layout.
3. **Admin coverage de MVP**
   - Completar cenários E2E/admin para entidades fora de Challenge API quando aplicável.
   - Garantir matriz de permissão por role em operações críticas.
4. **Observabilidade e auditoria**
   - Definir checklist de logs obrigatórios por fluxo crítico (auth, patrulha, check-in, admin).
   - Evidenciar trilha de auditoria para ações administrativas e validações de desafio.
5. **Gate de aceite e encerramento de fase**
   - Rodar suíte E2E de aceite do M1 com evidência de resultado.
   - Emitir decisão formal de encerramento do M1 no plano e iniciar M2.

#### Gate de aceite — Decisão formal de encerramento M1

**Data:** 2026-05-15
**Resultado:** **APROVADO** — M1 encerrado.

**Evidências:**

- Suíte E2E completa: 26 passed / 0 failed / 4 skipped
  (run com todos os backends ativos; skips são serviço não disponível
  no ambiente, comportamento correto).
- Specs corrigidos e estabilizados:
  - `frontend-smoke.spec.ts` — auth-store injetado no formato Zustand persist.
  - `oauth2-google-real.spec.ts` — 11/11 passed
    (scope via URL parsing, SecurityError resolvido,
    asserts de redirect/logout robustecidos).
  - `frontend-real-backend.spec.ts` — auth-store injetado corretamente
    (substituição de `access_token` legada).
  - `admin-roteiro-real.spec.ts` — 2/2 passed (CRUD em `/api/admin/roteiros`).
- 46 eventos AUDIT estruturados em Identity, Challenge e Cache APIs (ver `docs/operations/Observability-Audit.md`).
- Todos os 6 critérios de saída do M1 marcados [x].

**Decisão:** iniciar M2 (Visão Computacional) como próxima fase ativa.

#### Riscos residuais pós-encerramento do M1

- Dependência de configuração externa para autenticação real Google em ambiente de teste.
- Lacunas potenciais de cobertura admin fora da trilha de desafios.
- Divergência entre sucesso técnico (E2E parcial) e aceite formal do MVP (critérios completos).

---

## Fase 2 — M2: Visão Computacional

**Objetivo:** habilitar desafios fotográficos com validação automática por IA.

**Estimativa:** 2–3 semanas.

### Status incremental atual (May 15, 2026)

- [x] Tipo de desafio `PhotoChallenge` adicionado no Challenge Service.
- [x] Fallback inicial de validação manual implementado (tentativas com status `Pending` + evento AUDIT `checkin.pending_manual`).
- [x] Captura de câmera no frontend implementada em modo preview (abrir câmera, capturar foto e exibir prévia local).
- [x] Payload de validação já aceita evidência fotográfica opcional (`PhotoBase64`) para evolução da inferência.
- [x] Inferência local baseline integrada com TensorFlow.js no cliente para triagem inicial da foto.
- [x] Vision Service backend criado com endpoint
      `/api/vision/analyze-photo`, fallback heurístico e caminho de
      inferência ONNX real quando modelo e labels são configurados.
- [x] E2E real adicionado para fluxo `PhotoChallenge` cobrindo criação
      admin, validação com `PhotoBase64` e retorno `Pending`.
- [x] E2E real adicionado para `Vision API` cobrindo autenticação e
      análise de foto (`/api/vision/analyze-photo`).

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
