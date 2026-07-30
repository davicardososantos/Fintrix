# Modelo de Dados — Fintrix

> Entidades do domínio e como se relacionam. É a referência para o `prisma/schema.prisma`.
> Nomes aqui **devem** bater com os usados nos [specs/](./specs/). Regras de dinheiro e dedup vêm
> da [constitution.md](./constitution.md).

## Princípios

- **Dinheiro em centavos (inteiro).** Campo `amountCents: Int` + `currency` (`BRL` por padrão).
  Nunca `float`.
- **Isolamento por household.** Quase toda entidade tem `householdId`. Toda query é escopada por ele.
- **Import idempotente.** `Transaction` carrega uma `dedupHash` única por household (ver
  [specs/001](./specs/001-importacao-arquivos/spec.md)).
- **Sinal do valor:** `amountCents` positivo = **entrada/crédito**; negativo = **saída/gasto**.
  (helpers em `lib/money.ts`).

## Diagrama (ERD textual)

```
Household 1───* User
Household 1───* Account
Household 1───* Category ──* CategoryRule
Household 1───* ImportBatch 1───* Transaction
Household 1───* Transaction *───1 Category
Household 1───* Transaction *───0..1 User (atribuição pessoa)
Household 1───* Transaction *───0..1 Account
Household 1───* PointsProgram 1───* PointsSnapshot
Household 1───* Investment 1───* InvestmentSnapshot
```

## Entidades

### Household
A "família"/casal. Raiz de isolamento.
| Campo | Tipo | Notas |
|---|---|---|
| id | String (cuid) | PK |
| name | String | ex.: "Casa Davi & Esposa" |
| createdAt | DateTime | |

### User
Cônjuge com login próprio (NextAuth).
| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK |
| householdId | String | FK → Household |
| name | String | "Davi", "Esposa" — usado na atribuição |
| email | String | único |
| passwordHash | String | (ou provider NextAuth) |
| role | Enum(`owner`,`member`) | Davi = owner |
| createdAt | DateTime | |

> Além de `User`, o NextAuth pode exigir tabelas `Account`(oauth)/`Session`/`VerificationToken`.
> Para evitar colisão de nome com a nossa conta financeira, a entidade financeira abaixo se chama
> **`Account`** no domínio, mas se houver conflito com NextAuth usaremos `FinancialAccount` no schema
> (decisão travada na Fase 1).

### Account (conta/fonte financeira)
De onde vêm as transações: conta C6, cartão C6, Alelo, dinheiro, etc.
| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK |
| householdId | String | FK |
| name | String | "C6 Conta", "C6 Cartão 4125", "Alelo" |
| type | Enum(`checking`,`credit_card`,`meal_voucher`,`cash`,`other`) | |
| institution | String? | "C6", "Alelo" |
| last4 | String? | final do cartão (fatura) |
| defaultOwnerId | String? | FK → User (dono default p/ atribuição) |

### ImportBatch
Um upload de arquivo. Dá rastreabilidade e permite desfazer.
| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK |
| householdId | String | FK |
| source | Enum(`c6_extrato`,`c6_fatura`,`alelo`) | fonte detectada |
| fileName | String | nome original |
| fileHash | String | hash do arquivo (detectar reupload do mesmo arquivo) |
| importedById | String | FK → User |
| periodStart / periodEnd | DateTime? | período detectado no arquivo |
| totalRows / importedRows / skippedRows | Int | resumo |
| createdAt | DateTime | |

### Transaction
O registro central.
| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK |
| householdId | String | FK |
| importBatchId | String? | FK → ImportBatch (null se lançado à mão) |
| accountId | String? | FK → Account |
| date | DateTime | data do lançamento/compra |
| description | String | descrição normalizada |
| rawDescription | String? | texto original do arquivo |
| amountCents | Int | + entrada / − saída |
| currency | String | default "BRL" |
| fxAmountCents | Int? | valor em moeda estrangeira (fatura US$) |
| fxCurrency | String? | ex.: "USD" |
| categoryId | String? | FK → Category |
| categorySource | Enum(`c6`,`rule`,`ai`,`manual`,`uncategorized`) | procedência da categoria |
| ownerId | String? | FK → User (atribuição); null = **casal** |
| installment | String? | "Única", "2/10" (fatura) |
| dedupHash | String | **único por household** (ver spec 001) |
| createdAt | DateTime | |

### Category
| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK |
| householdId | String | FK |
| name | String | "Transporte", "Supermercado"... |
| kind | Enum(`expense`,`income`,`transfer`,`investment`) | |
| color | String? | referencia token do tema, não hex cru |
| parentId | String? | subcategorias (opcional) |

