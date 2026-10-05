# 007 — Redesign e experiência de uso

## Objetivo

Renovar a apresentação do Fintrix antes das mudanças de domínio financeiro: interface elegante,
legível e fácil de navegar no celular e no desktop, mantendo a identidade verde/teal.

## Escopo

- Dashboard com resultado do mês, entradas/saídas, atalhos, pendências e últimas movimentações.
- Navegação inferior no celular e lateral no desktop, com todos os módulos acessíveis.
- Temas claro/escuro com preferência persistida, tokens de contraste e superfícies consistentes.
- Cabeçalhos, cartões, campos, filtros, gráficos, login e importação com hierarquia coerente.
- Motion sutil de entrada, barras e interação; respeitar prefers-reduced-motion.
- Estados de carregamento e erro, foco visível, controles com alvo mínimo de 44px.
- Edição de transações em dialog acessível, com Escape, contenção e retorno do foco.

## Fora deste incremento

Competência de faturas, novos cálculos financeiros, integrações, migrations e novas entidades.
Os próximos ajustes serão tratados em specs próprios após validar este redesign.

## Critérios de aceite

- [x] Telas úteis em 390px e desktop, sem rolagem horizontal da página.
- [x] Dashboard exibe dados reais; qualquer fixture de QA fica fora do deploy.
- [x] Tema persiste após recarregar; claro/escuro legíveis e foco visível.
- [x] Navegação indica rota ativa, inclusive módulos secundários.
- [x] Forms existentes mantêm ações e validação; importação descreve formatos suportados.
- [x] Motion não é obrigatório para compreender conteúdo e fica desativado com reduced-motion.
- [x] TypeScript, ESLint, build e revisão visual passam.
- [ ] Commit enviado à main; deploy e saúde do Fintrix verificados em /root/fintrix na Hostinger.
