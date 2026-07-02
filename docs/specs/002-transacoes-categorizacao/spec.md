# Spec 002 — Transações + Categorização (E2)

- **Épico:** E2 · **Fase:** 3 · **Status:** Draft
- **Depende de:** [001 importação](../001-importacao-arquivos/spec.md). **Relaciona:** [003 atribuição](../003-atribuicao-pessoa/spec.md)

## Objetivo

Dar a cada transação uma **categoria** confiável com o mínimo de trabalho manual, combinando: a
categoria nativa da fatura C6, **regras** por palavra-chave, a **IA Gemini** para o que sobrar, e
**edição manual** sempre disponível. E oferecer uma tela de **listagem/edição** de transações.

## Escopo

**Dentro:** pipeline de categorização (C6 → regra → Gemini → fallback); CRUD de categorias e regras;
lista de transações com filtro/busca; editar categoria (e disparar reprocesso); criar regra a partir
de uma transação.
**Fora:** relatórios (spec 006); atribuição de pessoa (spec 003, mas a tela reusa os mesmos itens).

## Requisitos funcionais

- **RF1** Após import, cada transação passa pelo **pipeline** na ordem:
  1. **C6:** se veio `rawCategory` (fatura), mapeia para uma `Category` do household →
     `categorySource=c6`.
  2. **Regra:** se alguma `CategoryRule` casar a descrição (ex.: `METRO`→Transporte) →
     `categorySource=rule`.
  3. **Gemini:** para as demais, chamar a IA **em lote**, recebendo `{descrição}→categoria` dentre a
     lista de categorias do household → `categorySource=ai`.
  4. **Fallback:** se o Gemini falhar/estourar/indisponível → deixa `uncategorized` (nunca bloqueia).
- **RF2** Categorização roda **sem bloquear** o import (assíncrona/em lote); erro de IA não quebra o
  fluxo.
- **RF3** Usuário vê a **lista de transações** (mais recentes primeiro) com descrição, valor
  (colorido), data, categoria e pessoa.
- **RF4** Usuário pode **editar a categoria** de uma transação → `categorySource=manual` (nunca é
  sobrescrita depois pela IA).
- **RF5** Usuário pode **criar/editar/excluir categorias** (nome, tipo, cor via token do tema).
- **RF6** Usuário pode **criar uma regra** a partir de uma transação ("sempre que contiver X → Y"),
  opção de **aplicar retroativamente**.
- **RF7** Filtros na lista: período, categoria, pessoa, conta, texto; e filtro "só não
  categorizadas".
- **RF8** Categorias `manual` e regras têm **prioridade** sobre a IA em reprocessos futuros.

## Regras de negócio

- **Precedência de fonte:** `manual` > `rule` > `c6` > `ai` > `uncategorized`. Um reprocesso nunca
  rebaixa uma categoria `manual`.
- **Gemini server-side:** a chave (`GEMINI_API_KEY`) só no servidor; enviar **apenas** descrição e a
  lista de categorias — nunca dados de identificação além do necessário.
- **Lote + cache:** agrupar descrições iguais; cachear resultado por descrição normalizada para não
  repetir chamada.
- **Categorias-semente:** criar um conjunto inicial (Transporte, Supermercado, Restaurante, Saúde,
  Moradia, Lazer, Serviços, Renda, Investimento, Outros) mapeando as categorias da C6.

## Critérios de aceite (contrato)

- [ ] Transação da fatura com `Categoria` da C6 recebe a categoria correspondente (`source=c6`).
- [ ] Transação com descrição "METRO..." cai em Transporte por **regra** (`source=rule`).
- [ ] Transação de extrato/Alelo sem categoria é classificada pelo **Gemini** (`source=ai`).
- [ ] Com Gemini indisponível, o import conclui e as transações ficam `uncategorized` (sem travar).
- [ ] Editar categoria manualmente fixa `source=manual` e sobrevive a um reprocesso.
- [ ] Criar regra com "aplicar retroativo" recategoriza as transações passadas que casam.
- [ ] Meta de cobertura: **≥ 80%** das transações dos 3 arquivos ficam categorizadas
      automaticamente.
- [ ] Filtros da lista (período/categoria/pessoa/conta/"não categorizadas") funcionam.

## Fora de escopo

Aprendizado automático de regras a partir de correções; categorização multi-nível complexa;
sugestão proativa de novas categorias.
