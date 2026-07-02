# Tema do Fintrix — Fonte única da verdade visual

> **Regra de ouro ([constitution.md](./constitution.md) §4.1):** todo componente consome os **tokens
> semânticos** abaixo. É proibido hex cru, spacing mágico ou tipografia fora do tema no código de
> UI. Quer uma cor nova? Adiciona um token aqui primeiro.

- **Direção visual escolhida:** **Verde/Teal financeiro** — clima de dinheiro, confiança, clean e
  moderno, com cara de banco digital.
- **Modos:** Light **e** Dark (app mobile precisa dos dois). Estratégia: classe `.dark` no `<html>`.
- **Implementação:** os tokens viram **CSS variables** em `globals.css` e são mapeados no
  `tailwind.config` + nas variáveis do shadcn/ui. Um token = uma variável = uma classe utilitária.

---

## 1. Paleta de marca (cores base)

Cores "cruas" — **não usar direto em componente**; existem para derivar os tokens semânticos.

### Primária — Teal (`brand`)
| Escala | Hex |
|---|---|
| 50  | `#ECFDF5` |
| 100 | `#D1FAE5` |
| 200 | `#A7F3D0` |
| 300 | `#6EE7B7` |
| 400 | `#34D399` |
| 500 | `#0E9F6E` ← **primária** |
| 600 | `#0B8560` |
| 700 | `#096A4E` |
| 800 | `#07533E` |
| 900 | `#05372A` |

### Acento — Turquesa (`accent`)
`#14B8A6` (400: `#2DD4BF`, 600: `#0D9488`)

### Neutros (surface/texto)
Escala slate: `#F8FAFC` (50) · `#E2E8F0` (200) · `#94A3B8` (400) · `#475569` (600) · `#1E293B`
(800) · `#0F172A` (900).

### Cores funcionais
| Uso | Hex |
|---|---|
| Positivo (entrada/crédito) | `#16A34A` |
| Negativo (saída/gasto)     | `#EF4444` |
| Warning                    | `#F59E0B` |
| Investimento               | `#0EA5E9` |
| Pontos                     | `#8B5CF6` |

---

## 2. Tokens semânticos (o que o código usa)

Cada token tem valor em **light** e **dark**. Nomes compatíveis com shadcn/ui + extensões de domínio.

| Token | Light | Dark | Uso |
|---|---|---|---|
| `background`            | `#F8FAFC` | `#0B1220` | fundo da página |
| `foreground`           | `#0F172A` | `#E2E8F0` | texto principal |
| `card`                 | `#FFFFFF` | `#0F172A` | superfície de card |
| `card-foreground`      | `#0F172A` | `#E2E8F0` | texto no card |
| `popover`              | `#FFFFFF` | `#0F172A` | menus/sheets |
| `primary`             | `#0E9F6E` | `#34D399` | ação principal, marca |
| `primary-foreground`   | `#FFFFFF` | `#05372A` | texto sobre primary |
| `secondary`            | `#E2E8F0` | `#1E293B` | ação secundária |
| `secondary-foreground` | `#0F172A` | `#E2E8F0` | texto sobre secondary |
| `muted`                | `#F1F5F9` | `#1E293B` | fundo sutil |
| `muted-foreground`     | `#64748B` | `#94A3B8` | texto secundário/legenda |
| `accent`               | `#14B8A6` | `#2DD4BF` | destaque, links |
| `accent-foreground`    | `#052E2B` | `#052E2B` | texto sobre accent |
| `border`               | `#E2E8F0` | `#1E293B` | bordas/divisores |
| `input`                | `#E2E8F0` | `#334155` | borda de campos |
| `ring`                 | `#0E9F6E` | `#34D399` | foco (acessibilidade) |
| `destructive`          | `#EF4444` | `#F87171` | ações destrutivas |
| `destructive-foreground`| `#FFFFFF`| `#450A0A` | texto sobre destructive |
| **`positive`**         | `#16A34A` | `#4ADE80` | **entrada/crédito** (domínio) |
| **`negative`**         | `#EF4444` | `#F87171` | **saída/gasto** (domínio) |
| **`warning`**          | `#F59E0B` | `#FBBF24` | alerta/atenção |
| **`investment`**       | `#0EA5E9` | `#38BDF8` | módulo investimentos |
| **`points`**           | `#8B5CF6` | `#A78BFA` | módulo pontos |

> Tokens de domínio (`positive`, `negative`, `investment`, `points`) são **exclusivos do Fintrix** e
> essenciais: uma entrada é sempre verde-positivo, um gasto sempre vermelho-negativo, em todo o app.

