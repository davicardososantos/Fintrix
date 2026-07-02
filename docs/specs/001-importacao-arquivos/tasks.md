# Tarefas — 001 Importação

> Quebra em pedaços pequenos (SDD). Marcar ao concluir. Cada tarefa é verificável.

- [ ] T1 — Interface `ParsedTransaction` + tipo `ImportSource` em `lib/import/types.ts`.
- [ ] T2 — `lib/import/detect.ts`: detectar fonte por assinatura (extrato/fatura/alelo) + testes com
      os 3 arquivos de exemplo.
- [ ] T3 — `lib/import/extrato.ts`: parse do CSV C6 extrato (pular metadados/BOM, mapear campos,
      sinais, centavos).
- [ ] T4 — `lib/import/fatura.ts`: parse do CSV C6 fatura (sep `;`, rawCategory, ownerHint, last4,
      installment, fx US$).
- [ ] T5 — `lib/import/alelo.ts`: extrair texto do PDF + normalizar encoding + regex de transações e
      benefício.
- [ ] T6 — `lib/import/dedup.ts`: `dedupHash` com `occurrenceIndex` + filtro contra o banco.
- [ ] T7 — Server Action `importFile`: orquestra detect → parse → dedup → grava `ImportBatch` +
      `Transaction[]` (transação Prisma) → chama categorização.
- [ ] T8 — UI `/importar`: dropzone (csv/pdf), envio, e tela de resumo (importadas/ignoradas/erros).
- [ ] T9 — Detecção de reupload do mesmo arquivo (`fileHash`) com aviso.
- [ ] T10 — Testes de idempotência: reimportar cada arquivo → 0 novas; 2 idênticas no mesmo dia
      preservadas.
- [ ] T11 — Verificação end-to-end com os 3 arquivos de `Exemplos/Junho/` (checklist do spec).
