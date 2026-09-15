import { createHash } from "crypto";
import { normalizeDescription } from "./util";
import type { ImportSource, ParsedTransaction } from "./types";

/** Transação parseada + o dedupHash calculado. */
export type HashedTransaction = ParsedTransaction & { dedupHash: string };

const PARCELA = /^\d+\/\d+$/;

/**
 * Calcula o dedupHash de cada transação (spec 001, Regras de negócio).
 * - Se a transação tem `externalId` (id único do provedor, ex.: UUID do Nubank), a chave usa esse id
 *   diretamente — dedup estável e exato.
 * - Senão, chave = householdId + source + accountKey + data + descriçãoNormalizada + amountCents +
 *   [parcela] + occurrenceIndex. O occurrenceIndex diferencia transações legítimas idênticas no mesmo
 *   arquivo (ex.: dois METRO R$ 5,40 no mesmo dia) SEM que a reimportação as duplique.
 * - A parcela ("2/3") entra na chave porque o C6 repete a data da compra original em todas as
 *   parcelas: sem ela, a 3/3 de uma fatura seria descartada como duplicata da 2/3 da fatura anterior.
 *   "Única"/vazio fica de fora — o hash das compras à vista não muda.
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
      const parcela = t.installment && PARCELA.test(t.installment) ? `|${t.installment}` : "";
      const baseKey = `${dateKey}|${descKey}|${t.amountCents}${parcela}`;
      const idx = occurrence.get(baseKey) ?? 0;
      occurrence.set(baseKey, idx + 1);
      keyMaterial = `${householdId}|${source}|${accountKey}|${baseKey}|${idx}`;
    }

    const dedupHash = createHash("sha256").update(keyMaterial).digest("hex");
    return { ...t, dedupHash };
  });
}
