import Papa from "papaparse";
import { parseToCents } from "@/lib/money";
import { parseDateBR } from "./util";
import type { ParseResult, ParsedTransaction, AccountKey } from "./types";

const ACCOUNT: AccountKey = {
  key: "nubank_conta",
  name: "Nubank",
  type: "checking",
  institution: "Nubank",
};

/**
 * Parser do extrato de conta Nubank (CSV, separador ",").
 * Colunas: Data,Valor,Identificador,Descrição. O valor já vem com sinal (+recebido / −enviado)
 * e cada linha tem um UUID (`Identificador`) → dedup exato via externalId.
 */
export function parseNubank(rawText: string): ParseResult {
  const text = rawText.replace(/^﻿/, "");
  const parsed = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    delimiter: ",",
    skipEmptyLines: true,
  });

  const transactions: ParsedTransaction[] = [];
  let errorRows = 0;
  const dates: Date[] = [];

  for (const row of parsed.data) {
    const dateStr = row["Data"];
    const date = dateStr ? parseDateBR(dateStr) : null;
    const valor = row["Valor"];
    const desc = (row["Descrição"] ?? "").trim();
    const externalId = (row["Identificador"] ?? "").trim();

    if (!date || !desc || valor === undefined || valor === "") {
      errorRows++;
      continue;
    }

    dates.push(date);
    transactions.push({
      date,
      description: desc,
      rawDescription: desc,
      amountCents: parseToCents(valor), // já vem com sinal
      currency: "BRL",
      externalId: externalId || undefined,
    });
  }

  const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
  return {
    source: "nubank_conta",
    account: ACCOUNT,
    transactions,
    periodStart: sorted[0],
    periodEnd: sorted[sorted.length - 1],
    errorRows,
  };
}
