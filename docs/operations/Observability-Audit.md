# Observability and Audit Trail (M1)

## Objetivo

Definir um baseline minimo de observabilidade e trilha de auditoria para os fluxos criticos do M1, com eventos estruturados e passos de verificacao reproduziveis.

## Padrao de log

- Formato: `AUDIT <evento> campo=valor ...`
- Nivel esperado:
  - `Information` para sucesso e operacoes normais
  - `Warning` para bloqueios, conflitos e entradas invalidas
- Campos minimos por evento:
  - `actorId` quando houver usuario autenticado
  - `target/resource id` (ex.: `challengeId`, `roteiroId`, `userId`)
  - `eventId` quando aplicavel

## Cobertura implementada

### Identity API

- Auth:
  - `AUDIT auth.google.login.*`
  - `AUDIT auth.guest.login.success`
  - `AUDIT auth.me.success`
  - `AUDIT auth.google.authorize.issued`
  - `AUDIT auth.google.callback.*`
- Patrulha:
  - `AUDIT patrulha.created`
  - `AUDIT patrulha.invite.generated`
  - `AUDIT patrulha.join.*`
  - `AUDIT patrulha.submonitor.assigned`
- Admin:
  - `AUDIT admin.users.list`
  - `AUDIT admin.users.role.*`
  - `AUDIT admin.patrulhas.list`
  - `AUDIT admin.location.delete.requested`

### Challenge API

- Check-in:
  - `AUDIT checkin.request.*`
  - `AUDIT checkin.validated`
  - `AUDIT checkin.failed`
  - `AUDIT checkin.duplicate`
- Admin:
  - `AUDIT admin.challenge.*`

### Cache API

- Geocache admin:
  - `AUDIT admin.geocache.*`
- Roteiro admin:
  - `AUDIT admin.roteiro.*`

## Como verificar (local)

1. Suba os servicos com ambiente de desenvolvimento.
2. Execute fluxos reais de admin e check-in.
3. Filtre os logs no terminal por `AUDIT`.

Exemplos de verificacao no shell:

```bash
# Identity API
curl -s -X POST http://localhost:5001/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"name":"Probe Audit"}'

# Challenge API (exemplo de conflito em duplicidade)
# executar tentativa valida e repetir para gerar evento checkin.duplicate

# Cache API (rota protegida sem token para validar bloqueio de auth no endpoint)
curl -i http://localhost:5002/api/admin/roteiros/event/00000000-0000-0000-0000-000000000001
```

## Evidencias de aceite M1

- Endpoints admin de roteiros ativos e protegidos por auth (retorno `401` sem token).
- Spec real de roteiros com JWT valido: `2 passed`.
- Suite admin real expandida com roteiro no script `test:real:admin`.

## Limites deste baseline

- Nao ha persistencia dedicada de auditoria em tabela/event store no M1.
- O baseline atual foca em eventos estruturados no log de aplicacao para rastreabilidade operacional.
- Em M2+, recomenda-se evoluir para armazenamento imutavel de auditoria com correlacao cross-service.
