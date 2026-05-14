# Constitution

## 1. Regras obrigatórias

- `BluePrint.md` é a fonte primária de intenção. Nenhuma decisão arquitetural, de escopo ou de stack pode contradizê-lo sem registro explícito de alteração com data e justificativa.
- Toda mudança de comportamento deve ter critério de aceite documentado antes de ser implementada.
- Dados de localização e dados de menores exigem revisão humana obrigatória antes de qualquer alteração em armazenamento, expiração ou acesso.
- Funcionalidades críticas do MVP não podem depender de IA/ML para operar.
- Decisões de infraestrutura devem priorizar menor custo total, preferindo opções gratuitas quando não comprometerem uso, segurança ou manutenção.

## 2. Regras de arquitetura de código

- Modularidade por domínio: cada serviço de backend tem responsabilidade única e clara (Cache, Location, Challenge, Vision, Social, Identity).
- Contratos explícitos entre frontend e backend: APIs versionadas, schemas documentados em `contracts/`.
- Event-driven para eventos de domínio relevantes (ex.: `CacheFound`, `ChallengeValidated`, `BadgeEarned`, `MemberJoined`).
- NFC sempre com fallback por QR Code — nunca obrigatório como único mecanismo.
- Fluxo de vínculo de Patrulha: pelo menos 1 integrante autenticado via @escoteiros.org.br; demais podem ser convidados vinculados por QR do Monitor ou Submonitor.

## 3. Regras de entrega

- Incrementos pequenos e verificáveis: cada entrega deve ser testável isoladamente.
- Versionamento semântico para APIs e contratos.
- Documentação atualizada junto com cada mudança de comportamento, decisão ou contrato relevante.
- Milestones com critérios de aceite explícitos, conforme definido no `Implementation-Plan.md`.
- Commits atômicos e semânticos; branches por feature/fix alinhados ao milestone.
- Fluxo de versionamento obrigatório em GitFlow com política Forward-Only.
- Forward-Only: proibido reescrever histórico (`rebase`, `reset --hard`, `revert`), exceto com aprovação humana explícita.
- Fluxo mínimo obrigatório:
  - `feature/*` e `bugfix/*` sempre partem de `develop` e retornam por PR para `develop`.
  - `release/x.x.x` parte de `develop`, promove para `master` por PR e depois sincroniza `master` -> `develop` por PR.
  - `hotfix/*` parte de `master`, promove para `master` por PR e depois sincroniza `master` -> `develop` por PR.

## 4. Regras de validação

- Check-in de desafio: basta 1 integrante da Patrulha registrar para a Patrulha ser considerada concluída (padrão configurável por Chefe Escoteiro).
- Metas pedagógicas são configuráveis por evento e podem ser marcadas como N/A (Não Aplicável).
- Logs de execução e trilha de auditoria obrigatórios durante operações de evento.
- Exclusão de dados de localização: somente por Admin (Chefe Escoteiro), com registro de auditoria da operação. Sem expiração automática.

## 5. Regras de colaboração humano + IA

- A IA pode gerar rascunhos de documentação, código e testes — sempre para revisão humana antes de consolidar.
- Decisões de privacidade, segurança, escopo e arquitetura exigem aprovação humana explícita.
- A IA deve sinalizar lacunas e nunca inventar domínio sem base no blueprint.
- Prioridade da IA: segurança > documentação > testabilidade > velocidade.
