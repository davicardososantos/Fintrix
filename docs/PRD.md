# PRD — Fintrix

> **Product Requirements Document.** É a "estrela-guia" do produto. Descreve **o quê** e **por quê**.
> O **como** técnico vive em [architecture.md](./architecture.md), [data-model.md](./data-model.md) e
> nos [specs/](./specs/). Documento vivo — atualizar quando o produto mudar.

- **Produto:** Fintrix — gestão financeira do casal
- **Dono:** Davi Cardoso
- **Status:** MVP (Fase 0 — fundação/documentação)
- **Última atualização:** 2026-07-02

---

## 1. Visão geral e problema

Hoje o casal não tem um lugar único para enxergar a vida financeira: os gastos estão espalhados em
faturas de cartão (C6), extrato de conta (C6), benefício alimentação (Alelo), pontos de fidelidade
(Smiles, Livelo, Azul, Latam) e um investimento (CDB C6). Sem consolidação, é difícil responder às
perguntas que realmente importam:

- Quanto **entrou** e quanto **saiu** este mês?
- **Onde** estamos gastando mais? Onde dá para **cortar**?
- **Quem** do casal está gastando mais (eu, esposa, ou gasto do casal)?
- Estamos conseguindo **reduzir** mês a mês?

O Fintrix resolve isso: importa os extratos, remove duplicatas, categoriza (com ajuda de IA),
atribui cada gasto a uma pessoa e gera relatórios que viram **decisão**.

## 2. Personas

| Persona | Quem é | Necessidade central |
|---|---|---|
| **Davi** | Dono do app, dev, perfil organizado, quer controle e relatórios ricos | Ver tudo consolidado, filtrar bastante, decidir onde cortar |
| **Esposa** | Coparticipante do casal | Lançar/ver gastos de forma simples no celular, sem fricção |
| **Casal** | A unidade financeira (`Household`) | Enxergar o conjunto e comparar "eu × esposa × casal" |

**Modelo "app do casal":** cada cônjuge tem sua **conta individual** (login próprio), mas ambos
pertencem ao mesmo **Household**. Todo registro financeiro é do household e **atribuível** a uma
pessoa ou ao "casal". Ver [specs/003](./specs/003-atribuicao-pessoa/spec.md).

## 3. Objetivos e métricas de sucesso

| # | Objetivo | Métrica de sucesso (MVP) |
|---|---|---|
| O1 | Consolidar entradas e saídas | Importar os 3 tipos de arquivo e ver saldo/entrada/saída do mês correto |
| O2 | Não repetir dados | Reimportar o mesmo arquivo → **0** transações duplicadas |
| O3 | Categorizar sem trabalho manual pesado | ≥ 80% das transações categorizadas automaticamente (C6 + regras + Gemini) |
| O4 | Saber quem gasta mais | Relatório "eu × esposa × casal" por mês |
| O5 | Gerar decisão | Relatório por categoria com comparação mês-a-mês (subiu/caiu) |
| O6 | Sensação de app | 100% usável no celular; instalável como PWA |

## 4. Escopo

### 4.1 Dentro do MVP

- **E1 — Importação de arquivos** (Alelo PDF, C6 extrato CSV, C6 fatura CSV) com deduplicação.
- **E2 — Transações + categorização** (categoria nativa da C6 + regras + **Gemini** + edição manual).
- **E3 — Atribuição por pessoa** (eu / esposa / casal).
- **E4 — Pontos** (Smiles, Livelo, Azul, Latam) com atualização manual de saldo.
- **E5 — Investimentos** conservadores (CDB C6) com registro e acompanhamento simples.
- **E6 — Dashboard + relatórios** (mensal, por categoria, por pessoa, com filtros).
- **Auth**: contas individuais (NextAuth) + Household.
- **PWA**: instalável, mobile-first.

### 4.2 Fora de escopo (por enquanto)

- Integração automática (Open Finance / API de banco) — importação é por upload de arquivo.
- Multiusuário além do casal (compartilhar com terceiros, contador etc.).
- Metas/orçamento avançado, alertas push, projeções futuras (candidatos a fases seguintes).
- App nativo puro (React Native/Flutter) — o caminho é PWA primeiro.
- Câmbio ao vivo / cotação automática de investimentos.

## 5. Épicos (funcionalidades)

### E1 — Importação de arquivos
Upload de arquivo → parser identifica a fonte → normaliza transações → **dedup** → salva no household.
Fontes no MVP: **C6 Extrato** (CSV), **C6 Fatura** (CSV), **Alelo** (PDF). Detalhes e regra de dedup:
[specs/001](./specs/001-importacao-arquivos/spec.md).

