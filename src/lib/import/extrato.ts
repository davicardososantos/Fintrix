import Papa from "papaparse";
import { parseToCents } from "@/lib/money";
import { parseDateBR } from "./util";
import type { ParseResult, ParsedTransaction, AccountKey } from "./types";

const ACCOUNT: AccountKey = {
  key: "c6_conta",
  name: "C6 Conta",
  type: "checking",
  institution: "C6",
};

/**
 * Parser do Extrato de Conta Corrente C6 (CSV, UTF-8 BOM, separador ",").
 * Pula as linhas de metadados até o cabeçalho; entrada/saída em colunas separadas.
 */
export function parseExtrato(rawText: string): ParseResult {
  const text = rawText.replace(/^﻿/, "");
  const lines = text.split(/\r?\n/);

  // período (opcional)
  let periodStart: Date | undefined;
  let periodEnd: Date | undefined;
  const periodLine = lines.find((l) => /Extrato de \d{2}\/\d{2}\/\d{4} a \d{2}\/\d{2}\/\d{4}/i.test(l));
  if (periodLine) {
    const m = periodLine.match(/(\d{2}\/\d{2}\/\d{4}) a (\d{2}\/\d{2}\/\d{4})/);
    if (m) {
      periodStart = parseDateBR(m[1]) ?? undefined;
      periodEnd = parseDateBR(m[2]) ?? undefined;
    }
  }

  const headerIdx = lines.findIndex((l) => /^Data Lan[çc]amento,/i.test(l));
  if (headerIdx === -1) {
    return { source: "c6_extrato", account: ACCOUNT, transactions: [], errorRows: 0 };
  }

  const csv = lines.slice(headerIdx).join("\n");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    delimiter: ",",
    skipEmptyLines: true,
  });

  const transactions: ParsedTransaction[] = [];
  let errorRows = 0;

  for (const row of parsed.data) {
    const dateStr = row["Data Lançamento"];
    const title = (row["Título"] ?? "").trim();
    const desc = (row["Descrição"] ?? "").trim();
    const entrada = row["Entrada(R$)"] ?? "0";
    const saida = row["Saída(R$)"] ?? "0";

    const date = dateStr ? parseDateBR(dateStr) : null;
    if (!date || !title) {
      errorRows++;
      continue;
    }

    const amountCents = parseToCents(entrada) - parseToCents(saida);

    transactions.push({
      date,
      description: title,
      rawDescription: desc || title,
      amountCents,
      currency: "BRL",
    });
  }

  return { source: "c6_extrato", account: ACCOUNT, transactions, periodStart, periodEnd, errorRows };
}
