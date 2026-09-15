import { parseToCents } from "@/lib/money";
import { parseDateBR, parseDateISO } from "./util";
import type { ParseResult, ParsedTransaction, AccountKey } from "./types";

const ACCOUNT: AccountKey = {
  key: "alelo",
  name: "Alelo",
  type: "meal_voucher",
  institution: "Alelo",
};

// Linha que é só um valor: "- R$ 329,73" (gasto) ou "R$ 704,00" (crédito/benefício).
const VALUE_LINE = /^(-?)\s*R\$\s*([\d.,]+)$/i;
// O MeuAlelo já mostrou a data como "2026-06-26" (até jul/2026) e como "08/09/2026" (set/2026).
const parseData = (s: string) => parseDateISO(s) ?? parseDateBR(s);
// O texto do PDF gruda pedaços: "SaldoR$ 514,63Último benefício…" e, no rodapé da impressão do
// navegador, "15/09/2026, 19:37Consulta de Saldo…" (a data do saldo). Por isso a busca é no texto todo.
const SALDO = /Saldo\s*(-?)\s*R\$\s*([\d.]+,\d{2})/i;
const IMPRESSO = /(\d{2}\/\d{2}\/\d{4}),\s*\d{2}:\d{2}/;

/**
 * Parser do extrato Alelo (texto extraído do PDF). Cada transação são 3 linhas na ordem:
 * estabelecimento / data (YYYY-MM-DD ou DD/MM/YYYY) / valor ("- R$ x" gasto, "R$ x" crédito).
 * O "Saldo" do topo (linha "Saldo" seguida do valor) vira `balance`, datado pelo rodapé da
 * impressão — o import atualiza o saldo da conta se for mais recente.
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
    if (/^saldo$/i.test(dateStr ?? "")) continue; // saldo em linha própria: lido abaixo, não é lançamento
    const merchant = lines[i - 2];
    const date = dateStr ? parseData(dateStr) : null;
    if (!date || !merchant || /saldo/i.test(merchant)) {
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
  const saldo = rawText.match(SALDO);
  const saldoCents = saldo ? (saldo[1] === "-" ? -1 : 1) * parseToCents(saldo[2]) : undefined;
  const impresso = rawText.match(IMPRESSO);
  const saldoData = (impresso && parseDateBR(impresso[1])) || dates[dates.length - 1];

  return {
    source: "alelo",
    account: ACCOUNT,
    transactions,
    periodStart: dates[0],
    periodEnd: dates[dates.length - 1],
    errorRows,
    balance: saldoCents !== undefined && saldoData ? { cents: saldoCents, date: saldoData } : undefined,
  };
}
