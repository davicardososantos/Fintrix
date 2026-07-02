import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { parseFile, ImportError } from "./parse";
import { getOrCreateAccount } from "./accounts";
import { computeDedupHashes } from "./dedup";

export type ImportSummary = {
  source: string;
  account: string;
  total: number;
  imported: number;
  skipped: number; // duplicadas
  errors: number; // linhas inválidas
  alreadyImported: boolean;
};

const SOURCE_LABEL: Record<string, string> = {
  c6_extrato: "Extrato C6",
  c6_fatura: "Fatura C6",
  alelo: "Alelo",
};

/**
 * Fluxo de importação (spec 001): detecta a fonte, faz o parse, deduplica de forma idempotente e
 * persiste as transações novas ligadas a um ImportBatch. Reenviar o mesmo arquivo → 0 novas.
 * Lança ImportError com mensagem amigável para fonte desconhecida.
 */
export async function importBuffer(
  householdId: string,
  userId: string,
  fileName: string,
  buffer: Buffer,
): Promise<ImportSummary> {
  const result = await parseFile(buffer, fileName);
  const fileHash = createHash("sha256").update(buffer).digest("hex");

  const account = await getOrCreateAccount(householdId, result.account);

  const existingBatch = await prisma.importBatch.findFirst({
    where: { householdId, fileHash },
    select: { id: true },
  });

  const hashed = computeDedupHashes(householdId, result.source, result.account.key, result.transactions);

  const existing = await prisma.transaction.findMany({
    where: { householdId, dedupHash: { in: hashed.map((h) => h.dedupHash) } },
    select: { dedupHash: true },
  });
  const existingSet = new Set(existing.map((e) => e.dedupHash));
  const novas = hashed.filter((h) => !existingSet.has(h.dedupHash));

  const total = result.transactions.length;
  const summary: ImportSummary = {
    source: SOURCE_LABEL[result.source] ?? result.source,
    account: account.name,
    total,
    imported: novas.length,
    skipped: total - novas.length,
    errors: result.errorRows,
    alreadyImported: !!existingBatch,
  };

  if (novas.length === 0) return summary;

  await prisma.$transaction(async (tx) => {
    const batch = await tx.importBatch.create({
      data: {
        householdId,
        source: result.source,
        fileName,
        fileHash,
        importedById: userId,
        periodStart: result.periodStart,
        periodEnd: result.periodEnd,
        totalRows: total,
        importedRows: novas.length,
        skippedRows: total - novas.length,
        errorRows: result.errorRows,
      },
    });

    await tx.transaction.createMany({
      data: novas.map((t) => ({
        householdId,
        importBatchId: batch.id,
        accountId: account.id,
        date: t.date,
        description: t.description,
        rawDescription: t.rawDescription,
        amountCents: t.amountCents,
        currency: t.currency,
        fxAmountCents: t.fxAmountCents,
        fxCurrency: t.fxCurrency,
        rawCategory: t.rawCategory,
        ownerHint: t.ownerHint,
        installment: t.installment,
        dedupHash: t.dedupHash,
      })),
      skipDuplicates: true,
    });
  });

  return summary;
}

export { ImportError };
