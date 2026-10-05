# Tarefas — 007

- [x] Tokens e documentação visual.
- [x] Shell, navegação, temas e estados globais.
- [x] Dashboard, cabeçalhos, listas, gráficos, login e importação.
- [x] Dialog e filtros acessíveis.
- [x] QA visual e checks.
- [ ] Commit, push, deploy e conferência no servidor.

## Validação local

- Build de produção, TypeScript e ESLint aprovados.
- Revisão visual em 320px, 390px e 1440px, nos temas claro e escuro.
- Dashboard, estados vazios, login, importação, filtros e dialog revisados com dados sintéticos temporários; rota de QA removida antes do commit.
- Dialog fecha com Escape e devolve foco ao controle de origem; tema persiste ao recarregar.
- 24 pares principais de texto/fundo atingem contraste AA. Motion possui fallback via prefers-reduced-motion.
- Docker local não pôde reconstruir: engine retornou erro HTTP 500. A verificação de containers será feita na Hostinger após o push.
