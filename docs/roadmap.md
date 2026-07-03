# Roadmap — Fintrix

> Fases de entrega. Cada fase vira código guiado pelos [specs/](./specs/). Princípio da
> [constitution.md](./constitution.md): **simples primeiro**, evoluir depois.

## Fase 0 — Fundação SDD ✅
Documentação viva do projeto: constitution, PRD, architecture, data-model, theme, design-system,
frontend-guidelines, pwa, roadmap, glossary, ADR-0001 e specs 001–006. Nenhum código de app.
**Saída:** `docs/` completo + README.

## Fase 1 — Scaffold técnico ✅
Projeto Next.js 15 + TS, Docker Compose (`app`, `db` MySQL, `adminer` + serviço `migrate`),
Tailwind + shadcn com o **tema aplicado** ([theme.md](./theme.md)), Prisma com schema inicial
([data-model.md](./data-model.md)), NextAuth (contas + Household, config dividida para o Edge),
`lib/money.ts`, ESLint/Prettier.
**Saída (verificada):** app sobe com `docker compose up` nas portas do Fintrix (app 3100, MySQL 3310,
Adminer 8090); login/logout funcionam (fluxo real testado ponta a ponta); tema Verde/Teal visível;
migration inicial `init` aplicada. Bottom-nav e telas-placeholder das próximas fases no lugar.

## Fase 2 — Importação (E1) ✅
Upload + detecção de fonte + parsers (C6 extrato, C6 fatura, Alelo PDF via pdf-parse) + **dedup
idempotente** (`dedupHash` com `occurrenceIndex`) + `ImportBatch` + tela de resumo. Spec:
[001](./specs/001-importacao-arquivos/spec.md).
**Saída (verificada):** os 3 arquivos de `Exemplos/Junho/` importam (115 transações: 30 extrato +
79 fatura + 6 Alelo, com sinais/categorias/ownerHint corretos); reimportar → **0 duplicadas**;
dashboard mostra resumo + últimas transações. Categorização/atribuição reais ficam na Fase 3
(por ora `rawCategory`/`ownerHint` são guardados como semente).

## Fase 3 — Categorização (E2) + Atribuição (E3) ✅
Categoria nativa C6 (semente) + regras + **Gemini** (`gemini-3.1-flash-lite`, com fallback por
regra) + edição manual; atribuição eu/esposa/casal (auto pela fatura via `ownerHint`). Categorização
roda após o import e sob demanda. Specs: [002](./specs/002-transacoes-categorizacao/spec.md),
[003](./specs/003-atribuicao-pessoa/spec.md).
**Saída (verificada):** **100%** categorizado automático nas 115 transações (76 C6 + 38 regra +
1 IA); edição manual de categoria/pessoa **sobrevive** à recategorização (precedência `manual`);
regra retroativa; filtros (texto/categoria/pessoa/conta); adicionar cônjuge (`/mais`). Migration
`owner_manual` aplicada.

## Fase 4 — Dashboard + Relatórios (E6) ✅ (atual)
Resumo do mês (com **navegação de mês**), relatórios por categoria/pessoa, evolução mês-a-mês
(barras), filtros (mês + pessoa) e **drill-down** para `/transacoes`. É o coração (decisão). Spec:
[006](./specs/006-dashboard-relatorios/spec.md).
**Saída (verificada):** dashboard mostra saldo/entrou/saiu do mês + **delta vs. mês anterior** +
placar "quem gastou mais" + top categorias; `/relatorios` traz evolução de 6 meses, gastos por
pessoa e por categoria (com drill-down) e filtro por pessoa. Regra de contagem exclui
transferências/pagamento de fatura (sem dupla contagem). Charts em CSS puro usando tokens do tema
(sem lib extra).

## Fase 5 — Pontos (E4) + Investimentos (E5)
Pontos (Smiles, Livelo, Azul, Latam) com atualização manual; investimentos (CDB C6) com registro e
valor atual. Specs: [004](./specs/004-pontos/spec.md), [005](./specs/005-investimentos/spec.md).
**Saída:** acompanhar saldos de pontos e patrimônio investido.

## Fase 6 — PWA + polimento mobile
Manifest, service worker, ícones, offline básico, instalação; refino de cara de app. Guia:
[pwa.md](./pwa.md).
**Saída:** instalável no Android/iOS; Lighthouse PWA ok.

## Futuro (fora do MVP)
Open Finance/integração automática, metas/orçamento, push, projeções, exportação, empacotamento nas
lojas (Bubblewrap/TWA + iOS).

---

### Ordem e dependências
`Fase 0 → 1 → 2 → 3 → 4 → 5 → 6`. As fases 2–5 dependem do schema da Fase 1. Relatórios (4) ganham
valor após categorização (3). PWA (6) por último, sobre app já funcional.
