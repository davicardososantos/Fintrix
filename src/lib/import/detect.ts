import type { ImportSource } from "./types";

/**
 * Detecta a fonte do arquivo por assinatura de conteúdo (spec 001, RF2).
 * `isPdf` vem do tipo/uso do arquivo; o texto é o conteúdo já extraído (CSV cru ou texto do PDF).
 */
export function detectSource(text: string, isPdf: boolean): ImportSource | null {
  const t = text.slice(0, 4000);

  if (isPdf) {
    // Alelo é a única fonte PDF suportada por ora (Santander virá depois).
    if (/meualelo/i.test(t) || /rede\s+aliment/i.test(t)) {
      return "alelo";
    }
    return null;
  }

  // CSV: distinguir pelos cabeçalhos.
  if (/EXTRATO DE CONTA CORRENTE C6/i.test(t) || /Entrada\(R\$\).*Sa[íi]da\(R\$\)/i.test(t)) {
    return "c6_extrato";
  }
  if (/Nome no Cart[ãa]o/i.test(t) && /Final do Cart[ãa]o/i.test(t)) {
    return "c6_fatura";
  }
  // Nubank: cabeçalho Data,Valor,Identificador,Descrição.
  if (/Data,Valor,Identificador,Descri/i.test(t) || (/Identificador/i.test(t) && /Valor/i.test(t))) {
    return "nubank_conta";
  }
  return null;
}
