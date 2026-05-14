# Manifest

## Missão

Proporcionar experiências educativas urbanas gamificadas para grupos de Escoteiros, combinando geolocalização, desafios interativos e validação automatizada, com baixo esforço operacional para os organizadores.

## Problema

Conduzir atividades de campo urbanas com múltiplas equipes é operacionalmente custoso. A validação manual de desafios sobrecarrega o staff, dificulta a repetição do formato e reduz a qualidade da experiência dos participantes.

## Promessa de valor

Um sistema mobile-first que permite a qualquer Chefe Escoteiro configurar e executar um Safari Urbano com geolocalização, desafios por QR/NFC, validação automatizada e placar em tempo real — com mínima intervenção humana durante o evento.

## Público-alvo

- **Participantes:** crianças e adolescentes organizados em Patrulhas, usando smartphones/tablets.
- **Organizadores:** Chefes Escoteiros responsáveis por criar eventos, roteiros e desafios.
- **Liderança de campo:** Monitores e Submonitores que gerenciam suas Patrulhas durante o evento.

## Escopo inicial (MVP)

- Plataforma web mobile-first com mapa interativo e geolocalização.
- Autenticação de Patrulha via conta Google @escoteiros.org.br (Monitor) e QR Code para demais integrantes.
- Desafios por GPS + QR Code com validação automatizada.
- Pontuação por Patrulha e leaderboard em tempo real.
- Painel admin completo: roteiros, cachés, desafios, equipes e gestão de Chefes Escoteiros.

## Fora de escopo inicial

- Reconhecimento visual avançado com modelos de ML customizados.
- AR/XR em produção.
- NFC como único mecanismo de validação (sem fallback).
- Funcionalidades sociais avançadas (amizades, comentários, compartilhamento de rotas).
- Orquestração Kubernetes e implantação multi-região.

## Princípio orientador

> O sistema deve funcionar em campo, com conectividade limitada, dispositivos heterogêneos e crianças como usuários principais. Simplicidade, resiliência e segurança vêm antes de sofisticação técnica.
