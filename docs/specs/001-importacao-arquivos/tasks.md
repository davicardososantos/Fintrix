# Tarefas — 001 Importação

> Quebra em pedaços pequenos (SDD). Marcar ao concluir. Cada tarefa é verificável.
> **Status: concluída na Fase 2** (categorização em si fica na Fase 3 / spec 002).

- [x] T1 — Interface `ParsedTransaction` + tipo `ImportSource` em `lib/import/types.ts`.
- [x] T2 — `lib/import/detect.ts`: detectar fonte por assinatura (extrato/fatura/alelo) + testes com
      os 3 arquivos de exemplo.
- [x] T3 — `lib/import/extrato.ts`: parse do CSV C6 extrato (pular metadados/BOM, mapear campos,
      sinais, centavos).
- [x] T4 — `lib/import/fatura.ts`: parse do CSV C6 fatura (sep `;`, rawCategory, ownerHint,
      installment, fx US$).
- [x] T5 — `lib/import/alelo.ts`: extrair texto do PDF (pdf-parse) + parse de transações e benefício.
- [x] T6 — `lib/import/dedup.ts`: `dedupHash` com `occurrenceIndex` + filtro contra o banco.
- [x] T7 — Server Action `importFile` (`import-actions.ts` + `import-service.ts`): orquestra
      detect → parse → dedup → grava `ImportBatch` + `Transaction[]` (transação Prisma).
      Chamada da categorização fica para a Fase 3 (spec 002).
- [x] T8 — UI `/importar`: dropzone (csv/pdf), envio, e tela de resumo (importadas/ignoradas/erros).
- [x] T9 — Detecção de reupload do mesmo arquivo (`fileHash`) com aviso.
- [x] T10 — Testes de idempotência: reimportar cada arquivo → 0 novas; 2 idênticas no mesmo dia
      preservadas (extrato: 30/30 importadas, sem colapso).
- [x] T11 — Verificação end-to-end com os 3 arquivos de `Exemplos/Junho/`: 115 transações; reimport
      → 0 duplicadas.

## Adendo 15/09/2026 — PDFs do C6

- [x] T12 — `lib/import/pdf-text.ts`: extração de texto com colunas (TAB entre itens distantes na
      mesma linha); o Alelo segue no modo antigo.
- [x] T13 — `lib/import/extrato-pdf.ts`: extrato C6 em PDF (seções por mês, descrição em várias
      linhas, "Débito de Cartão" como no CSV, período e saldo do dia).
- [x] T14 — `lib/import/fatura-pdf.ts`: fatura C6 em PDF (seção por cartão, ano pelo fechamento,
      parcela/estorno/pagamento, US$) + subtotais para conferência.
- [x] T15 — `detect.ts`/`parse.ts`: assinaturas dos PDFs do C6 e erro claro para PDF com senha.
- [x] T16 — `import-service.ts`: saldo do arquivo atualiza `FinancialAccount` se for mais recente.
- [x] T17 — `dedup.ts`: parcela na chave + migração `import-cli.ts rehash-parcelas`.
- [x] T18 — `scripts/check-pdf-import.ts` (conferência PDF × subtotais × CSV) e
      `scripts/import-cli.ts importar` (carga em lote no servidor).
- [x] T19 — Categorização (spec 002): "DEBITO DE CARTAO" categoriza pelo estabelecimento
      (`rawDescription`).
- [x] T20 — `alelo.ts`: data `DD/MM/YYYY` (formato novo do MeuAlelo) além de `YYYY-MM-DD`, e saldo
      do topo como `balance`. Conferido: extrato de 4 meses com 15 lançamentos e 0 erros, junho com as
      mesmas 6 chaves do arquivo antigo, saldo R$ 514,63 = benefícios − gastos do período.
