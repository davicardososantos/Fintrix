# Spec 003 — Atribuição por pessoa (E3)

- **Épico:** E3 · **Fase:** 3 · **Status:** Draft
- **Depende de:** [001](../001-importacao-arquivos/spec.md), [002](../002-transacoes-categorizacao/spec.md)

## Objetivo

Saber **quem** do casal fez cada gasto/entrada — **eu**, **esposa** ou **casal** — para gerar o
placar "quem está gastando mais" e permitir cortes direcionados. Atribuir automaticamente quando o
dado permitir e deixar reatribuir fácil no celular.

## Escopo

**Dentro:** atribuição automática por pistas do arquivo; reatribuição manual (individual e em massa);
seletor "Eu / Esposa / Casal"; base para o comparativo por pessoa nos relatórios.
**Fora:** o relatório comparativo em si (spec 006); divisão proporcional de um gasto entre pessoas
(futuro).

## Requisitos funcionais

- **RF1** Cada transação tem `ownerId` (FK → User) ou **null = casal**.
- **RF2** **Atribuição automática:** fatura C6 traz `Nome no Cartão` → casar com o `User` (ou com o
  `defaultOwnerId` da conta/cartão). Extrato/Alelo → default configurável (ex.: Davi ou casal).
- **RF3** Usuário pode **reatribuir** uma transação (Eu/Esposa/Casal) pelo sheet de edição.
- **RF4** Usuário pode reatribuir **em massa** (seleção múltipla ou por filtro → aplicar pessoa).
- **RF5** Regra opcional: mapear `Nome no Cartão`/`last4` → pessoa, para automatizar próximos imports.
- **RF6** O seletor "Eu / Esposa / Casal" é um componente reutilizável (lançamento, filtros,
  relatórios).

## Regras de negócio

- `ownerId = null` significa **casal** (gasto compartilhado), não "sem dono".
- Atribuição automática **não** sobrescreve uma atribuição **manual** anterior.
- O mapeamento nome-do-cartão → pessoa é por household e reaproveitado em imports futuros.

## Critérios de aceite (contrato)

- [ ] Transações da fatura com `Nome no Cartão = DAVI CARDOSO` são atribuídas ao usuário Davi
      automaticamente.
- [ ] Transações de extrato/Alelo recebem o default configurado.
- [ ] Reatribuir uma transação para "Esposa" persiste e não é revertida por reimport.
- [ ] Reatribuição em massa aplica a pessoa a todas as selecionadas.
- [ ] O seletor Eu/Esposa/Casal aparece e funciona em edição e filtros.

## Fora de escopo

Rateio de um mesmo gasto entre duas pessoas (ex.: 50/50); papéis além de dois cônjuges.
