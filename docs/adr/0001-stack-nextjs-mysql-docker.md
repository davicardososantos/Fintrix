# ADR 0001 — Stack base: Next.js + MySQL + Prisma + Docker

- **Status:** Aceito
- **Data:** 2026-07-02
- **Decisores:** Davi Cardoso

## Contexto

Fintrix é um app pessoal de gestão financeira do casal, mobile-first, que evoluirá para PWA e lojas.
Precisamos de uma stack que: (a) permita front mobile-first com cara de app; (b) tenha backend
simples para importar arquivos e servir relatórios; (c) use MySQL (preferência do dono); (d) rode
100% em Docker; (e) suporte categorização via IA (Gemini).

## Decisão

- **Next.js 15 (App Router, TypeScript)** como framework único (front + back).
- **MySQL 8** como banco relacional.
- **Prisma** como ORM (migrations versionadas, tipagem forte).
- **Docker Compose** para dev e produção (`app`, `db`, `adminer`).
- **Tailwind + shadcn/ui** para UI, dirigidos por um tema central de design tokens ([theme.md](../theme.md)).
- **NextAuth (Auth.js)** para contas individuais + Household.
- **Google Gemini** para categorização de transações (server-side), com fallback por regras.
- **PWA** desde o início (manifest + service worker).

## Alternativas consideradas

- **Backend separado (NestJS/Express) + front SPA:** mais partes móveis, mais complexo para um app
  pessoal. Rejeitado — monólito Next.js é suficiente e mais rápido de evoluir.
- **PostgreSQL:** ótimo banco, mas o dono pediu MySQL. Sem motivo técnico para contrariar.
- **React Native/Flutter (app nativo):** adia entrega e duplica esforço. PWA primeiro atende
  "cara de app" e caminho para as lojas com muito menos custo.
- **ORM Drizzle:** boa opção, mas Prisma tem DX/maturidade melhores para este caso.

## Consequências

- **Positivas:** um só projeto/deploy; tipagem ponta a ponta; migrations versionadas; PWA barato.
- **Negativas / trade-offs:** monólito pode precisar ser quebrado se crescer muito (improvável para
  um app do casal); Prisma + MySQL têm limitações pontuais (ex.: alguns tipos) — aceitáveis.
- Parsers de PDF/CSV e libs específicas serão travados nos specs das fases que os usam.
- **Docker convive com outros stacks no servidor** (nutrix, codetrix, nginx-proxy-manager): o
  compose usa **portas parametrizadas por `.env`** (app `3100`, MySQL `3310`, Adminer `8090` por
  padrão), **rede isolada** `fintrix_net` e **prefixo `fintrix_`** nos containers, para não colidir.
  Tabela e portas ocupadas em [architecture.md §7](../architecture.md#7-portas-e-ambientes).
