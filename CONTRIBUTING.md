# Contributing Guide

Obrigado por contribuir com este boilerplate.

Este repositório foi desenhado para iniciar projetos orientados por IA com clareza de processo, rastreabilidade e evolução incremental.

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

## Convenção de branch (sugestão)

- `feature/<nome-curto>` para evolução de funcionalidade ou documentação.
- `docs/<tema>` para mudanças somente de documentação.
- `chore/<tema>` para manutenção técnica do boilerplate.

## Convenção de commit (sugestão)

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
