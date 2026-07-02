# Glossário — Fintrix

> Termos do domínio, para todos falarem a mesma língua. Nomes técnicos batem com
> [data-model.md](./data-model.md).

- **Household (casal/família):** a unidade financeira. Raiz de isolamento — todo dado pertence a um
  household. No MVP, um household = Davi + esposa.
- **User (cônjuge):** pessoa com login próprio, membro de um household.
- **Atribuição:** a quem um gasto/entrada pertence — **eu**, **esposa** ou **casal** (`ownerId` nulo
  = casal). Base do placar "quem gastou mais".
- **Account (conta/fonte):** origem financeira: conta corrente C6, cartão C6, Alelo, dinheiro.
- **Transaction (transação/lançamento):** uma entrada ou saída. Valor em **centavos**; positivo =
  entrada, negativo = saída.
- **Entrada / Saída:** dinheiro que entrou (crédito, salário, benefício) / que saiu (gasto, compra).
- **Extrato:** relatório de movimentação da **conta corrente** (C6) — CSV.
- **Fatura:** relatório do **cartão de crédito** (C6) — CSV. Traz `Nome no Cartão` e `Categoria`.
- **Alelo:** benefício alimentação; relatório em **PDF** (saldo + transações + benefícios recebidos).
- **Benefício:** crédito recebido no Alelo ("Seu Benefício Caiu") — conta como entrada.
- **ImportBatch (lote de importação):** um upload de arquivo; agrupa as transações importadas dele.
- **Dedup (deduplicação):** processo que evita salvar transações repetidas. Baseado em `dedupHash`.
- **dedupHash:** identidade de conteúdo de uma transação (fonte + conta + data + descrição + valor +
  ocorrência), única por household. Ver [specs/001](./specs/001-importacao-arquivos/spec.md).
- **Categoria:** rótulo de gasto/entrada ("Transporte", "Supermercado"). Vem da C6, de regra, do
  Gemini ou manual.
- **CategoryRule (regra):** casamento determinístico (ex.: descrição contém "METRO" → Transporte),
  avaliada antes da IA.
- **Categorização por IA:** uso do **Gemini** para classificar transações sem categoria (extrato,
  Alelo). Sempre com **fallback** por regra.
- **categorySource:** de onde veio a categoria (`c6`, `rule`, `ai`, `manual`, `uncategorized`).
- **Pontos:** milhas/pontos de fidelidade — **Smiles, Livelo, Azul, Latam**. Atualização manual.
- **PointsSnapshot:** leitura de saldo de pontos numa data.
- **Investimento:** aplicação conservadora (hoje **CDB C6**): principal, data, valor atual.
- **InvestmentSnapshot:** valor atual do investimento numa data (atualização manual).
- **Centavos:** unidade de armazenamento de dinheiro (inteiro), para evitar erro de `float`.
- **PWA:** Progressive Web App — o app instalável. Ver [pwa.md](./pwa.md).
- **Token (de design):** variável semântica de estilo (cor/spacing/etc.) do [theme.md](./theme.md).
- **SDD (Spec-Driven Development):** método do projeto — spec → plano → tarefas → código → validação.
