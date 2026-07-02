# Arquitetura — Fintrix

> **Como** o Fintrix é construído. O **quê/porquê** está no [PRD.md](./PRD.md). Decisões grandes
> viram um ADR em [adr/](./adr/).

## 1. Visão de alto nível

Fintrix é um **monólito Next.js** (front + back no mesmo projeto) com MySQL, tudo em Docker.
Não há backend separado no MVP — as rotas de API / Server Actions do Next.js falam com o MySQL via
Prisma. A categorização por IA chama a API do Gemini **do lado do servidor** (a chave nunca vai ao
navegador).

```
┌──────────────────────────────────────────────────────────┐
│                     Navegador / PWA                        │
│   React (Server + Client Components) · Tailwind · shadcn   │
│   Mobile-first · bottom-nav · installable                  │
└───────────────▲───────────────────────────┬───────────────┘
                │ HTML/JSON                  │ upload / ações
                │                            ▼
┌──────────────────────────────────────────────────────────┐
│                 Next.js 15 (App Router)                    │
│  Server Components · Route Handlers · Server Actions       │
│  ┌─────────────┐ ┌───────────────┐ ┌───────────────────┐  │
│  │ Auth (NextAuth) │ Import/Parsers │  Categorização    │  │
│  │              │ (extrato/fatura/ │  (regras + Gemini) │  │
│  │              │  alelo)         │                    │  │
│  └─────────────┘ └───────────────┘ └─────────┬─────────┘  │
│                         │ Prisma               │ HTTPS      │
└─────────────────────────┼──────────────────────┼──────────┘
                          ▼                      ▼
                    ┌───────────┐        ┌────────────────┐
                    │  MySQL 8  │        │  Google Gemini │
                    └───────────┘        └────────────────┘
```

Tudo isso roda em **docker-compose**: serviço `app` (Next.js), `db` (MySQL), `adminer` (inspeção do
banco em dev). Ver ADR [0001](./adr/0001-stack-nextjs-mysql-docker.md).

## 2. Stack e por quê

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | **Next.js 15 (App Router, TypeScript)** | Front + back num projeto só; Server Actions simplificam o CRUD; ótimo pra PWA |
| Banco | **MySQL 8** | Pedido do usuário; relacional encaixa no domínio (transações/categorias) |
| ORM | **Prisma** | Tipagem forte, migrations versionadas, DX excelente |
| Estilo | **Tailwind CSS + shadcn/ui** | Velocidade + consistência via tokens; componentes acessíveis. Ver [theme.md](./theme.md) |
| Auth | **NextAuth (Auth.js)** | Contas individuais + sessão; adaptador Prisma |
| IA | **Google Gemini API** | Categorização de transações não rotuladas; server-side |
| PDF | **pdf-parse / pdfjs** (a validar na Fase 2) | Extrair texto do extrato Alelo |
| CSV | **papaparse** (a validar na Fase 2) | Parse robusto de CSV (sep `,` e `;`, aspas) |
| Validação | **Zod** | Validar bordas (upload, forms, API) antes do banco |
| PWA | **next-pwa** (ou Serwist) | Manifest + service worker. Ver [pwa.md](./pwa.md) |

> Bibliotecas marcadas "a validar" são recomendações; a escolha final é travada no spec/plano da
> fase que as usa, com um ADR se necessário.

## 3. Estrutura de pastas (proposta para a Fase 1)

```
/
├─ docs/                      # esta documentação SDD (fonte de verdade)
├─ Exemplos/                  # arquivos reais de exemplo (extrato, fatura, alelo)
├─ prisma/
│  ├─ schema.prisma           # modelo (reflete data-model.md)
│  └─ migrations/
├─ src/
│  ├─ app/                    # rotas (App Router) — mobile-first
│  │  ├─ (auth)/              # login/registro
│  │  ├─ (app)/               # área logada com bottom-nav
│  │  │  ├─ dashboard/
│  │  │  ├─ transacoes/
│  │  │  ├─ importar/
│  │  │  ├─ pontos/
│  │  │  ├─ investimentos/
│  │  │  └─ relatorios/
│  │  └─ api/                 # route handlers quando necessário
│  ├─ components/
│  │  ├─ ui/                  # primitivos shadcn (Button, Card...) — usam tokens do tema
│  │  └─ ...                  # componentes de domínio
│  ├─ lib/
│  │  ├─ import/              # parsers: extrato.ts, fatura.ts, alelo.ts + dedup.ts
│  │  ├─ categorization/      # regras + cliente Gemini + fallback
│  │  ├─ money.ts             # helpers de centavos/moeda
│  │  ├─ db.ts                # cliente Prisma
│  │  └─ auth.ts              # config NextAuth
│  ├─ styles/                 # globals.css com as CSS variables do tema
│  └─ types/
├─ docker-compose.yml
├─ Dockerfile
└─ .env / .env.example
```

