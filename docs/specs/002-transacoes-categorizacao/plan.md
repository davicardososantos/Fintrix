# Plano técnico — 002 Categorização

> Como implementar o [spec 002](./spec.md). Detalhe travado na Fase 3.

## Componentes

- `lib/categorization/pipeline.ts` — orquestra C6 → regra → Gemini → fallback; respeita precedência.
- `lib/categorization/rules.ts` — avalia `CategoryRule` (contains/regex/equals, por prioridade).
- `lib/categorization/gemini.ts` — cliente server-side do Gemini; recebe descrições + lista de
  categorias, retorna mapeamento; com timeout, retry curto e **fallback**.
- `lib/categorization/seed.ts` — categorias-semente + mapa da `Categoria` C6 → `Category`.
- UI:
  - `src/app/(app)/transacoes/page.tsx` — lista + filtros (Server Component + React Query p/ mutações).
  - Sheet de edição de transação (categoria, pessoa) — reusa em 003.
  - `src/app/(app)/categorias/` — CRUD de categorias e regras.

## Gemini (server-side)

- Modelo Gemini via `GEMINI_API_KEY` (env, server). Entrada: array de descrições normalizadas +
  enum de categorias do household. Saída: `{ descricao: categoria }`.
- **Batch**: uma chamada para muitas descrições; **dedupe** por descrição normalizada + **cache**
  (tabela ou memória) para não repetir.
- **Fallback obrigatório:** qualquer erro/timeout → `uncategorized`, log discreto, segue o fluxo.
- Prompt pede escolher **somente** dentre as categorias fornecidas (ou "Outros"), sem inventar.

## Pontos de atenção

- Nunca rebaixar `manual`. Reprocesso só toca `ai`/`uncategorized` (e `c6`/`rule` conforme regra).
- Privacidade: enviar o mínimo ao Gemini (descrição, não nomes/contas).
- Idempotência: reprocessar não deve criar categorias duplicadas nem estourar chamadas (cache).
