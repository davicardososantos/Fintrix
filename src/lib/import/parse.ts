import { detectSource } from "./detect";
import { parseExtrato } from "./extrato";
import { parseExtratoPdf } from "./extrato-pdf";
import { parseFatura } from "./fatura";
import { parseFaturaPdf } from "./fatura-pdf";
import { parseAlelo } from "./alelo";
import { parseNubank } from "./nubank";
import { extractPdfText } from "./pdf-text";
import type { ParseResult } from "./types";

export class ImportError extends Error {}

/** Extrai o texto do PDF traduzindo "PDF com senha" num erro que o usuário entende. */
async function pdfText(buffer: Buffer, columns = false): Promise<string> {
  try {
    return await extractPdfText(buffer, { columns });
  } catch (e) {
    if (/password/i.test(String((e as Error)?.name ?? "") + String((e as Error)?.message ?? ""))) {
      throw new ImportError(
        "Este PDF está protegido por senha. Salve uma cópia sem senha (ou envie o CSV) e tente de novo.",
      );
    }
    throw e;
  }
}

/**
 * Detecta a fonte e faz o parse do arquivo enviado.
 * Lança ImportError se a fonte não for reconhecida (spec 001, RF2).
 */
export async function parseFile(buffer: Buffer, fileName: string): Promise<ParseResult> {
  const isPdf =
    /\.pdf$/i.test(fileName) || buffer.subarray(0, 5).toString("latin1") === "%PDF-";

  const text = isPdf ? await pdfText(buffer) : buffer.toString("utf-8");
  const source = detectSource(text, isPdf);

  if (!source) {
    throw new ImportError(
      "Arquivo não reconhecido. Envie: extrato ou fatura C6 (CSV ou PDF), extrato Nubank (CSV) " +
        "ou o extrato Alelo (PDF).",
    );
  }

  switch (source) {
    case "c6_extrato":
      // PDF do C6 precisa do texto com colunas (ver pdf-text.ts); o CSV segue como sempre.
      return isPdf ? parseExtratoPdf(await pdfText(buffer, true)) : parseExtrato(text);
    case "c6_fatura":
      return isPdf ? parseFaturaPdf(await pdfText(buffer, true)) : parseFatura(text);
    case "alelo":
      return parseAlelo(text);
    case "nubank_conta":
      return parseNubank(text);
  }
}
