# Plano técnico — 001 Importação

> Como implementar o [spec 001](./spec.md). Detalhe travado na Fase 2 (pode ajustar libs via ADR).

## Componentes

- **Rota/UI:** `src/app/(app)/importar/page.tsx` (client) — dropzone + botão + tela de resultado.
- **Server Action:** `importFile(formData)` — orquestra detecção → parse → dedup → persistência →
  dispara categorização.
- **Detecção de fonte:** `lib/import/detect.ts` — assinaturas de conteúdo:
  - extrato: contém `EXTRATO DE CONTA CORRENTE C6` / header com `Entrada(R$),Saída(R$)`.
  - fatura: header com `;` e `Nome no Cartão;Final do Cartão`.
  - alelo: PDF cujo texto contém `MeuAlelo` / `Extrato Rede Aliment`.
- **Parsers:** `lib/import/extrato.ts`, `lib/import/fatura.ts`, `lib/import/alelo.ts`, atrás de uma
  interface comum `parse(content): ParsedTransaction[]`.
- **Dedup:** `lib/import/dedup.ts` — calcula `dedupHash` (com `occurrenceIndex`) e filtra contra o
  banco (query por `householdId` + set de hashes).
- **Persistência:** cria `ImportBatch` + `Transaction[]` numa transação Prisma.
- **Categorização:** chama `lib/categorization` (spec 002) sobre as novas transações.

## Libs candidatas (validar/ADR na Fase 2)

- CSV: **papaparse** (lida com `;`/`,`, aspas, BOM).
- PDF: **pdf-parse** ou **pdfjs-dist** para extrair texto do Alelo; normalizar encoding (latin →
  utf-8) antes do regex.
- Hash: `crypto` nativo (sha256).

## Pontos de atenção

- **BOM** no extrato: remover antes de parsear; pular linhas de metadados até o header.
- **Encoding do PDF Alelo:** caracteres quebrados — normalizar/mapear antes de extrair valores/datas.
- **Sinais:** unificar convenção (+entrada / −saída) por fonte; cuidado com pagamento negativo na
  fatura (já vem negativo).
- **occurrenceIndex:** calcular por grupo `(date, descNormalizada, amount)` na ordem do arquivo.
- Tudo escopado por `householdId` da sessão.
