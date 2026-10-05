import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import {
  getSummary,
  getByCategory,
  getByPerson,
  getLatestMonthWithData,
} from "@/lib/reports/reports";
import { getAccounts, getInvestments, getPointsPrograms } from "@/lib/portfolio";
import { getUnpaidBills } from "@/lib/bills";
import { monthRange, addMonths, parseMonthParam, currentMonthKey } from "@/lib/reports/date-range";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await auth();
  const householdId = session!.user.householdId;
  const sp = await searchParams;
  const [total, household, accounts, investments, points, bills, latest] = await Promise.all([
    prisma.transaction.count({ where: { householdId } }),
    prisma.household.findUnique({ where: { id: householdId }, select: { name: true } }),
    getAccounts(householdId),
    getInvestments(householdId),
    getPointsPrograms(householdId),
    getUnpaidBills(householdId),
    getLatestMonthWithData(householdId),
  ]);
  const current = parseMonthParam(sp.m) ?? latest ?? currentMonthKey();
  const range = monthRange(current);
  const [summary, previous, categories, people, recent] = await Promise.all([
    getSummary(householdId, range),
    getSummary(householdId, monthRange(addMonths(current, -1))),
    getByCategory(householdId, range),
    getByPerson(householdId, range),
    prisma.transaction.findMany({
      where: { householdId, date: range },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        description: true,
        date: true,
        amountCents: true,
        category: { select: { name: true } },
      },
    }),
  ]);
  return (
    <DashboardView
      name={session!.user.name ?? "Família"}
      householdName={household?.name ?? "Fintrix"}
      hasTransactions={total > 0}
      current={current}
      summary={summary}
      previous={previous}
      categories={categories}
      people={people}
      accountsCents={accounts.totalBalanceCents}
      investmentsCents={investments.totalInvestedCents}
      pointsTotal={points.reduce((sum, p) => sum + p.balance, 0)}
      bills={bills}
      recent={recent.map((t) => ({
        id: t.id,
        description: t.description,
        date: t.date.toISOString(),
        amountCents: t.amountCents,
        categoryName: t.category?.name ?? null,
      }))}
    />
  );
}
