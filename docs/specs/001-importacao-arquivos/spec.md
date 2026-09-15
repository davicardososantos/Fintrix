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

### C6 Extrato de Conta Corrente — PDF (exportado do app; adendo de 15/09/2026)
- Assinatura: `Extrato exportado no dia …` + `Agência: …`. Pode cobrir até 1 ano.
- Seção por mês: `Outubro 2025 ( 01/10/2025 - 31/10/2025 ) Entradas: R$ … • Saídas: R$ …` — dá o ano.
- Linha: `Data lançamento | Data contábil | Tipo | Descrição | Valor` (`-R$ 24,00` = saída). Descrição
  longa pode quebrar em várias linhas, com o valor na última.
- Topo: `Período • 15 de setembro de 2025 até 15 de setembro de 2026` e
  `Saldo do dia • 15 de setembro de 2026 • R$ 973,95`.
- **Mapeamento (igual ao CSV, para o dedup casar):** `description` = Descrição (= "Título" do CSV);
  `rawDescription` = Tipo — **exceto** `Débito de Cartão`: `description` = "DEBITO DE CARTAO" e
  `rawDescription` = estabelecimento, como no CSV. O "Saldo do dia" atualiza o saldo da conta
  (`FinancialAccount.balanceCents`) se for mais recente que o gravado.
- Diferença conhecida do C6: alguns Pix recebidos aparecem como "PIX RECEBIDO" no PDF e
  "Pix recebido de FULANO" no CSV — não casam no dedup.

### C6 Fatura de Cartão — PDF (adendo de 15/09/2026)
- Assinatura: `Sua fatura com vencimento …` / `Cartão C6 Carbon`. Pode vir com senha (o app não abre
  PDF com senha — erro claro pedindo cópia sem senha ou o CSV).
- Seção por cartão: `C6 Carbon Final 4125 - DAVI CARDOSO  Subtotal deste cartão R$ 2.064,38`.
- Linha: `DD mmm | Descrição | Valor` (+ `USD 21,97 | Cotação …` em compra internacional).
- Fechamento: `transações feitas até DD/MM/AA` — a data só tem dia/mês; o ano é o da ocorrência mais
  recente que não passe do fechamento.
- **Mapeamento (igual ao CSV):** `X - Parcela 2/3` → `description` X, `installment` "2/3" (sem
  parcela → "Única"); `X - Estorno` → crédito; pagamento da fatura (`Inclusao de Pagamento`,
  `Pag Fatura Boleto`) → crédito; `ownerHint` = titular da seção. Não traz a Categoria do C6 → a
  categorização vai por regra/IA.
- **Conferência:** soma dos lançamentos de cada cartão (sem os pagamentos) = "Subtotal deste cartão".

### Alelo — PDF
- Texto com encoding quebrado (normalizar). Estrutura por transação: **MERCHANT** / `- R$ valor` /
  `YYYY-MM-DD`. Créditos aparecem como "Seu Benefício Caiu" / `R$ valor` (sem sinal negativo).
- Valores pt-BR (**vírgula decimal**, `R$ 421,50`). Também há Saldo e "último benefício" no topo.
- **Mapeamento:** `date` = data da linha (`YYYY-MM-DD`); `description` = merchant; `amountCents` =
  − valor (gasto) ou + valor (benefício/crédito); `account` = Alelo.

## Requisitos funcionais

- **RF1** Usuário envia um arquivo em `/importar`. Aceita `.csv` e `.pdf`.
- **RF2** O sistema **detecta a fonte** pelo conteúdo (assinaturas: header do extrato, header da
  fatura com `;`, marcadores do PDF Alelo e dos PDFs do C6). Se não reconhecer → erro claro, nada é
  salvo.
- **RF3** O parser da fonte converte para uma lista de transações normalizadas (regras acima).
- **RF4** Cada transação recebe um **`dedupHash`** (ver Regras de negócio).
- **RF5** Transações cujo `dedupHash` já existe no household são **ignoradas** (não regravadas).
- **RF6** Transações novas são salvas ligadas a um `ImportBatch` (com `fileName`, `fileHash`,
  `source`, período, contadores).
- **RF7** Ao final, a UI mostra **resumo**: total lido, importadas, ignoradas (duplicadas), com erro.
- **RF8** Linhas inválidas (não parseáveis) são **puladas** e reportadas, sem abortar o lote inteiro.
- **RF9** Após importar, dispara a **categorização** (spec 002) em lote sobre as novas transações.
- **RF10** Import é **idempotente**: reenviar o mesmo arquivo resulta em 0 novas transações.
- **RF11** CSV e PDF do **mesmo** período do C6 geram as mesmas chaves de dedup: importar um depois
  do outro não duplica.
- **RF12** Carga em lote pela linha de comando (`scripts/import-cli.ts importar …`) usa o mesmo fluxo
  (parse → dedup → ImportBatch → categorização).

## Regras de negócio

- **Dinheiro em centavos** (inteiro). Parse de valor tolera `.`/`,` conforme a fonte.
- **dedupHash** = hash de `householdId + source + accountKey + date + descriptionNormalizada +
  amountCents + [parcela] + occurrenceIndex`.
  - `occurrenceIndex` = ordem da transação **idêntica** dentro do mesmo arquivo/dia (0,1,2...). Isso
    permite manter duas transações **legitimamente iguais** no mesmo dia (ex.: dois METRO R$ 5,40)
    **sem** que a reimportação do mesmo arquivo as duplique.
  - `parcela` (ex.: `2/3`) entra na chave quando existe — o C6 repete a data da compra original em
    todas as parcelas, e sem ela a 3/3 era descartada como duplicata da 2/3 da fatura anterior
    (aconteceu com LOCALIZA 2/3 e 3/3, set/2026). "Única"/vazio fica de fora, então o hash das compras
    à vista não mudou. As parceladas já gravadas foram migradas com
    `scripts/import-cli.ts rehash-parcelas --apply`.
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
- [x] PDF da fatura C6 (jan–set/2026): soma de cada cartão = "Subtotal deste cartão" em todas; nos
      meses com CSV (fev–jun) as chaves de dedup do PDF são idênticas às do CSV.
- [x] PDF do extrato C6 (15/09/2025–15/09/2026): entradas/saídas de cada mês = cabeçalho do mês;
      no período do CSV (04/01–03/07/2026) 256 de 258 chaves casam (os 2 Pix "PIX RECEBIDO" acima);
      saldo lido = R$ 973,95.
- [x] Parcelas da mesma compra com a mesma data (SHEIN 2/3 e 3/3) são **ambas** mantidas.
- Conferência sem tocar no banco: `npx tsx scripts/check-pdf-import.ts <arquivo.pdf> [csv do período]`.

## Fora de escopo

Correção manual de linhas puladas; desfazer import (nice-to-have futuro); múltiplos arquivos de uma
vez na tela (a linha de comando aceita vários); PDF com senha; formatos além dos descritos.
