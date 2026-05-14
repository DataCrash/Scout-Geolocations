# BluePrint

## 1. Visão geral do projeto

Será criado um sistema mobile-first de geocaching para Safari Urbano de Escoteiros, focado em desafios educativos baseados em localização e interação com o ambiente urbano.

O produto combina três frentes complementares:

- Geocache Quest: caça ao tesouro com desafios por ponto geográfico.
- SafariVision: validação por imagem e reconhecimento visual assistido por IA.
- Heritage Trail: roteiros com pontos de interesse e check-in por NFC/QR.

Público-alvo principal:

- Crianças e adolescentes em grupos de escoteiros, usando smartphones/tablets.
- Staff/organizadores que configuram eventos, roteiros, desafios e acompanhamento.

Dor principal a resolver:

- Dificuldade de conduzir atividades urbanas gamificadas com validação confiável e baixo esforço operacional do staff.

Resultado concreto esperado:

- Realização de um evento piloto com equipes concluindo desafios geolocalizados, validação básica automatizada e placar funcional.

## 2. Objetivos e métricas de sucesso

Objetivos de negócio:

- Aumentar engajamento dos participantes em atividades educativas urbanas.
- Reduzir esforço manual de validação por parte dos organizadores.
- Permitir repetição do formato em novos eventos com configuração rápida.

Objetivos técnicos:

- Entregar plataforma web mobile-first com operação em campo.
- Suportar desafios por GPS + QR no MVP e evoluir para NFC/visão computacional.
- Garantir base evolutiva para gamificação, social e offline-first.

Métricas iniciais de sucesso (MVP):

- >= 90% das tentativas de check-in por QR realizadas com sucesso no piloto.
- >= 80% dos desafios concluídos sem intervenção manual.
- Atualização de pontuação em <= 3 segundos para operações online.
- Disponibilidade percebida >= 99% durante janela do evento piloto.

Metas pedagógicas configuráveis por evento (Chefe Escoteiro):

- As metas pedagógicas são configuradas por Chefe Escoteiro por evento; cada meta pode ser marcada como N/A (Não Aplicável) ou receber um valor numérico.
- Valores padrão servem apenas de exemplo e podem ser redefinidos como novo padrão por qualquer Admin.
- Padrão de taxa de conclusão de missões: 70% das Patrulhas concluem >= 70% dos desafios do evento (configurável).
- Padrão de engajamento por membro: N/A. Normalmente basta que 1 elemento da Patrulha registre o desafio para a Patrulha ser considerada concluída. Chefes podem configurar um mínimo de 2+ membros participantes se julgarem necessário.

Critérios mínimos de sucesso do MVP:

- Mapa com geolocalização funcionando em dispositivos móveis.
- Cadastro e execução de desafios de QR/localização.
- Registro de progresso por equipe e leaderboard básico.

## 3. Escopo inicial

Primeiro ciclo (MVP - Fase 1):

- Backend com serviços essenciais de Geocache e Localização.
- Frontend mobile-first com mapa, lista de cachés e tela de desafio.
- Validação de desafio por QR Code e localização.
- Pontuação básica e painel simples de progresso.
- Autenticação inicial de Patrulha com pelo menos 1 integrante autenticado via conta Google @escoteiros.org.br (preferencialmente Monitor).
- Vinculação de demais integrantes por login convidado ou conta @escoteiros.org.br, entrando na Patrulha via leitura de QR Code exibido pelo Monitor.
- Fluxo de Submonitor com permissão para autorizar entradas de novos integrantes via QR Code.
- Painel admin completo no ciclo 1: CRUD de roteiros/cachés/desafios, gestão de equipes e gestão de admins (Chefes Escoteiros).

## 4. Fora de escopo inicial

Não entra no primeiro ciclo:

- Reconhecimento visual avançado com treino de modelos customizados.
- AR/XR em produção.
- NFC obrigatório como mecanismo único de validação.
- Social completo (amizades, comentários e compartilhamento avançado).
- Orquestração Kubernetes e multi-região.

## 5. Arquitetura e princípios de design

Direção arquitetural:

- Backend em microserviços leves com APIs claras por domínio (Cache, Location, Challenge, Vision, Social).
- Início pragmático: serviços centrais ativos no MVP e demais em evolução incremental.
- Frontend SPA/PWA em React, orientado a módulos por recurso.

Princípios:

- Modularidade por domínio e baixo acoplamento.
- Evolução incremental com entregas pequenas e verificáveis.
- Contratos explícitos entre frontend e backend (versionamento de API).
- Event-driven para eventos de domínio relevantes (ex.: cache encontrado, desafio validado).
- Prioridade para observabilidade e resiliência em operações de campo.

