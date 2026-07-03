import { createHash } from "crypto";
import { normalizeDescription } from "./util";
import type { ImportSource, ParsedTransaction } from "./types";

/** Transação parseada + o dedupHash calculado. */
export type HashedTransaction = ParsedTransaction & { dedupHash: string };

/**
 * Calcula o dedupHash de cada transação (spec 001, Regras de negócio).
 * - Se a transação tem `externalId` (id único do provedor, ex.: UUID do Nubank), a chave usa esse id
 *   diretamente — dedup estável e exato.
 * - Senão, chave = householdId + source + accountKey + data + descriçãoNormalizada + amountCents +
 *   occurrenceIndex. O occurrenceIndex diferencia transações legítimas idênticas no mesmo arquivo
 *   (ex.: dois METRO R$ 5,40 no mesmo dia) SEM que a reimportação as duplique.
 */
export function computeDedupHashes(
  householdId: string,
  source: ImportSource,
  accountKey: string,
  transactions: ParsedTransaction[],
): HashedTransaction[] {
  const occurrence = new Map<string, number>();

  return transactions.map((t) => {
    let keyMaterial: string;
    if (t.externalId) {
      keyMaterial = `${householdId}|${source}|${accountKey}|ext:${t.externalId}`;
    } else {
      const dateKey = t.date.toISOString().slice(0, 10);
      const descKey = normalizeDescription(t.description);
      const baseKey = `${dateKey}|${descKey}|${t.amountCents}`;
      const idx = occurrence.get(baseKey) ?? 0;
      occurrence.set(baseKey, idx + 1);
      keyMaterial = `${householdId}|${source}|${accountKey}|${baseKey}|${idx}`;
    }

    const dedupHash = createHash("sha256").update(keyMaterial).digest("hex");
    return { ...t, dedupHash };
  });
}