### CategoryRule
Regra determinística de categorização (roda antes do Gemini).
| Campo | Tipo | Notas |
|---|---|---|
| id | String | PK |
| householdId | String | FK |
| matchType | Enum(`contains`,`regex`,`equals`) | |
| pattern | String | ex.: "METRO", "C6TAG PEDAGIO" |
| categoryId | String | FK → Category |
| priority | Int | ordem de avaliação |

### PointsProgram + PointsSnapshot
Pontos de fidelidade, atualização manual.
| PointsProgram | Tipo | Notas |
|---|---|---|
| id / householdId | | |
| name | Enum(`smiles`,`livelo`,`azul`,`latam`) | |
| ownerId | String? | de quem é o programa (ou casal) |

| PointsSnapshot | Tipo | Notas |
|---|---|---|
| id / programId | | FK → PointsProgram |
| balance | Int | saldo de pontos |
| date | DateTime | data da leitura |
| note | String? | |

### Investment + InvestmentSnapshot
Investimentos conservadores (CDB C6).
| Investment | Tipo | Notas |
|---|---|---|
| id / householdId | | |
| name | String | "CDB C6" |
| type | Enum(`cdb`,`other`) | extensível |
| institution | String? | "C6" |
| principalCents | Int | valor aplicado |
| appliedAt | DateTime | data da aplicação |
| maturityAt | DateTime? | vencimento |
| ownerId | String? | dono (ou casal) |

| InvestmentSnapshot | Tipo | Notas |
|---|---|---|
| id / investmentId | | FK |
| valueCents | Int | valor atual (atualização manual) |
| date | DateTime | |

### Bill + BillPayment + BillPeriodAmount
Contas a pagar (lembretes de vencimento). `Bill` é um **template**: as ocorrências de cada mês
são calculadas na leitura (`src/lib/bills.ts`), nada é pré-gerado.

| Bill | Tipo | Notas |
|---|---|---|
| id / householdId | | |
| name | String | |
| amountCents | Int? | valor esperado (null = variável, ex.: energia) |
| recurrence | Enum(`monthly`,`one_time`) | |
| dueDay | Int? | 1-31, para as mensais (limitado aos dias do mês na leitura) |
| dueDate | DateTime? | para as avulsas |
| ownerId | String? | null = casal |
| parentId | String? | conta cobrada **dentro da fatura** de outra — só 1 nível |
| active | Boolean | |

`parentId` é o agrupamento "dentro da fatura" (ex.: Seguro e Arquiteta dentro do Cartão): o filho
herda o vencimento do pai, não tem `dueDay` próprio e é pago junto com ele. Na tela o pai exibe o
**restante** (total informado − soma dos filhos), então somar as linhas dá o total da fatura.
FK `ON DELETE SET NULL`: apagar a fatura promove os filhos a contas soltas, não os destrói.

| BillPayment | Tipo | Notas |
|---|---|---|
| id / billId / householdId | | |
| periodKey | String | "YYYY-MM" — **único** com billId |
| paidAt | DateTime | |
| amountCents | Int? | valor efetivamente pago |

**A existência da linha é o "pago"**; ausência = não paga. Desmarcar apaga a linha. Num grupo, o
pai guarda o total da fatura e cada filho o valor dele — qualquer agregado futuro de "quanto
pagamos" precisa excluir `bill.parentId != null`, senão conta em dobro.

| BillPeriodAmount | Tipo | Notas |
|---|---|---|
| id / billId / householdId | | |
| periodKey | String | "YYYY-MM" — **único** com billId |
| amountCents | Int | valor informado só para este mês |

Sobrepõe `Bill.amountCents` naquele período. Usos: total da fatura do cartão (digitado **antes**
de pagar, por isso não cabe em `BillPayment`) e contas que variam todo mês. Ausência = usa o valor
cadastrado; "limpar o valor do mês" apaga a linha (nunca grava null).

> O importador da fatura C6 também grava essas compras como `Transaction`, e nada liga `Bill` ↔
> `Transaction`. O "Total do mês" de /contas-a-pagar é total de **lembrete** — nunca somar com os
> gastos do dashboard.

## Índices importantes

- `Transaction(householdId, dedupHash)` **único** — garante idempotência do import.
- `Transaction(householdId, date)` — relatórios por período.
- `Transaction(householdId, categoryId)` / `(householdId, ownerId)` — relatórios por categoria/pessoa.
- `ImportBatch(householdId, fileHash)` — detectar reupload do mesmo arquivo.
- `BillPayment(billId, periodKey)` **único** — marcar paga é idempotente por mês.
- `BillPeriodAmount(billId, periodKey)` **único** — um valor informado por conta/mês.
- `Bill(parentId)` — montar os grupos "dentro da fatura".
