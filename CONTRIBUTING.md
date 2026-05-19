# Contributing Guide

Obrigado por contribuir com este boilerplate.

Este repositório foi desenhado para iniciar projetos orientados por IA com
clareza de processo, rastreabilidade e evolução incremental.

## Derivando um novo projeto a partir deste boilerplate

Para projetos derivados, a recomendacao e nao reutilizar o historico Git deste repositório.

Preferencia:

1. Use "Use this template" no GitHub para criar um repositório novo sem historico.
2. Se fizer localmente: renomeie a pasta, remova `.git/`, execute `git init` e conecte um remoto novo.

Objetivo desse fluxo:

- Evitar mistura de historico entre template e produto real.
- Garantir identidade propria para o projeto derivado.
- Facilitar governanca e auditoria do contexto real de desenvolvimento.

## Objetivo deste guia

- Padronizar colaboração humana e assistida por IA.
- Reduzir retrabalho e inconsistência documental.
- Garantir que decisões importantes sejam explícitas e auditáveis.

## Fluxo de trabalho recomendado

1. Atualize `BluePrint.md` antes de alterar documentos estratégicos.
2. Derive ou refine documentação em `docs/` com base no blueprint.
3. Faça mudanças pequenas e verificáveis.
4. Registre motivação e impacto em commit e PR.

## Fluxo GitFlow obrigatório (Forward-Only)

As regras abaixo sao obrigatorias para este repositório:

1. **Forward-Only**: nao usar `git revert`, `git rebase`, `reset --hard`
   ou reescrita de historico, exceto com ordem explicita do responsavel do projeto.
2. Branch de desenvolvimento padrao: `develop`.
3. Branch de comparacao/release: `master`.
4. Toda implementacao deve nascer de `develop` em branch dedicada:
   - `feature/*` para novas funcionalidades.
   - `bugfix/*` para correcoes nao emergenciais.
5. Fluxo diario:
   - `feature/*`/`bugfix/*` -> PR -> `develop`.
6. Fechamento de versao:
   - criar `release/x.x.x` a partir de `develop`.
   - validar integridade e aplicar ajustes pequenos na release.
   - `release/x.x.x` -> PR -> `master`.
   - apos merge em `master`, abrir PR `master` -> `develop`.
7. Correcao emergencial em producao:
   - criar `hotfix/*` a partir de `master`.
   - `hotfix/*` -> PR -> `master`.
   - apos merge em `master`, abrir PR `master` -> `develop`.
8. Quando o agente IA for o unico implementador ativo, ele pode abrir/aprovar/taguear PRs,
   mas deve manter 100% do fluxo acima para preservar historico e rastreabilidade.
9. Branches `feature/*`, `bugfix/*`, `hotfix/*` e `release/*` sao removidas automaticamente
   apos merge do PR quando a branch pertence a este mesmo repositório.

## Convenção de branch

- `feature/<nome-curto>` para evolução de funcionalidade ou documentação.
- `bugfix/<nome-curto>` para correções de defeitos.
- `release/<x.x.x>` para estabilização de versão.
- `hotfix/<nome-curto>` para correções emergenciais em produção.

## Convenção de commit

- `feat:` nova funcionalidade
- `fix:` correção
- `docs:` documentação
- `refactor:` refatoração sem mudança funcional
- `chore:` manutenção técnica
- `test:` testes

Exemplo:

- `docs: derivar manifest e constitution a partir do blueprint`

## Checklist antes de abrir PR

- [ ] Mudança está alinhada ao `BluePrint.md`.
- [ ] Documentos impactados foram atualizados.
- [ ] Escopo está pequeno e claro.
- [ ] Não há conteúdo de domínio inventado sem base no blueprint.
- [ ] Decisões importantes foram registradas no conteúdo apropriado.

## Colaboração com IA

1. IA pode propor, gerar e refatorar.
2. Decisões estruturais exigem validação humana.
3. IA deve declarar lacunas de contexto antes de assumir detalhes.
4. Mudanças geradas por IA devem manter rastreabilidade no histórico.

## Regras de qualidade

- Preferir simplicidade e clareza.
- Evitar abstrações prematuras.
- Evitar acoplamento com stack ou fornecedor sem justificativa.
- Manter documentação e implementação sincronizadas.

## Escopo deste repositório

Este boilerplate define processo e estrutura inicial.

A definição do projeto real depende de um `BluePrint.md` bem preenchido no contexto da iniciativa concreta.
