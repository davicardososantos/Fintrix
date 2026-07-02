# Constituição do Fintrix

> Este documento define os **princípios inegociáveis** do projeto. Ele governa todos os specs,
> planos e código. Em caso de conflito entre uma decisão pontual e a constituição, a constituição
> vence — ou ela é alterada explicitamente via um novo ADR (ver [adr/](./adr/)).

## 1. Propósito

Fintrix é um app de **gestão financeira do casal** (Davi + esposa), pessoal e privado, focado em
**controle de gastos**: saber quanto entrou, quanto saiu, onde dá para economizar e quem está
gastando mais. Tudo o que construirmos deve servir a esse propósito antes de qualquer outra coisa.

## 2. Princípios de produto

1. **Mobile-first, sempre.** Toda tela é desenhada primeiro para o celular (uma mão, tela pequena,
   toque). Web é bônus, nunca o foco. O destino final é PWA → lojas (Android/Apple).
2. **Simples primeiro (MVP real).** Entregamos o menor recorte que resolve a dor atual e evoluímos.
   Nada de feature especulativa. Ver [roadmap.md](./roadmap.md).
3. **Privacidade em primeiro lugar.** São dados financeiros de um casal. Nada de vazar, nada de
   telemetria de dados sensíveis, nada de terceiro sem necessidade. LGPD como baseline.
4. **Decisão sobre dado.** O objetivo dos relatórios é gerar decisão ("cortar aqui", "puxar o
   freio"), não só mostrar número bonito.

## 3. Princípios de engenharia (Spec-Driven Development)

O projeto segue **SDD**. A ordem é sempre: **spec → plano → tarefas → código → validação**.

1. **Escopo definido.** Todo trabalho referencia um spec em [specs/](./specs/). Sem spec, não há
   código. Isso evita refatorar o que não foi pedido.
2. **Ambiguidade zero.** Proibido instrução vaga ("melhore o código"). Requisitos são diretos e
   verificáveis.
3. **Trabalho em pedaços pequenos.** Tarefas pequenas e bem definidas (arquivos `tasks.md`),
   preservando contexto e qualidade.
4. **Contexto vivo.** A pasta `docs/` é a fonte de verdade. Mudou o produto? Atualiza o doc **antes**
   ou junto do código. Trocar de sessão/agente não pode perder contexto.
5. **Contrato de aceite.** Todo spec tem **Critérios de aceite** (checklist verificável). "Pronto"
   significa que o checklist passa, não que "o código rodou".
6. **Qualidade sobre velocidade.** Melhor acertar devagar do que cuspir código rápido e errado.

## 4. Regras técnicas inegociáveis

1. **Tema é lei.** Todo componente consome **design tokens** de [theme.md](./theme.md). É proibido
   hex cru, spacing mágico ou tipografia fora do tema no código. PR que viola o tema é rejeitado.
   Ver também [frontend-guidelines.md](./frontend-guidelines.md).
2. **Sem duplicação de dados.** Importações são **idempotentes**: reimportar o mesmo arquivo não
   cria linhas repetidas (ver [specs/001](./specs/001-importacao-arquivos/spec.md)).
3. **Dinheiro é inteiro.** Valores monetários são armazenados em **centavos (inteiro)**, nunca em
   `float`. Moeda e câmbio explícitos quando houver (fatura internacional).
4. **Tudo em Docker.** Dev e produção sobem via `docker-compose`. Nada de "funciona só na minha
   máquina".
5. **Tipagem forte.** TypeScript estrito + validação de entrada com Zod nas bordas (upload, API,
   forms). Dados externos são sempre validados antes de entrar no banco.
6. **Migrations versionadas.** Todo schema muda via migration do Prisma, commitada. Nada de alterar
   banco na mão.

## 5. Como evoluir esta constituição

Mudou algo estrutural (stack, princípio, decisão grande)? Cria um **ADR** em
[adr/](./adr/) e, se necessário, edita esta constituição referenciando o ADR. Decisões
importantes ficam registradas — não moram só na cabeça de alguém nem numa sessão de chat.
