import { detectSource } from "./detect";
import { parseExtrato } from "./extrato";
import { parseFatura } from "./fatura";
import { parseAlelo } from "./alelo";
import type { ParseResult } from "./types";

export class ImportError extends Error {}

/** Extrai texto de um PDF usando pdf-parse (import do subpath evita o "modo debug" do index.js). */
async function extractPdfText(buffer: Buffer): Promise<string> {
  // @ts-expect-error - subpath sem tipos, mas evita o require de arquivo de teste do index.js
  const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
  const data = await pdfParse(buffer);
  return data.text as string;
}

/**
 * Detecta a fonte e faz o parse do arquivo enviado.
 * Lança ImportError se a fonte não for reconhecida (spec 001, RF2).
 */
export async function parseFile(buffer: Buffer, fileName: string): Promise<ParseResult> {
  const isPdf =
    /\.pdf$/i.test(fileName) || buffer.subarray(0, 5).toString("latin1") === "%PDF-";

  const text = isPdf ? await extractPdfText(buffer) : buffer.toString("utf-8");
  const source = detectSource(text, isPdf);

  if (!source) {
    throw new ImportError(
      "Arquivo não reconhecido. Envie um extrato ou fatura da C6 (CSV) ou o extrato Alelo (PDF).",
    );
  }

  switch (source) {
    case "c6_extrato":
      return parseExtrato(text);
    case "c6_fatura":
      return parseFatura(text);
    case "alelo":
      return parseAlelo(text);
  }
}
