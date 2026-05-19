# Release Checklist - MVP (M1+)

## Objetivo

Padronizar o fechamento de versao do MVP com GitFlow (forward-only), piloto controlado e evidencias minimas de qualidade.

## Gate de prontidao (Go/No-Go)

Marcar todos os itens abaixo antes de iniciar a branch de release:

- [x] Working tree limpo no branch de trabalho.
- [x] Suite E2E verde no estado candidato.
- [x] Criterios de saida do M1 aprovados no plano.
- [x] Observabilidade/AUDIT documentada para fluxos criticos.
- [x] Commits atomicos e semanticos concluidos.

## Sequencia oficial de fechamento (GitFlow + Forward-Only)

1. Sincronizar `develop` com remoto.
2. Criar `release/x.y.z` a partir de `develop`.
3. Executar piloto controlado no candidato de release.
4. Corrigir apenas bugs bloqueadores em `release/x.y.z` (sem rebase/rewrite).
5. Abrir PR `release/x.y.z -> master`.
6. Apos merge em `master`, abrir PR `master -> develop`.
7. Criar tag da versao em `master` (ex.: `v1.0.0`).

## Comandos de referencia

```bash
# 1) Atualizar develop
git checkout develop
git pull origin develop

# 2) Criar release
git checkout -b release/x.y.z
git push -u origin release/x.y.z

# 3) (Opcional) correcoes no release
# git add ...
# git commit -m "fix(release): ..."
# git push

# 4) Apos merge do PR release -> master
git checkout master
git pull origin master
git tag vX.Y.Z
git push origin vX.Y.Z

# 5) PR de retorno
# abrir PR master -> develop
```

## Roteiro minimo de piloto

- Ambiente com APIs ativas e variaveis de auth alinhadas.
- Fluxo monitorado:
  - Login (guest/OAuth)
  - Entrada por patrulha
  - Check-in valido e invalido
  - Leaderboard em atualizacao
  - Operacao admin critica (CRUD)
- Verificacao de eventos `AUDIT` durante o fluxo.

## Evidencias para anexar na release

- Resultado da suite E2E da candidata.
- Link para `docs/planning/Implementation-Plan.md` (gate M1 aprovado).
- Link para `docs/operations/Observability-Audit.md`.
- Lista curta de riscos residuais aceitos no piloto.
