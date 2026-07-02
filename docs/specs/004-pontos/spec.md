# Spec 004 — Pontos de fidelidade (E4)

- **Épico:** E4 · **Fase:** 5 · **Status:** Draft

## Objetivo

Acompanhar os saldos dos programas de pontos do casal — **Smiles, Livelo, Azul, Latam** — com
**atualização manual**, para ter tudo num lugar só e ver a evolução ao longo do tempo.

## Escopo

**Dentro:** cadastrar programas; registrar saldo manualmente numa data; ver saldo atual e histórico;
atribuir programa a uma pessoa ou ao casal.
**Fora:** integração/scraping automático com os programas; valoração em R$ dos pontos; alertas de
expiração (futuro).

## Requisitos funcionais

- **RF1** Programas suportados no MVP: **Smiles, Livelo, Azul, Latam** (enum), cada um opcionalmente
  ligado a uma pessoa (ou casal).
- **RF2** Usuário **atualiza o saldo** informando `balance` + `date` (+ nota opcional) →
  cria um `PointsSnapshot`.
- **RF3** Tela lista cada programa com **saldo mais recente** e variação desde a leitura anterior.
- **RF4** Detalhe do programa mostra o **histórico** de snapshots (evolução).
- **RF5** Mobile-first: atualizar saldo é rápido (poucos toques, teclado numérico).

## Regras de negócio

- Saldo é **snapshot manual** — o "atual" é sempre o snapshot de data mais recente.
- Pontos são inteiros (sem centavos).

## Critérios de aceite (contrato)

- [ ] Cadastrar os 4 programas e atribuir a Eu/Esposa/Casal.
- [ ] Registrar um saldo cria snapshot e vira o "atual".
- [ ] Novo saldo mostra a variação vs. o anterior.
- [ ] Histórico do programa lista os snapshots por data.

## Fora de escopo

Conversão automática de pontos↔R$, integração com as companhias, regras de expiração.
