/**
 * Importação pela linha de comando, com o MESMO fluxo da tela /importar (spec 001):
 * parse → dedup → ImportBatch → categorização (spec 002). Útil para carga em lote no servidor.
 *
 *   npx tsx scripts/import-cli.ts importar --household <id> --user <id> [--dry-run] arq1.pdf arq2.csv …
 *   npx tsx scripts/import-cli.ts rehash-parcelas [--apply]
 *
 * `rehash-parcelas` é a migração única da mudança no dedup (parcela na chave, ver dedup.ts):
 * recalcula o dedupHash das transações parceladas já gravadas. Rode antes de reimportar faturas.
 * Precisa de DATABASE_URL (e GEMINI_API_KEY para a categorização por IA).
 */
import { readFileSync } from "fs";
import { basename } from "path";
import { prisma } from "../src/lib/db";
import { parseFile } from "../src/lib/import/parse";
import { computeDedupHashes } from "../src/lib/import/dedup";
import { importBuffer } from "../src/lib/import/import-service";
import { C6_CARTAO } from "../src/lib/import/fatura";
import { C6_CONTA } from "../src/lib/import/extrato";
import { categorizeHousehold } from "../src/lib/categorization/pipeline";
import type { ImportSource } from "../src/lib/import/types";

const CONTA_POR_FONTE: Partial<Record<ImportSource, string>> = {
  c6_fatura: C6_CARTAO.key,
  c6_extrato: C6_CONTA.key,
};

function opcao(args: string[], nome: string): string | undefined {
  const i = args.indexOf(nome);
  if (i === -1) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}

async function importar(args: string[]) {
  const dryRun = args.includes("--dry-run");
  const householdId = opcao(args, "--household");
  const userId = opcao(args, "--user");
  const arquivos = args.filter((a) => a !== "--dry-run");
  if (!householdId || !userId || arquivos.length === 0) {
    throw new Error("uso: importar --household <id> --user <id> [--dry-run] <arquivos…>");
  }

  let novasTotal = 0;
  for (const caminho of arquivos) {
    const nome = basename(caminho);
    const buffer = readFileSync(caminho);
    if (dryRun) {
      const r = await parseFile(buffer, nome);
      const hashed = computeDedupHashes(householdId, r.source, r.account.key, r.transactions);
      const existentes = await prisma.transaction.count({
        where: { householdId, dedupHash: { in: hashed.map((h) => h.dedupHash) } },
      });
      const novas = hashed.length - existentes;
      novasTotal += novas;
      console.log(`[simulação] ${nome}: ${r.source} · ${hashed.length} lidas · ${novas} novas · ${existentes} já existem · ${r.errorRows} erros`);
      continue;
    }
    const s = await importBuffer(householdId, userId, nome, buffer);
    novasTotal += s.imported;
    console.log(`${nome}: ${s.source} → ${s.account} · ${s.total} lidas · ${s.imported} novas · ${s.skipped} duplicadas · ${s.errors} erros${s.alreadyImported ? " · (arquivo já importado antes)" : ""}`);
  }

  if (!dryRun && novasTotal > 0) {
    const c = await categorizeHousehold(householdId);
    console.log(`categorização: ${c.processed} processadas · C6 ${c.byC6} · regra ${c.byRule} · IA ${c.byAi} · sem categoria ${c.uncategorized} · atribuídas ${c.attributed} · cobertura ${c.coveragePct}%`);
  }
  console.log(`${dryRun ? "[simulação] " : ""}total de novas: ${novasTotal}`);
}

async function rehashParcelas(args: string[]) {
  const apply = args.includes("--apply");
  const rows = await prisma.transaction.findMany({
    where: { installment: { not: null }, importBatchId: { not: null } },
    include: { importBatch: { select: { source: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const parceladas = rows.filter((r) => /^\d+\/\d+$/.test(r.installment ?? ""));

  // Agrupa por household + fonte: o occurrenceIndex é contado dentro do grupo, como num arquivo.
  const grupos = new Map<string, typeof parceladas>();
  for (const r of parceladas) {
    const k = `${r.householdId}|${r.importBatch!.source}`;
    grupos.set(k, [...(grupos.get(k) ?? []), r]);
  }

  let mudam = 0;
  for (const grupo of grupos.values()) {
    const { householdId } = grupo[0];
    const source = grupo[0].importBatch!.source as ImportSource;
    const accountKey = CONTA_POR_FONTE[source];
    if (!accountKey) {
      console.log(`pulando ${grupo.length} parceladas da fonte ${source} (sem chave de conta conhecida)`);
      continue;
    }
    const hashed = computeDedupHashes(
      householdId,
      source,
      accountKey,
      grupo.map((r) => ({
        date: r.date,
        description: r.description,
        amountCents: r.amountCents,
        currency: r.currency,
        installment: r.installment ?? undefined,
      })),
    );
    for (let i = 0; i < grupo.length; i++) {
      const r = grupo[i];
      const novo = hashed[i].dedupHash;
      if (novo === r.dedupHash) continue;
      mudam++;
      console.log(`${apply ? "atualizando" : "[simulação]"} ${r.date.toISOString().slice(0, 10)} ${r.description} ${r.installment} ${r.amountCents}`);
      if (apply) await prisma.transaction.update({ where: { id: r.id }, data: { dedupHash: novo } });
    }
  }
  console.log(`${parceladas.length} parceladas · ${mudam} ${apply ? "atualizadas" : "a atualizar (use --apply)"}`);
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === "importar") return importar(args);
  if (cmd === "rehash-parcelas") return rehashParcelas(args);
  throw new Error("comandos: importar | rehash-parcelas");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
