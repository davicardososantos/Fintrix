# Design System — Fintrix (mobile-first, app-like)

> Como as telas se comportam e se compõem. As **cores/tokens** vêm de [theme.md](./theme.md); as
> **regras de código** de [frontend-guidelines.md](./frontend-guidelines.md). Aqui: navegação,
> layout, componentes e padrões de interação com **cara de app**.

## 1. Princípios de UX mobile

1. **Uma mão, um polegar.** Ações principais no alcance do polegar (parte inferior). Nada crítico no
   topo distante.
2. **Uma tarefa por tela.** Telas focadas, sem poluição. Detalhe/edição em **bottom sheet** ou tela
   dedicada, não modais grandes.
3. **Feedback imediato.** Toda ação tem estado (loading/success/error). Skeleton em vez de spinner
   solto quando possível.
4. **Offline não quebra.** O que já carregou continua visível (ver [pwa.md](./pwa.md)).
5. **Dinheiro legível.** Valores com `tabular-nums`, sinal e cor (`positive`/`negative`), moeda clara.

## 2. Navegação

- **Bottom navigation** (tab bar) com 5 destinos no MVP:
  `Início (dashboard)` · `Transações` · `Importar (+)` · `Relatórios` · `Mais (pontos/investimentos/config)`.
- Botão central `+` em destaque (ação primária = importar/lançar).
- Header curto por tela (título + ação contextual à direita).
- Navegação de detalhe empilha (push) com transição estilo app; voltar por gesto/seta.

```
┌───────────────────────────┐
│  Header: Início      ⚙︎    │
│                           │
│   [ saldo do mês ]        │
│   [ entrou | saiu ]       │
│   [ gráfico categorias ]  │
│   [ últimas transações ]  │
│                           │
├───────────────────────────┤
│  🏠    📄   ➕   📊    ⋯   │  ← bottom-nav
└───────────────────────────┘
```

## 3. Componentes-base (via shadcn/ui, tematizados)

Todos herdam tokens do tema. Núcleo do MVP:

- **Button** (`primary`, `secondary`, `ghost`, `destructive`) — altura mín. 44px.
- **Card** — superfície `card`, radius `lg`, sombra `sm`. Bloco visual padrão.
- **Bottom Sheet / Drawer** — para detalhe, edição, filtros (em vez de modal desktop).
- **Input / Select / DatePicker** — campos com label, erro (Zod) e teclado adequado (numérico p/
  valores). Fonte mín. 16px (evita zoom iOS).
- **Tabs / Segmented control** — ex.: alternar "Eu / Esposa / Casal", "Mês / Categoria".
- **Chip / Badge** — categoria, pessoa, status. Pill (`radius full`).
- **List item de transação** — ícone de categoria + descrição + data à esquerda; valor colorido à
  direita. Toque abre o sheet de edição.
- **Stat / KPI tile** — número grande (`display`), rótulo `caption`, delta colorido (subiu/caiu).
- **Empty state** — ilustração/ícone + texto + ação (ex.: "Nenhuma transação. Importar arquivo").
- **Skeleton** — placeholders de carregamento.
- **Toast** — confirmação de ações (import concluído, salvo).

## 4. Padrões de domínio

- **Valor monetário:** componente único `<Money value amountCents currency />` que aplica cor
  (`positive`/`negative`), sinal e formato pt-BR (`R$ 1.234,56`). Nunca formatar dinheiro à mão.
- **Seletor de pessoa:** segmented `Eu · Esposa · Casal`, presente em lançamento, filtros e relatórios.
- **Categoria:** chip com ícone + cor do token da categoria (referência de token, não hex).
- **Cartão de resumo do mês:** entrou / saiu / saldo, com comparação vs. mês anterior.

## 5. Estados obrigatórios por tela

Toda tela/lista precisa cobrir: **loading** (skeleton), **vazio** (empty state com ação), **erro**
(mensagem + retry), **conteúdo**. Sem "tela branca" ou spinner infinito.

## 6. Gráficos / dataviz

Relatórios usam gráficos (categorias, evolução mensal). Regras: usar as cores do tema, garantir
legibilidade no mobile (poucos itens, rótulos claros, tap para detalhe) e acessibilidade (não só
cor). Biblioteca (ex.: Recharts) travada no spec de relatórios
([specs/006](./specs/006-dashboard-relatorios/spec.md)).

## 7. Ícones

Um único set (ex.: `lucide-react`), tamanho e stroke consistentes, herdando `currentColor` do token.
