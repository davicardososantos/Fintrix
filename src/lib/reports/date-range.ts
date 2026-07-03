// Utilitários de mês para os relatórios. Datas em UTC (transações são gravadas ao meio-dia UTC).

export type MonthKey = { year: number; month: number }; // month: 1-12

export function monthRange({ year, month }: MonthKey): { gte: Date; lt: Date } {
  return {
    gte: new Date(Date.UTC(year, month - 1, 1)),
    lt: new Date(Date.UTC(year, month, 1)),
  };
}

export function addMonths({ year, month }: MonthKey, delta: number): MonthKey {
  const idx = (year * 12 + (month - 1)) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export function monthKeyToParam({ year, month }: MonthKey): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthParam(value: string | undefined): MonthKey | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
}

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function monthLabel({ year, month }: MonthKey): string {
  return `${MONTHS_PT[month - 1]} de ${year}`;
}

export function shortMonthLabel({ year, month }: MonthKey): string {
  return `${MONTHS_PT[month - 1].slice(0, 3)}/${String(year).slice(2)}`;
}
