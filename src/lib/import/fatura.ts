import Papa from "papaparse";
import { parseToCents } from "@/lib/money";
import { parseDateBR } from "./util";
import type { ParseResult, ParsedTransaction, AccountKey } from "./types";

/**
 * Parser da Fatura de Cartão C6 (CSV, separador ";").
 * Compra = saída (valor negativo no amountCents). "Inclusao de Pagamento" vem com valor negativo
 * no arquivo → vira entrada (crédito). Guarda Categoria (semente) e Nome no Cartão (atribuição).
 */
export function parseFatura(rawText: string): ParseResult {
  const text = rawText.replace(/^﻿/, "");
  const parsed = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
  });

  const transactions: ParsedTransaction[] = [];
  let errorRows = 0;
  const dates: Date[] = [];

  for (const row of parsed.data) {
    const dateStr = row["Data de Compra"];
    const date = dateStr ? parseDateBR(dateStr) : null;
    const desc = (row["Descrição"] ?? "").trim();
    const valorRs = row["Valor (em R$)"];
    if (!date || !desc || valorRs === undefined || valorRs === "") {
      errorRows++;
      continue;
    }

    const rawCategory = (row["Categoria"] ?? "").trim();
    const ownerHint = (row["Nome no Cartão"] ?? "").trim();
    const installment = (row["Parcela"] ?? "").trim();
    const valorUsd = row["Valor (em US$)"] ?? "0";

    dates.push(date);

    // Compra no arquivo é positivo (gasto) → guardamos como saída (negativo).
    // Pagamento vem negativo no arquivo → vira positivo (crédito).
    const amountCents = -parseToCents(valorRs);

    const usdCents = parseToCents(valorUsd);
    const fx = usdCents !== 0 ? { fxAmountCents: -usdCents, fxCurrency: "USD" } : {};

    transactions.push({
      date,
      description: desc,
      rawDescription: desc,
      amountCents,
      currency: "BRL",
      rawCategory: rawCategory && rawCategory !== "-" ? rawCategory : undefined,
      ownerHint: ownerHint || undefined,
      installment: installment || undefined,
      ...fx,
    });
  }

  // Uma fatura pode agregar vários cartões (titular + adicionais); a conta representa o cartão C6
  // como fonte. A pessoa por trás de cada compra vem do ownerHint (Nome no Cartão), na Fase 3.
  const account: AccountKey = {
    key: "c6_cartao",
    name: "C6 Cartão",
    type: "credit_card",
    institution: "C6",
  };

  const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
  return {
    source: "c6_fatura",
    account,
    transactions,
    periodStart: sorted[0],
    periodEnd: sorted[sorted.length - 1],
    errorRows,
  };
}
