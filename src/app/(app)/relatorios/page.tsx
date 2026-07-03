import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/money";
import { MonthNav } from "@/components/reports/month-nav";
import { BarList } from "@/components/reports/bar-list";
import { IncomeExpenseChart } from "@/components/reports/income-expense-chart";
import { PersonFilter } from "@/components/reports/person-filter";
import {
  getSummary,
  getByCategory,
  getByPerson,
  getMonthlySeries,
  getLatestMonthWithData,
} from "@/lib/reports/reports";
import { monthRange, parseMonthParam, monthKeyToParam } from "@/lib/reports/date-range";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; person?: string }>;
}) {
  const session = await auth();
  const householdId = session!.user.householdId;
  const sp = await searchParams;

  const total = await prisma.transaction.count({ where: { householdId } });
  if (total === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">Relatórios</h1>
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Importe transações para ver os relatórios.
        </Card>
      </div>
    );
  }

  const latest = (await getLatestMonthWithData(householdId))!;
  const current = parseMonthParam(sp.m) ?? latest;
  const range = monthRange(current);

  // Filtro por pessoa (afeta resumo e por-categoria)
  const users = await prisma.user.findMany({ where: { householdId }, select: { id: true, name: true } });
  let personExtra: Prisma.TransactionWhereInput | undefined;
  if (sp.person === "casal") personExtra = { ownerId: null };
  else if (sp.person) personExtra = { ownerId: sp.person };

  const [summary, byCategory, byPerson, series] = await Promise.all([
    getSummary(householdId, range, personExtra),
    getByCategory(householdId, range, personExtra),
    getByPerson(householdId, range),
    getMonthlySeries(householdId, current, 6),
  ]);

  const personOptions = [
    { value: "", label: "Todos" },
    { value: "casal", label: "Família" },
    ...users.map((u) => ({ value: u.id, label: u.name.split(" ")[0] })),
  ];

  const drill = (categoryPart: string) => {
    const parts = [categoryPart, `m=${monthKeyToParam(current)}`];
    if (sp.person === "casal") parts.push("ownerId=casal");
    else if (sp.person) parts.push("ownerId=" + sp.person);
    return `/transacoes?${parts.join("&")}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Relatórios</h1>
      <MonthNav current={current} />
      <PersonFilter options={personOptions} />

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryTile label="Entrou" cents={summary.incomeCents} tone="positive" />
        <SummaryTile label="Saiu" cents={summary.expenseCents} tone="negative" />
        <SummaryTile label="Saldo" cents={summary.balanceCents} />
      </div>

      {/* Evolução mensal: entradas x gastos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Entradas x Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeExpenseChart
            points={series.map((s) => ({
              key: s.key,
              label: s.label,
              incomeCents: s.incomeCents,
              expenseCents: s.expenseCents,
            }))}
            activeParam={monthKeyToParam(current)}
          />
        </CardContent>
      </Card>

      {/* Por pessoa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Gastos por pessoa</CardTitle>
        </CardHeader>
        <CardContent>
          <BarList
            items={byPerson.map((p) => ({ label: p.name, totalCents: p.totalCents, pct: p.pct, color: "primary" }))}
          />
        </CardContent>
      </Card>

      {/* Por categoria (drill-down) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Gastos por categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <BarList
            items={byCategory.map((c) => ({
              label: c.name,
              totalCents: c.totalCents,
              pct: c.pct,
              color: c.color,
              href: drill(c.categoryId ? `categoryId=${c.categoryId}` : "categoryId=none"),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  label,
  cents,
  tone,
}: {
  label: string;
  cents: number;
  tone?: "positive" | "negative";
}) {
  const color = tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-base font-bold tabular-nums ${color}`}>
        <Money amountCents={cents} colored={false} />
      </p>
    </div>
  );
}
