# Tarefas — 002 Categorização

- [ ] T1 — `lib/categorization/seed.ts`: categorias-semente + mapa `Categoria` C6 → `Category`.
- [ ] T2 — `lib/categorization/rules.ts`: avaliação de `CategoryRule` por prioridade.
- [ ] T3 — `lib/categorization/gemini.ts`: cliente server-side (batch, cache, timeout, **fallback**).
- [ ] T4 — `lib/categorization/pipeline.ts`: orquestração C6 → regra → Gemini → fallback + precedência.
- [ ] T5 — Integrar pipeline ao pós-import (spec 001) sobre transações novas.
- [ ] T6 — UI `/transacoes`: lista + valor colorido + filtros (período/categoria/pessoa/conta/texto/
      não-categorizadas).
- [ ] T7 — Sheet de edição: trocar categoria (fixa `manual`) e pessoa (liga com 003).
- [ ] T8 — UI `/categorias`: CRUD de categorias (nome/tipo/cor-token) e regras.
- [ ] T9 — "Criar regra a partir da transação" + aplicar retroativo.
- [ ] T10 — Verificação: cobertura ≥ 80% nos 3 arquivos; Gemini offline não trava; manual sobrevive a
      reprocesso.
