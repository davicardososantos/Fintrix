import { parseToCents } from "@/lib/money";
import { parseDateISO } from "./util";
import type { ParseResult, ParsedTransaction, AccountKey } from "./types";

const ACCOUNT: AccountKey = {
  key: "alelo",
  name: "Alelo",
  type: "meal_voucher",
  institution: "Alelo",
};

// Linha que é só um valor: "- R$ 329,73" (gasto) ou "R$ 704,00" (crédito/benefício).
const VALUE_LINE = /^(-?)\s*R\$\s*([\d.,]+)$/i;
const DATE_LINE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parser do extrato Alelo (texto extraído do PDF). Cada transação são 3 linhas na ordem:
 * estabelecimento / data (YYYY-MM-DD) / valor ("- R$ x" gasto, "R$ x" crédito). A linha de
 * "Saldo ..." do topo é ignorada porque tem texto extra além do valor.
 */
export function parseAlelo(rawText: string): ParseResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const transactions: ParsedTransaction[] = [];
  let errorRows = 0;

  for (let i = 0; i < lines.length; i++) {
    const vm = lines[i].match(VALUE_LINE);
    if (!vm) continue;

    const dateStr = lines[i - 1];
    const merchant = lines[i - 2];
    if (!dateStr || !DATE_LINE.test(dateStr) || !merchant || /saldo/i.test(merchant)) {
      errorRows++;
      continue;
    }

    const date = parseDateISO(dateStr);
    if (!date) {
      errorRows++;
      continue;
    }

    const magnitude = parseToCents(vm[2]);
    const amountCents = vm[1] === "-" ? -magnitude : magnitude;

    transactions.push({
      date,
      description: merchant,
      rawDescription: merchant,
      amountCents,
      currency: "BRL",
    });
  }

  const dates = transactions.map((t) => t.date).sort((a, b) => a.getTime() - b.getTime());

  return {
    source: "alelo",
    account: ACCOUNT,
    transactions,
    periodStart: dates[0],
    periodEnd: dates[dates.length - 1],
    errorRows,
  };
}