### E2 — Transações + categorização
Cada transação tem descrição, valor (centavos), data, conta/fonte, moeda, categoria e pessoa.
Categorização: (1) categoria nativa da fatura C6 como semente; (2) regras por palavra-chave
(ex.: `METRO`→Transporte); (3) **Gemini** para o que sobrar; (4) edição manual sempre possível.
Detalhes: [specs/002](./specs/002-transacoes-categorizacao/spec.md).

### E3 — Atribuição por pessoa
Cada transação é atribuída a **eu / esposa / casal**. A fatura traz `Nome no Cartão` → atribuição
automática. Permite reatribuir manualmente e ver o placar "quem gastou mais".
Detalhes: [specs/003](./specs/003-atribuicao-pessoa/spec.md).

### E4 — Pontos
Área para acompanhar saldo de **Smiles, Livelo, Azul, Latam**, com **atualização manual** (o usuário
digita o saldo atual e a data). Histórico simples de evolução. Detalhes:
[specs/004](./specs/004-pontos/spec.md).

### E5 — Investimentos
Registro de investimentos conservadores (hoje: **CDB C6**): valor aplicado, data, tipo, e valor
atual (atualizável manualmente). Visão de patrimônio investido. Detalhes:
[specs/005](./specs/005-investimentos/spec.md).

### E6 — Dashboard + relatórios
Tela inicial com resumo do mês (entrou/saiu/saldo). Relatórios: por categoria, por pessoa, por mês,
evolução mês-a-mês, com filtros (período, categoria, pessoa, conta). É o coração do produto (decisão).
Detalhes: [specs/006](./specs/006-dashboard-relatorios/spec.md).

## 6. Requisitos não-funcionais

- **Mobile-first / app-like:** navegação por bottom-tab, gestos, alvos de toque ≥ 44px, safe-areas.
- **PWA:** manifest + service worker + ícones; instalável e utilizável offline no básico (ver
  transações já carregadas). Ver [pwa.md](./pwa.md).
- **Privacidade/segurança (LGPD):** dados só do casal; senhas com hash; sem exposição de dados
  sensíveis em logs; API key do Gemini fora do cliente (server-side).
- **Consistência visual:** todo o front segue [theme.md](./theme.md) (tema Verde/Teal).
- **Performance:** telas de lista com paginação/virtualização; importação processa em lote.
- **Confiabilidade dos dados:** dinheiro em centavos (inteiro); import idempotente.

## 7. Stack e arquitetura (resumo)

Next.js 15 (App Router, TS) · MySQL 8 + Prisma · Docker Compose · Tailwind + shadcn/ui (tema
central) · NextAuth · Google Gemini (categorização) · PWA (next-pwa). Detalhe completo em
[architecture.md](./architecture.md).

## 8. Modelo de dados (resumo)

Entidades centrais: `User`, `Household`, `Account`/`Source`, `ImportBatch`, `Transaction`,
`Category`, `CategoryRule`, `PointsProgram` + `PointsSnapshot`, `Investment` + `InvestmentSnapshot`.
Detalhe e ERD em [data-model.md](./data-model.md).

## 9. Roadmap (resumo)

Fase 0 (docs) → Fase 1 (scaffold) → Fase 2 (importação) → Fase 3 (categorização/atribuição) →
Fase 4 (relatórios) → Fase 5 (pontos/investimentos) → Fase 6 (PWA/polimento). Detalhe:
[roadmap.md](./roadmap.md).

## 10. Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Dedup remover transação legítima idêntica (mesmo dia/valor) | Perda de dado real | Contador de ocorrência dentro do lote + hash inclui posição; ver [specs/001](./specs/001-importacao-arquivos/spec.md) |
| Formato do PDF Alelo mudar / encoding quebrado | Import falha | Parser tolerante + validação Zod + relatório de linhas ignoradas |
| Custo/latência/erro do Gemini | Categorização trava | Processar em lote + cache + **fallback por regras**; nunca bloquear o import |
| Escopo inflar (deixar de ser MVP) | Nunca entregar | Constituição "simples primeiro" + specs com "fora de escopo" explícito |
| Dados sensíveis vazarem | Privacidade | API key server-side, sem telemetria de dados, LGPD baseline |

---

**Glossário** de termos do domínio: [glossary.md](./glossary.md).