## 4. Fluxos principais

### 4.1 Importação (E1)
1. Usuário envia arquivo em `/importar`.
2. Server Action detecta a fonte (extrato / fatura / alelo) por assinatura do conteúdo.
3. Parser específico normaliza para uma lista de `Transaction` candidatas.
4. **Dedup** calcula a chave de cada transação e descarta as já existentes.
5. Transações novas são gravadas ligadas a um `ImportBatch`.
6. Categorização roda em lote (regras → Gemini → fallback).
7. UI mostra resumo: X importadas, Y ignoradas (duplicadas), Z categorizadas.

Detalhe: [specs/001](./specs/001-importacao-arquivos/spec.md) e
[specs/002](./specs/002-transacoes-categorizacao/spec.md).

### 4.2 Autenticação (multi-conta / household)
- Cada `User` faz login (NextAuth). No cadastro, ou cria um `Household` ou entra em um por convite.
- Toda query de dados é **escopada pelo `householdId`** da sessão. Um usuário só vê o próprio
  household. Isso é uma invariante de segurança.

## 5. Segurança e privacidade

- Senhas com hash (bcrypt/argon via adaptador). Sessão via NextAuth.
- **Isolamento por household** em toda leitura/escrita (nunca vazar dados entre households).
- **Chave do Gemini só no servidor** (`GEMINI_API_KEY` em env), nunca exposta ao cliente.
- Sem logs de valores/descrições sensíveis em texto claro em produção.
- LGPD como baseline (dados do próprio casal, exportáveis/apagáveis no futuro).

## 6. Convenções

- **Dinheiro em centavos (inteiro)** + campo de moeda. Helpers em `lib/money.ts`.
- Datas em UTC no banco; formatação pt-BR na UI.
- Validação Zod em toda borda de entrada.
- Componentes visuais consomem **apenas** tokens do tema (ver [frontend-guidelines.md](./frontend-guidelines.md)).

## 7. Portas e ambientes

O servidor de produção já roda outros stacks Docker (nutrix, codetrix, nginx-proxy-manager). Para
**não colidir**, o Fintrix usa um **bloco de portas dedicado**, **parametrizado por `.env`** (mesmo
`docker-compose` roda local e no servidor, mudando só as variáveis), **rede Docker isolada**
(`fintrix_net`) e **prefixo `fintrix_`** nos containers.

### Portas já ocupadas no servidor (não usar como host port)
`80`, `81`, `443` (nginx-proxy-manager) · `8080` (codetrix_app) · `8081` (codetrix_phpmyadmin) ·
`8083` (nutrix_nginx) · `8084` (nutrix_phpmyadmin) · `3307` (nutrix_mysql). Internas: `3306`, `9000`,
`33060`.

### Bloco de portas do Fintrix
| Serviço | Container | Container port | Host port (default) | Variável `.env` |
|---|---|---|---|---|
| app (Next.js) | `fintrix_app` | 3000 | **3100** | `APP_PORT` |
| db (MySQL 8) | `fintrix_db` | 3306 | **3310** | `DB_PORT` |
| adminer (UI do banco) | `fintrix_adminer` | 8080 | **8090** | `ADMINER_PORT` |

Motivo das escolhas: **3100** evita o `3000` genérico e não colide com nada; **3310** porque
`3306`/`3307` estão ocupados (`3308`/`3309` ficam de folga); **8090** é a primeira livre acima do
bloco `808x` já tomado (`8080–8084`).

### Regras
- **Nenhuma porta host do Fintrix** pode ser uma das ocupadas acima. Ao adicionar um serviço novo,
  escolher fora dessa lista e parametrizar por `.env`.
- No servidor, o `app` fica atrás do **nginx-proxy-manager** (roteamento pela rede interna do
  Docker); o host port `APP_PORT` serve para acesso direto/debug.
- O `docker-compose.yml` e o `.env.example` da **Fase 1** devem seguir exatamente esta convenção
  (portas parametrizadas, `fintrix_net`, prefixo `fintrix_`).
