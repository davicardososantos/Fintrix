import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { monthRange, addMonths, shortMonthLabel, type MonthKey } from "./date-range";

/**
 * Regras de contagem (spec 006): para "gastos" contamos saídas de categorias de kind `expense`
 * (ou sem categoria). Isso EXCLUI transferências (ex.: PGTO FAT CARTAO, PIX enviado) e pagamentos
 * de fatura — evitando dupla contagem com as compras da própria fatura. Renda = entradas de kind
 * `income` (ou sem categoria).
 */
function expenseWhere(householdId: string, range?: { gte: Date; lt: Date }): Prisma.TransactionWhereInput {
  return {
    householdId,
    ...(range ? { date: range } : {}),
    amountCents: { lt: 0 },
    OR: [{ category: { kind: "expense" } }, { categoryId: null }],
  };
}

function incomeWhere(householdId: string, range?: { gte: Date; lt: Date }): Prisma.TransactionWhereInput {
  return {
    householdId,
    ...(range ? { date: range } : {}),
    amountCents: { gt: 0 },
    OR: [{ category: { kind: "income" } }, { categoryId: null }],
  };
}

export type MonthSummary = { incomeCents: number; expenseCents: number; balanceCents: number };

/** Renda, gasto (magnitude positiva) e saldo do período. */
export async function getSummary(
  householdId: string,
  range?: { gte: Date; lt: Date },
  extra?: Prisma.TransactionWhereInput,
): Promise<MonthSummary> {
  const [inc, exp] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amountCents: true },
      where: { ...incomeWhere(householdId, range), ...extra },
    }),
    prisma.transaction.aggregate({
      _sum: { amountCents: true },
      where: { ...expenseWhere(householdId, range), ...extra },
    }),
  ]);
  const incomeCents = inc._sum.amountCents ?? 0;
  const expenseCents = Math.abs(exp._sum.amountCents ?? 0);
  return { incomeCents, expenseCents, balanceCents: incomeCents - expenseCents };
}

export type CategorySlice = {
  categoryId: string | null;
  name: string;
  color: string | null;
  totalCents: number;
  pct: number;
};

/** Gastos por categoria no período (ordenado desc, com %). */
export async function getByCategory(
  householdId: string,
  range?: { gte: Date; lt: Date },
  extra?: Prisma.TransactionWhereInput,
): Promise<CategorySlice[]> {
  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    _sum: { amountCents: true },
    where: { ...expenseWhere(householdId, range), ...extra },
  });

  const cats = await prisma.category.findMany({ where: { householdId } });
  const byId = new Map(cats.map((c) => [c.id, c]));

  const slices = grouped.map((g) => {
    const cat = g.categoryId ? byId.get(g.categoryId) : undefined;
    return {
      categoryId: g.categoryId,
      name: cat?.name ?? "Sem categoria",
      color: cat?.color ?? null,
      totalCents: Math.abs(g._sum.amountCents ?? 0),
      pct: 0,
    };
  });

  const total = slices.reduce((s, x) => s + x.totalCents, 0);
  slices.forEach((s) => (s.pct = total > 0 ? Math.round((s.totalCents / total) * 100) : 0));
  return slices.sort((a, b) => b.totalCents - a.totalCents);
}

export type PersonSlice = { ownerId: string | null; name: string; totalCents: number; pct: number };

/** Gastos por pessoa (eu / esposa / casal) no período. */
export async function getByPerson(
  householdId: string,
  range?: { gte: Date; lt: Date },
): Promise<PersonSlice[]> {
  const grouped = await prisma.transaction.groupBy({
    by: ["ownerId"],
    _sum: { amountCents: true },
    where: expenseWhere(householdId, range),
  });
  const users = await prisma.user.findMany({ where: { householdId }, select: { id: true, name: true } });
  const nameById = new Map(users.map((u) => [u.id, u.name.split(" ")[0]]));

  const slices = grouped.map((g) => ({
    ownerId: g.ownerId,
    name: g.ownerId ? (nameById.get(g.ownerId) ?? "—") : "Casal",
    totalCents: Math.abs(g._sum.amountCents ?? 0),
    pct: 0,
  }));
  const total = slices.reduce((s, x) => s + x.totalCents, 0);
  slices.forEach((s) => (s.pct = total > 0 ? Math.round((s.totalCents / total) * 100) : 0));
  return slices.sort((a, b) => b.totalCents - a.totalCents);
}

export type MonthPoint = { key: MonthKey; label: string; incomeCents: number; expenseCents: number };

/** Série dos últimos N meses (a partir de `end`, inclusive) — para o gráfico de evolução. */
export async function getMonthlySeries(
  householdId: string,
  end: MonthKey,
  months: number,
): Promise<MonthPoint[]> {
  const keys: MonthKey[] = [];
  for (let i = months - 1; i >= 0; i--) keys.push(addMonths(end, -i));

  return Promise.all(
    keys.map(async (key) => {
      const s = await getSummary(householdId, monthRange(key));
      return { key, label: shortMonthLabel(key), incomeCents: s.incomeCents, expenseCents: s.expenseCents };
    }),
  );
}

/** Mês mais recente com transações (para default do seletor). Null se não há dados. */
export async function getLatestMonthWithData(householdId: string): Promise<MonthKey | null> {
  const latest = await prisma.transaction.findFirst({
    where: { householdId },
    orderBy: { date: "desc" },
    select: { date: true },
  });
  if (!latest) return null;
  return { year: latest.date.getUTCFullYear(), month: latest.date.getUTCMonth() + 1 };
}
