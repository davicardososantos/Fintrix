# Spec 001 — Importação de arquivos (E1)

- **Épico:** E1 · **Fase:** 2 · **Status:** Draft
- **Depende de:** Fase 1 (schema, auth). **Relaciona:** [002 categorização](../002-transacoes-categorizacao/spec.md)

## Objetivo

Permitir que o usuário faça **upload** de um arquivo financeiro e o Fintrix **importe as transações**
para o household, **sem duplicar** o que já existe. Fontes do MVP: **C6 Extrato (CSV)**, **C6 Fatura
(CSV)**, **Alelo (PDF)**.

## Escopo

**Dentro:** upload; detecção automática da fonte; parse dos 3 formatos; normalização para
`Transaction`; deduplicação idempotente; registro de `ImportBatch`; tela de resumo (importadas /
ignoradas / erros).
**Fora:** integração automática com banco (Open Finance); outros bancos; edição em massa (fica em
002/003); categorização em si (chama 002, mas não é objeto deste spec).

## Formatos de entrada (baseados em `Exemplos/Junho/`)

### C6 Extrato de Conta Corrente — CSV, UTF-8 **com BOM**, separador `,`
- Linhas iniciais de metadados (banco, agência/conta, "Extrato gerado em...", período) → **pular**
  até a linha de cabeçalho.
- Cabeçalho: `Data Lançamento,Data Contábil,Título,Descrição,Entrada(R$),Saída(R$),Saldo do Dia(R$)`.
- Data: `DD/MM/YYYY`. Valores: **ponto decimal** (`4.28`). Entrada e Saída em colunas separadas
  (uma é 0.00).
- Descrição pode vir entre aspas (contém vírgula). `Título` e `Descrição` podem ser iguais.
- **Mapeamento:** `date` = Data Lançamento; `description` = Título (+ Descrição se diferente);
  `amountCents` = `Entrada − Saída` em centavos (+ entrada / − saída); `account` = conta C6.

### C6 Fatura de Cartão — CSV, separador `;`
- Cabeçalho: `Data de Compra;Nome no Cartão;Final do Cartão;Categoria;Descrição;Parcela;Valor (em US$);Cotação (em R$);Valor (em R$)`.
- Data: `DD/MM/YYYY`. `Valor (em R$)` com ponto decimal; **negativo = pagamento/estorno**
  (ex.: "Inclusao de Pagamento").
- **Mapeamento:** `date` = Data de Compra; `description` = Descrição; `amountCents` = − `Valor (R$)`
  (compra é saída) — atenção ao sinal já negativo de pagamentos; `rawCategory` = Categoria (semente
  p/ 002); `ownerHint` = Nome no Cartão (p/ 003); `last4` = Final do Cartão; `installment` = Parcela;
  se `Valor (US$)` ≠ 0 → `fxAmountCents`/`fxCurrency=USD`.

### Alelo — PDF
- Texto com encoding quebrado (normalizar). Estrutura por transação: **MERCHANT** / `- R$ valor` /
  `YYYY-MM-DD`. Créditos aparecem como "Seu Benefício Caiu" / `R$ valor` (sem sinal negativo).
- Valores pt-BR (**vírgula decimal**, `R$ 421,50`). Também há Saldo e "último benefício" no topo.
- **Mapeamento:** `date` = data da linha (`YYYY-MM-DD`); `description` = merchant; `amountCents` =
  − valor (gasto) ou + valor (benefício/crédito); `account` = Alelo.

## Requisitos funcionais

- **RF1** Usuário envia um arquivo em `/importar`. Aceita `.csv` e `.pdf`.
- **RF2** O sistema **detecta a fonte** pelo conteúdo (assinaturas: header do extrato, header da
  fatura com `;`, marcadores do PDF Alelo). Se não reconhecer → erro claro, nada é salvo.
- **RF3** O parser da fonte converte para uma lista de transações normalizadas (regras acima).
- **RF4** Cada transação recebe um **`dedupHash`** (ver Regras de negócio).
- **RF5** Transações cujo `dedupHash` já existe no household são **ignoradas** (não regravadas).
- **RF6** Transações novas são salvas ligadas a um `ImportBatch` (com `fileName`, `fileHash`,
  `source`, período, contadores).
- **RF7** Ao final, a UI mostra **resumo**: total lido, importadas, ignoradas (duplicadas), com erro.
- **RF8** Linhas inválidas (não parseáveis) são **puladas** e reportadas, sem abortar o lote inteiro.
- **RF9** Após importar, dispara a **categorização** (spec 002) em lote sobre as novas transações.
- **RF10** Import é **idempotente**: reenviar o mesmo arquivo resulta em 0 novas transações.

## Regras de negócio

- **Dinheiro em centavos** (inteiro). Parse de valor tolera `.`/`,` conforme a fonte.
- **dedupHash** = hash de `householdId + source + accountKey + date + descriptionNormalizada +
  amountCents + occurrenceIndex`.
  - `occurrenceIndex` = ordem da transação **idêntica** dentro do mesmo arquivo/dia (0,1,2...). Isso
    permite manter duas transações **legitimamente iguais** no mesmo dia (ex.: dois METRO R$ 5,40)
    **sem** que a reimportação do mesmo arquivo as duplique.
- `descriptionNormalizada` = trim + colapso de espaços + uppercase + remoção de acentos.
- **Sinal:** entrada = `+`, saída = `−`, coerente entre as fontes.
- Reupload do **mesmo arquivo** (mesmo `fileHash`) pode avisar "já importado" antes mesmo do dedup
  por linha.

## Critérios de aceite (contrato)

- [ ] Importar `01KWHSTGCS1BEFVAW3FXRT8R6V.csv` (extrato) cria N transações com datas/valores/sinais
      corretos e conta = C6.
- [ ] Importar `Fatura_2026-06-10.csv` cria transações com `rawCategory`, `ownerHint`, `last4`,
      `installment`, e `fxAmount` quando houver US$; pagamento negativo tratado corretamente.
- [ ] Importar `Consulta de Saldo e Extrato – MeuAlelo.pdf` cria transações (gastos negativos) e o
      benefício como entrada positiva.
- [ ] **Reimportar qualquer um dos três não cria nenhuma transação nova** (0 duplicadas).
- [ ] Duas transações legítimas idênticas no mesmo dia são **ambas** mantidas (não colapsadas).
- [ ] Arquivo de fonte desconhecida → erro claro e **nada** gravado.
- [ ] Linha inválida no meio do arquivo → pulada e contada, lote conclui.
- [ ] Tela de resumo mostra importadas/ignoradas/erros corretos.

## Fora de escopo

Correção manual de linhas puladas; desfazer import (nice-to-have futuro); múltiplos arquivos de uma
vez; formatos além dos três descritos.
