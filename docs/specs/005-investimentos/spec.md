# Spec 005 — Investimentos (E5)

- **Épico:** E5 · **Fase:** 5 · **Status:** Draft

## Objetivo

Registrar e acompanhar investimentos **conservadores** do casal — hoje um **CDB no C6** — para ver o
patrimônio investido junto do resto da vida financeira. Atualização manual do valor atual.

## Escopo

**Dentro:** cadastrar investimento (principal, data, tipo, instituição, vencimento, dono); atualizar
valor atual manualmente (snapshot); ver total investido e rendimento aproximado.
**Fora:** cotação automática, cálculo de imposto/IR, integração com corretora, projeções.

## Requisitos funcionais

- **RF1** Cadastrar `Investment`: nome, `type` (`cdb`/`other`), instituição, `principalCents`,
  `appliedAt`, `maturityAt?`, dono (pessoa/casal).
- **RF2** Atualizar **valor atual** cria `InvestmentSnapshot` (`valueCents`, `date`).
- **RF3** Tela lista investimentos com principal, valor atual e **rendimento** (atual − principal,
  R$ e %).
- **RF4** Card de **total investido** (soma dos valores atuais) na área e/ou no dashboard.
- **RF5** Detalhe mostra histórico de snapshots.

## Regras de negócio

- Valores em **centavos** (inteiro).
- "Valor atual" = snapshot mais recente; se não houver snapshot, usa o principal.
- Rendimento é informativo (baseado no que o usuário informou), sem cálculo de mercado.

## Critérios de aceite (contrato)

- [ ] Cadastrar o CDB C6 (principal, datas, dono).
- [ ] Atualizar o valor atual cria snapshot e recalcula rendimento (R$ e %).
- [ ] Total investido soma corretamente os valores atuais.
- [ ] Histórico lista os snapshots por data.

## Fora de escopo

Cálculo automático de rendimento/IR, integração com instituições, projeções futuras.
