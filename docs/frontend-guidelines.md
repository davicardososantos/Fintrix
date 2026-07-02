# Frontend Guidelines — Fintrix

> Boas práticas de **código** de frontend. Complementa [theme.md](./theme.md) (visual) e
> [design-system.md](./design-system.md) (comportamento). Curto e prático — do / don't.

## 1. Regras inegociáveis

1. **Só tokens do tema.** Cor, spacing, radius, tipografia vêm de classes utilitárias mapeadas ao
   [theme.md](./theme.md). **Nunca** hex cru, `style={{}}` com valores mágicos, nem `bg-[#...]`.
2. **Dinheiro nunca é `float`** e nunca é formatado à mão — use o helper/componente `<Money />` e
   `lib/money.ts` (centavos).
3. **Validação Zod nas bordas.** Todo form/upload/entrada de API valida com Zod antes de agir.
4. **Toda leitura escopada por household.** Componentes de dados nunca assumem "todos os dados";
   sempre do household da sessão.

## 2. Componentes

- **Server Components por padrão.** `"use client"` só quando precisar de estado/efeito/evento.
- **Pequenos e compostos.** Um componente = uma responsabilidade. Extraia quando passar de ~150 linhas.
- **Props tipadas** (TS estrito). Sem `any`. Variantes via `cva` (class-variance-authority), não
  condicional de string solta.
- **`ui/` = primitivos** (shadcn, sem regra de negócio). Domínio fica em componentes acima de `ui/`.
- **Nomeie por domínio:** `TransactionListItem`, `MonthSummaryCard`, `PersonToggle` — não `Box2`.

## 3. Estilo (Tailwind)

- Ordene classes por: layout → box → tipografia → cor → estado. Use `cn()` (clsx+tailwind-merge) para
  compor/condicionar classes.
- Nada de CSS solto por componente, exceto casos raríssimos (documentar). Tudo via utilitário.
- Responsivo mobile-first: escreva o mobile primeiro; use breakpoints (`sm:`, `md:`) só para
  **crescer** para telas maiores, nunca o contrário.

## 4. Estado e dados

- **Server first:** buscar dados em Server Components / Server Actions quando possível.
- Estado de servidor no cliente: **React Query** (cache, revalidação), não `useEffect` + `fetch` manual.
- Estado local mínimo; derive em vez de duplicar. Evite "prop drilling" — componha.
- Mutations otimistas em ações rápidas (ex.: reatribuir pessoa), com rollback em erro.

## 5. Acessibilidade

- Todo interativo é focável, tem `ring` de foco e rótulo acessível.
- Alvos de toque ≥ 44px. Inputs com `<label>`.
- Não comunicar só por cor (usar ícone/sinal também). Respeitar `prefers-reduced-motion`.

## 6. Performance

- Listas longas: paginação ou virtualização.
- Imagens com `next/image`; ícones do set único (`lucide-react`).
- Evite client bundles gordos: mantenha libs pesadas no servidor.

## 7. Formatação e qualidade

- **ESLint + Prettier** obrigatórios (configurados na Fase 1). Sem warnings no commit.
- pt-BR na UI, código/identificadores em inglês.
- Nada de `console.log` de dado sensível. Sem segredo no cliente (chave Gemini é server-side).

## 8. Checklist de PR (frontend)

- [ ] Usa só tokens do tema (nenhum hex/spacing mágico).
- [ ] Cobre estados: loading / vazio / erro / conteúdo.
- [ ] Funciona bem em tela de celular (testado em viewport pequeno).
- [ ] Acessível (foco, rótulo, toque ≥ 44px, não-só-cor).
- [ ] Dinheiro via `<Money />` (centavos).
- [ ] Sem `any`; validação Zod nas entradas.
