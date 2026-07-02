# Fintrix

**Gestão financeira do casal** — app pessoal, mobile-first, para ter controle de gastos: saber
quanto entrou, quanto saiu, onde dá para economizar e quem está gastando mais. Importa extratos
(C6 conta e cartão, Alelo), categoriza (regras + IA Gemini), atribui gastos por pessoa (eu / esposa /
casal) e gera relatórios para decisão. Evolui para **PWA** e, depois, para as lojas.

> **Status:** Fase 0 — fundação de documentação (Spec-Driven Development). O código do app começa na
> Fase 1. Ver [docs/roadmap.md](docs/roadmap.md).

## Como este projeto funciona (SDD)

O Fintrix é construído por **Spec-Driven Development**: nada de código sem spec. A pasta
[`docs/`](docs/) é a **fonte viva de verdade** — leia-a antes de implementar qualquer coisa.

| Documento | O que é |
|---|---|
| [docs/constitution.md](docs/constitution.md) | Princípios inegociáveis (SDD, tema é lei, dinheiro em centavos, Docker...) |
| [docs/PRD.md](docs/PRD.md) | Visão, personas, objetivos, escopo, épicos, métricas |
| [docs/architecture.md](docs/architecture.md) | Stack, decisões, fluxos, estrutura de pastas |
| [docs/data-model.md](docs/data-model.md) | Entidades, relações, ERD (base do Prisma) |
| [docs/theme.md](docs/theme.md) | **Tema** — design tokens (Verde/Teal), fonte única da verdade visual |
| [docs/design-system.md](docs/design-system.md) | Padrões de UX mobile-first e componentes |
| [docs/frontend-guidelines.md](docs/frontend-guidelines.md) | Boas práticas de código de frontend |
| [docs/pwa.md](docs/pwa.md) | Passo a passo de implantação PWA |
| [docs/roadmap.md](docs/roadmap.md) | Fases de entrega |
| [docs/glossary.md](docs/glossary.md) | Termos do domínio |
| [docs/adr/](docs/adr/) | Registros de decisões de arquitetura |
| [docs/specs/](docs/specs/) | Specs por feature (o "contrato de aceite") |

### Specs (features)
1. [001 — Importação de arquivos](docs/specs/001-importacao-arquivos/spec.md) (C6 extrato/fatura, Alelo, dedup)
2. [002 — Transações + categorização](docs/specs/002-transacoes-categorizacao/spec.md) (regras + Gemini)
3. [003 — Atribuição por pessoa](docs/specs/003-atribuicao-pessoa/spec.md) (eu/esposa/casal)
4. [004 — Pontos](docs/specs/004-pontos/spec.md) (Smiles, Livelo, Azul, Latam)
5. [005 — Investimentos](docs/specs/005-investimentos/spec.md) (CDB C6)
6. [006 — Dashboard + relatórios](docs/specs/006-dashboard-relatorios/spec.md)

## Stack

Next.js 15 (App Router, TypeScript) · MySQL 8 + Prisma · Docker Compose · Tailwind + shadcn/ui
(tema central) · NextAuth · Google Gemini (categorização) · PWA. Detalhes e o porquê:
[docs/architecture.md](docs/architecture.md) e [ADR 0001](docs/adr/0001-stack-nextjs-mysql-docker.md).

## Rodar (a partir da Fase 1)

> Ainda não há app. Quando a Fase 1 entregar o scaffold, o fluxo será:

```bash
cp .env.example .env      # configurar DB, GEMINI_API_KEY e portas (APP_PORT/DB_PORT/ADMINER_PORT)
docker compose up         # sobe app (Next.js) + MySQL + Adminer
# migrations do Prisma aplicadas no boot
```

**Portas padrão** (dedicadas ao Fintrix, sem colidir com outros stacks do servidor — configuráveis
no `.env`):

| Serviço | URL / porta |
|---|---|
| App (Next.js) | http://localhost:3100 |
| Adminer (UI do banco) | http://localhost:8090 |
| MySQL | `localhost:3310` |

Detalhes e portas ocupadas no servidor: [docs/architecture.md §7](docs/architecture.md#7-portas-e-ambientes).

## Dados de exemplo

[`Exemplos/Junho/`](Exemplos/Junho/) contém arquivos reais usados para desenhar/validar a importação:
extrato C6 (CSV), fatura C6 (CSV) e extrato Alelo (PDF).

## Contribuindo (fluxo)

1. Toda mudança referencia um **spec** em `docs/specs/`.
2. Frontend segue [theme.md](docs/theme.md) + [frontend-guidelines.md](docs/frontend-guidelines.md)
   (tema é lei).
3. "Pronto" = os **critérios de aceite** do spec passam.
