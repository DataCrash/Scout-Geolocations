# Guardrails

## Fazer

- Usar `BluePrint.md` como fonte primária de intenção.
- Manter contratos, decisões e responsabilidades explícitos e documentados.
- Trabalhar em incrementos pequenos e verificáveis, com critério de aceite por entrega.
- Atualizar documentação junto com mudanças relevantes de comportamento ou decisão.
- Preferir soluções simples antes de abstrações amplas.
- Priorizar opções de menor custo para infra e serviços externos (gratuitas quando adequado e seguro).
- Garantir que NFC sempre tenha fallback por QR Code.
- Registrar trilha de auditoria para qualquer exclusão de dados de localização.
- Sinalizar explicitamente decisões pendentes antes de prosseguir com implementação.

## Não fazer

- Inventar domínio, arquitetura ou integrações sem evidência no blueprint.
- Acoplar o projeto cedo demais a fornecedor, stack ou plataforma sem justificativa documentada.
- Misturar planejamento estratégico com implementação prematura.
- Expandir escopo sem registrar a decisão com data e contexto.
- Tornar NFC obrigatório sem fallback disponível.
- Armazenar ou processar dados de localização de menores sem revisão explícita de segurança e privacidade.
- Assumir regras pedagógicas ou de segurança de campo sem validação humana.
- Implementar IA/ML como dependência crítica de funcionalidades do MVP.

## Alertas

- Se o blueprint não responde às decisões principais, parar e esclarecer antes de aprofundar.
- Se a implementação começa antes da documentação mínima, revisar a ordem de trabalho.
- Se a IA estiver definindo produto sem validação humana, interromper e alinhar.
- Se uma decisão de custo ou fornecedor for tomada sem avaliação de alternativa gratuita, registrar justificativa.
- Se dados de menores estiverem envolvidos em novo fluxo, exigir revisão explícita antes de prosseguir.