Fronteiras do sistema:

- Cliente web mobile-first (participante e admin).
- APIs de domínio e gateway.
- Infra de mensageria/cache/real-time.
- Camada de dados transacional + cache geoespacial.

Requisitos de qualidade:

- Segurança: autenticação/autorização por papel, proteção de dados de localização e trilha de auditoria.
- Resiliência: tolerar perda temporária de rede no cliente e sincronização posterior.
- Observabilidade: logs estruturados, métricas de latência/erros e correlação por evento.

## 6. Uso de IA no projeto

Como a IA pode apoiar:

- Concepção: propor alternativas de fluxo, escopo incremental e arquitetura.
- Planejamento: detalhar backlog, critérios de aceite e riscos.
- Implementação: gerar boilerplate, testes iniciais e documentação técnica.
- Revisão: sugerir melhorias de qualidade, segurança, performance e legibilidade.
- Operação: apoiar análise de incidentes com base em logs e sintomas.

O que a IA pode fazer sozinha:

- Produzir rascunhos de documentação, código inicial, testes e checklists.
- Propor contratos de API e modelos de dados para revisão.

O que exige validação humana:

- Decisões de privacidade e proteção de menores.
- Regras pedagógicas e de segurança de campo.
- Aprovação final de arquitetura, custos e priorização.
- Qualquer decisão que altere escopo do evento piloto.

Registro de decisões:

- Toda decisão relevante deve ser registrada em documentação de governança/arquitetura/planning com data, contexto e trade-offs.

Lacunas e ambiguidades:

- A IA deve sinalizar explicitamente quando dados estiverem ausentes, evitar assumir regras críticas e solicitar confirmação.

Critério de priorização para IA:

- Priorizar segurança, clareza documental e testabilidade antes de velocidade.

## 7. Stack e restrições técnicas

Stack alvo:

- Backend: .NET 9+, ASP.NET Core (Minimal APIs), EF Core, Dapper, MediatR.
- Mensageria/eventos: priorizar RabbitMQ no MVP por menor custo e opção gratuita local/self-hosted; avaliar Azure Service Bus apenas se houver limitação relevante de operação/escala.
- Cache: Redis com suporte geoespacial.
- Real-time: SignalR.
- Frontend: React + Vite + Tailwind + shadcn/ui + Zustand.
- Mapa: Leaflet + React-Leaflet.
- ML/Visão: TensorFlow.js no cliente com fallback para serviço em ONNX Runtime no backend.
- PWA/offline: Service Worker + IndexedDB.
- Infra: Docker + Docker Compose.

Restrições técnicas conhecidas:

- Solução deve ser mobile-first e funcionar em navegadores móveis modernos.
- NFC deve ter fallback por QR devido limitação de suporte de WebNFC em dispositivos.
- Funcionalidades críticas do MVP não podem depender de IA/ML para operar.
- Privacidade de localização deve ser minimizada e restrita ao necessário para evento.
- Fluxo de autenticação precisa suportar papéis de Patrulha (Monitor, Submonitor, Integrante) e entrada por QR no MVP.

## 8. Estrutura sugerida do repositório

Estrutura esperada em evolução:

- contracts/: contratos de API/eventos e schemas.
- docs/: documentação estratégica, arquitetural e plano de implementação.
- infra/: composição local, provisionamento e observabilidade básica.
- prompts/: padrões de prompts e instruções de IA do projeto.
- backend/ (a criar): serviços por domínio e componentes compartilhados.
- frontend/ (a criar): aplicação React mobile-first.
- ml/ (opcional futuro): artefatos de modelo e pipelines de inferência.

## 9. Entregas esperadas

Entregas técnicas do primeiro ciclo:

- Serviço de geocache (CRUD + consulta por proximidade).
- Serviço de localização (atualização + geofence básico).
- Aplicação frontend com fluxo de caça, mapa e pontuação.
- Leaderboard básico em tempo real.

Entregas de documentação:

- Manifesto, constituição, guardrails e papéis de agentes atualizados.
- Arquitetura alvo com visão incremental.
- Plano de implementação por fases com critérios de aceite.

Milestones propostos:

- M1: MVP base (2-3 semanas).
- M2: visão computacional inicial (2-3 semanas).
- M3: NFC + offline (1-2 semanas).
- M4: social + gamificação avançada (1-2 semanas).

## 10. Regras operacionais

