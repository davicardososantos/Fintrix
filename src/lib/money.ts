/**
 * Helpers de dinheiro. Regra da constituição: dinheiro é SEMPRE inteiro em centavos.
 * Nunca usar float para valores monetários.
 */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata centavos como moeda pt-BR. Ex.: 70400 -> "R$ 704,00". */
export function formatCents(cents: number, currency = "BRL"): string {
  if (currency === "BRL") return BRL.format(cents / 100);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

/** Formata com sinal explícito (+/-), útil para entradas/saídas. */
export function formatSignedCents(cents: number, currency = "BRL"): string {
  const sign = cents > 0 ? "+ " : cents < 0 ? "- " : "";
  return `${sign}${formatCents(Math.abs(cents), currency)}`;
}

/**
 * Formato compacto para rótulos de gráfico. Ex.: 685075 -> "6,9k", 42000 -> "420".
 * Sempre em reais (não centavos) e sem prefixo de moeda, para caber em labels apertados.
 */
export function formatCompactCents(cents: number): string {
  const v = Math.abs(cents) / 100;
  if (v >= 1000) {
    return `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
  }
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

/**
 * Converte string de valor para centavos inteiros.
 * Aceita ponto ("4.28") ou vírgula ("R$ 4,28") como separador decimal.
 */
export function parseToCents(input: string): number {
  const cleaned = input.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return 0;
  // Se tem vírgula e ponto, assume ponto=milhar e vírgula=decimal (pt-BR).
  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}

/** true = entrada/crédito, false = saída/gasto. */
export function isIncome(cents: number): boolean {
  return cents > 0;
}
