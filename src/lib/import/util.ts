// Utilidades comuns dos parsers de importação.

/** Converte "DD/MM/YYYY" em Date (meio-dia UTC para evitar deslocamento de fuso). */
export function parseDateBR(input: string): Date | null {
  const m = input.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 12));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Converte "YYYY-MM-DD" em Date (meio-dia UTC). */
export function parseDateISO(input: string): Date | null {
  const m = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, yyyy, mm, dd] = m;
  const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 12));
  return Number.isNaN(d.getTime()) ? null : d;
}

const COMBINING_MARKS = /[̀-ͯ]/g;

/** Normaliza descrição para o dedup: trim, colapsa espaços, remove acentos, uppercase. */
export function normalizeDescription(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}