- Mudanças em pequenos incrementos, cada um validável.
- Todo comportamento novo deve ter critério de aceite explícito.
- Atualizar documentação quando decisões de arquitetura/escopo mudarem.
- Versionamento semântico para APIs e contratos.
- Revisão humana obrigatória para mudanças de segurança, privacidade e dados sensíveis.
- Logs e auditoria mínimos habilitados para operações de evento.
- Evitar lock-in prematuro de fornecedor quando houver alternativa equivalente.
- Decisões de infraestrutura devem priorizar menor custo total no MVP, preferindo opções gratuitas quando não comprometerem uso, segurança e manutenção.
- Retenção de localização pós-evento: sem expiração automática; dados permanecem até remoção por Admin (Chefe Escoteiro), com trilha de auditoria da exclusão.

## 11. Fluxos principais do produto

Fluxo 1: preparação do evento (admin)

- Criar roteiro/zona urbana.
- Cadastrar cachés, desafios e critérios de pontuação.
- Publicar evento para equipes participantes.

Fluxo 2: execução em campo (participante)

- Monitor faz login com conta @escoteiros.org.br e cria/ativa a sessão da Patrulha.
- Integrantes entram como convidado ou com conta @escoteiros.org.br.
- Integrantes vinculam-se à Patrulha lendo QR Code exibido no dispositivo do Monitor.
- Submonitor, quando nomeado, também pode autorizar novos vínculos por QR.
- Abrir mapa e compartilhar localização.
- Receber indicação de cache próximo.
- Fazer check-in por QR (e NFC quando disponível).
- Resolver desafio (pergunta, foto, quiz, localização).
- Receber validação e pontos.

Fluxo 3: acompanhamento e resultado

- Atualização de ranking em tempo real.
- Visualização de progresso por equipe.
- Encerramento do evento com consolidação de badges/pontuação.

## 12. Entradas, saídas e integrações

Entradas principais:

- Dados de geolocalização do dispositivo.
- Leitura de QR/NFC quando aplicável.
- Imagens de câmera para desafios fotográficos (fases posteriores).
- Configurações de evento criadas pelo admin.

Saídas principais:

- Status de desafio (pendente, validado, falhou).
- Pontuação por equipe e leaderboard.
- Histórico de check-ins, submissões e progresso.
- Histórico de localização mantido até exclusão explícita por Admin (Chefe Escoteiro).

Integrações/dependências:

- APIs nativas web: Geolocation, Camera/getUserMedia, WebNFC (quando suportado).
- Integração com autenticação Google para contas @escoteiros.org.br.
- Serviços de mensageria/cache/real-time (RabbitMQ prioritário no MVP, Redis, SignalR).
- Possível integração de notificação push em fases posteriores.

## 13. Riscos, incógnitas e decisões pendentes

Riscos:

- Suporte inconsistente de WebNFC em dispositivos dos participantes.
- Limitações de conectividade móvel durante o safari urbano.
- Custos/complexidade de visão computacional no início do projeto.
- Exigências legais e de consentimento para dados de menores e localização.

Incógnitas/decisões pendentes:

- Possível adoção de NFC para vínculo de Patrulha como alternativa complementar ao QR (futuro).
- Política de governança para exclusão de localização por admin (gatilhos, aprovação e auditoria).

## 14. Critérios de aceite do primeiro ciclo

Para considerar o ciclo 1 aceitável, deve estar pronto:

- Criação de evento com ao menos 1 roteiro e 5 cachés de teste.
- Aplicação mobile-first operando em campo com geolocalização ativa.
- Login do Monitor por conta @escoteiros.org.br e criação de Patrulha funcionando ponta a ponta.
- Entrada de integrantes via QR (convidado ou conta @escoteiros.org.br) funcionando ponta a ponta.
- Check-in e validação de desafio por QR funcionando ponta a ponta.
- Registro de pontuação e exibição de leaderboard em tempo quase real.
- Painel admin com gestão de equipes e gestão de admins (Chefes Escoteiros).
- Logs de execução e trilha básica de auditoria disponíveis.
- Documentação mínima atualizada (arquitetura e plano).

## 15. Artefatos que devem ser gerados a partir deste blueprint

- README.md
- docs/README.md
- docs/governance/Manifest.md
- docs/governance/Constitution.md
- docs/governance/Agents.md
- docs/governance/Guardrails.md
- docs/architecture/Architecture.md
- docs/planning/Implementation-Plan.md

## 16. Instrução final para o agente

Derive a documentação estratégica a partir deste blueprint com foco em clareza, rastreabilidade e evolução incremental. Não invente domínio, arquitetura ou integrações sem evidência neste documento. Onde houver lacuna, registre como decisão pendente com pergunta objetiva para validação humana.

---

Este blueprint deve ser tratado como base primária para orientar planejamento, documentação e implementação.
