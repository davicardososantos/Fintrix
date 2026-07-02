/**
 * Seed do Fintrix. Na Fase 1 é intencionalmente vazio — as categorias-semente pertencem à
 * Fase 3 (categorização) e dependem de um Household existente. Mantido para satisfazer
 * `prisma db seed` sem efeitos colaterais.
 */
async function main() {
  console.log("[fintrix] seed: nada a semear na Fase 1.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