---

## 3. Tipografia

- **Família:** `Inter` (fallback `system-ui, sans-serif`). Tabular numbers ligado para valores (`font-variant-numeric: tabular-nums`) — dinheiro alinha bonito.
- **Escala** (mobile-first):

| Token | Tamanho / line-height | Uso |
|---|---|---|
| `display` | 32 / 40, weight 700 | saldo grande no dashboard |
| `h1` | 24 / 32, 700 | título de tela |
| `h2` | 20 / 28, 600 | seção |
| `h3` | 18 / 26, 600 | subseção/card title |
| `body` | 16 / 24, 400 | texto padrão (mín. 16 evita zoom no iOS) |
| `sm` | 14 / 20, 400 | apoio |
| `caption` | 12 / 16, 500 | legendas, chips |

---

## 4. Espaçamento e layout

- **Base 4px.** Escala: `1=4 2=8 3=12 4=16 5=20 6=24 8=32 10=40 12=48`.
- **Container mobile:** largura total com padding lateral `16px` (`space-4`).
- **Touch target mínimo:** `44×44px` (regra de acessibilidade mobile).
- **Bottom-nav:** altura `64px` + safe-area inferior.
- **Safe areas:** respeitar notch/home-bar com `env(safe-area-inset-*)`.

## 5. Raio, sombra, elevação

- **Radius** (cara de app, cantos arredondados): `sm=8px`, `md=12px`, `lg=16px`, `xl=20px`,
  `full=9999px`. Padrão de card = `lg`; botão = `md`; chip/pill = `full`.
- **Sombras:** `sm` (cards em repouso), `md` (sheets/menus), `lg` (modais). Sutis; no dark mode a
  elevação vem mais de contraste de superfície do que de sombra.

## 6. Motion (feel de app)

- **Durações:** `fast=120ms`, `base=200ms`, `slow=320ms`.
- **Easing:** `ease-out` para entrada, `ease-in` para saída; `cubic-bezier(0.4,0,0.2,1)` padrão.
- Transições de página/sheet devem parecer nativas (slide/fade curtos). Respeitar
  `prefers-reduced-motion`.

---

## 7. Mapeamento técnico (token → CSS var → Tailwind)

Em `src/styles/globals.css` (valores HSL/hex por token, light e dark):

```css
:root {
  --background: 210 40% 98%;      /* #F8FAFC */
  --foreground: 222 47% 11%;      /* #0F172A */
  --card: 0 0% 100%;
  --primary: 158 84% 34%;         /* #0E9F6E */
  --primary-foreground: 0 0% 100%;
  --positive: 142 71% 45%;        /* #16A34A */
  --negative: 0 84% 60%;          /* #EF4444 */
  --investment: 199 89% 48%;      /* #0EA5E9 */
  --points: 258 90% 66%;          /* #8B5CF6 */
  --ring: 158 84% 34%;
  --radius: 16px;
  /* ...demais tokens... */
}
.dark {
  --background: 222 47% 8%;       /* #0B1220 */
  --foreground: 213 31% 91%;
  --primary: 158 64% 52%;         /* #34D399 */
  /* ...overrides dark de cada token... */
}
```

Em `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
      positive: "hsl(var(--positive))",
      negative: "hsl(var(--negative))",
      investment: "hsl(var(--investment))",
      points: "hsl(var(--points))",
      // ...
    },
    borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 4px)", sm: "calc(var(--radius) - 8px)" },
  },
}
```

Uso no componente (sempre token, nunca hex):

```tsx
// ✅ certo
<span className="text-positive tabular-nums">+ R$ 704,00</span>
<Card className="bg-card text-card-foreground rounded-lg" />

// ❌ errado — viola a constituição
<span style={{ color: "#16A34A" }}>+ R$ 704,00</span>
<div className="bg-[#0E9F6E]" />
```

## 8. Acessibilidade (obrigatório)

- Contraste **AA** (≥ 4.5:1 texto normal, ≥ 3:1 texto grande) validado em light **e** dark para
  todos os pares foreground/background. Validar ao adicionar/alterar token.
- Estado de foco visível via `ring` em todo elemento interativo.
- Não comunicar informação só por cor (entrada/saída também têm sinal `+`/`−` e/ou ícone).

## 9. Como adicionar/alterar um token (processo)

1. Adiciona/edita o token aqui (light + dark) com justificativa.
2. Reflete em `globals.css` (CSS var) e `tailwind.config`.
3. Valida contraste AA.
4. Usa via classe utilitária no componente. Nunca hardcode.
