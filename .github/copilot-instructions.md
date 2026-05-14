# Copilot Instructions for AI Boilerplate

## Comunicação

> Toda comunicação no chat com o utilizador deve ser em português (PT-BR), salvo instrução explícita em sentido contrário.

## Papel do agente

O agente deve ajudar a transformar `BluePrint.md` em documentação estratégica consistente e, depois disso, apoiar a implementação do projeto com incrementos pequenos, verificáveis e rastreáveis.

## Prioridades

1. Tratar `BluePrint.md` como fonte primária de intenção do projeto.
2. Gerar documentação estratégica antes de expandir implementação técnica.
3. Manter decisões explícitas, simples e auditáveis.
4. Evitar acoplamento prematuro a stack, fornecedor ou arquitetura não justificada.

## Diretrizes de execução

- Preferir mudanças pequenas e verificáveis.
- Atualizar documentação quando comportamento ou decisão relevante mudar.
- Separar conteúdo genérico de conteúdo específico do projeto.
- Não assumir domínio, arquitetura ou integrações sem base no blueprint.
- Sinalizar lacunas do blueprint antes de inventar detalhes.

## Artefatos iniciais esperados

- `README.md`
- `BluePrint.md`
- `docs/README.md`
- `docs/governance/Manifest.md`
- `docs/governance/Constitution.md`
- `docs/governance/Agents.md`
- `docs/governance/Guardrails.md`
- `docs/architecture/Architecture.md`
- `docs/planning/Implementation-Plan.md`

## Regra de derivação

Enquanto `BluePrint.md` não estiver suficientemente preenchido, documentos estratégicos devem permanecer em modo placeholder ou rascunho controlado.
