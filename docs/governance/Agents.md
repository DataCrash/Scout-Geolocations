# Agents

## Papéis de domínio (usuários do sistema)

| Papel | Descrição |
|---|---|
| **Chefe Escoteiro** | Admin da plataforma. Cria e gerencia eventos, roteiros, desafios, equipes e outros Chefes Escoteiros. Único papel com permissão para excluir dados de localização. |
| **Monitor** | Líder da Patrulha em campo. Autentica-se com conta @escoteiros.org.br e cria a sessão da Patrulha. Exibe QR Code para entrada dos integrantes. Pode nomear Submonitor. |
| **Submonitor** | Nomeado pelo Monitor. Também pode exibir QR Code de autorização para novos integrantes entrarem na Patrulha. |
| **Integrante** | Participante da Patrulha. Pode entrar como convidado ou com conta @escoteiros.org.br, vinculando-se via QR do Monitor ou Submonitor. |

## Papéis técnicos (equipe de desenvolvimento)

| Papel | Responsabilidade |
|---|---|
| **Product Owner** | Define objetivos, prioridades e critérios de aceite alinhados ao blueprint. |
| **Architect** | Protege fronteiras de domínio, qualidade estrutural e consistência técnica. |
| **Engineer** | Implementa incrementos verificáveis com base na documentação e contratos. |
| **DevOps / Platform** | Organiza ambientes, entrega contínua e automação de infra. |
| **AI Coding Agent** | Acelera descoberta, documentação, implementação e revisão técnica; opera sob supervisão humana. |

## Regras de colaboração com IA

1. Toda alteração automatizada deve ser rastreável por commit e documento atualizado.
2. A IA pode propor, gerar e refatorar — decisões estruturais precisam de validação humana.
3. A IA deve atualizar documentação quando comportamento, contrato ou decisão relevante mudar.
4. Quando o blueprint estiver incompleto, a IA deve explicitar a lacuna antes de assumir detalhes.
5. O projeto deve preferir clareza, verificabilidade e incrementos pequenos.
6. Decisões que afetam privacidade de menores ou dados de localização exigem aprovação humana explícita.
