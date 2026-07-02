# Spec 006 — Dashboard + Relatórios (E6)

- **Épico:** E6 · **Fase:** 4 · **Status:** Draft
- **Depende de:** [001](../001-importacao-arquivos/spec.md), [002](../002-transacoes-categorizacao/spec.md), [003](../003-atribuicao-pessoa/spec.md)

## Objetivo

Transformar os dados em **decisão**: mostrar quanto entrou/saiu, onde o casal gasta mais, quem gasta
mais e se está conseguindo **reduzir** mês a mês — tudo mobile-first, com bastante filtro. É o
coração do produto.

## Escopo

**Dentro:** dashboard (resumo do mês); relatórios por categoria, por pessoa, por mês; evolução
mês-a-mês; filtros combináveis; gráficos legíveis no celular.
**Fora:** orçamento/metas, previsões, exportação (futuro).

## Requisitos funcionais

### Dashboard (tela inicial)
- **RF1** Card do mês atual: **entrou**, **saiu**, **saldo** (com comparação vs. mês anterior:
  subiu/caiu, cor `positive`/`negative`).
- **RF2** Top categorias do mês (gráfico + lista) e **últimas transações**.
- **RF3** Mini-placar **Eu × Esposa × Casal** do mês (quem gastou mais).
- **RF4** Atalhos: importar, ver transações, relatórios.

### Relatórios
- **RF5** **Por categoria:** total por categoria no período, ordenado, com % do total e comparação
  com período anterior.
- **RF6** **Por pessoa:** total Eu / Esposa / Casal no período.
- **RF7** **Por mês / evolução:** série mensal de saída (e entrada), para ver tendência de
  redução/aumento.
- **RF8** **Filtros combináveis:** período (mês, intervalo), categoria, pessoa, conta/fonte, texto.
- **RF9** Tocar num item do gráfico/lista → **drill-down** para as transações daquele recorte.

## Regras de negócio

- Todos os relatórios respeitam os **filtros ativos** e o **household** da sessão.
- Somatórios em **centavos**; exibição pt-BR via `<Money />`.
- "Casal" = transações com `ownerId = null`. O placar por pessoa distribui: Eu / Esposa / Casal.
- Comparação "mês anterior" = mesmo tipo de recorte no período imediatamente anterior.

## Critérios de aceite (contrato)

- [ ] Dashboard mostra entrou/saiu/saldo do mês corretos e a variação vs. mês anterior.
- [ ] Relatório por categoria bate com a soma das transações do período.
- [ ] Relatório por pessoa mostra Eu/Esposa/Casal e identifica quem gastou mais.
- [ ] Evolução mensal permite ver se a saída **reduziu** vs. meses anteriores.
- [ ] Filtros (período/categoria/pessoa/conta/texto) alteram todos os números coerentemente.
- [ ] Drill-down abre exatamente as transações do recorte tocado.
- [ ] Gráficos legíveis no celular e usando cores do [theme.md](../../theme.md).

## Fora de escopo

Orçamento/metas, alertas, previsões, exportação PDF/planilha (candidatos a fases futuras).
