import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/money";
import { MonthNav } from "@/components/reports/month-nav";
import { BarList } from "@/components/reports/bar-list";
import { LogOut, Upload, ArrowUpRight, ArrowDownRight, TrendingDown, TrendingUp } from "lucide-react";
import { getSummary, getByCategory, getByPerson, getLatestMonthWithData } from "@/lib/reports/reports";
import { monthRange, addMonths, parseMonthParam } from "@/lib/reports/date-range";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await auth();
  const householdId = session!.user.householdId;
  const sp = await searchParams;

  const total = await prisma.transaction.count({ where: { householdId } });
  const household = await prisma.household.findUnique({ where: { id: householdId } });

  if (total === 0) {
    return (
      <div className="flex flex-col gap-5">
        <Header name={session!.user.name} householdName={household?.name} />
        <Card>
          <CardHeader>
            <CardTitle>Comece por aqui</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            Ainda não há transações. Importe um extrato ou fatura para começar.
            <Button asChild className="w-full">
              <Link href="/importar">
                <Upload className="h-4 w-4" /> Importar arquivo
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latest = (await getLatestMonthWithData(householdId))!;
  const current = parseMonthParam(sp.m) ?? latest;
  const prev = addMonths(current, -1);

  const [summary, prevSummary, byPerson, byCategory] = await Promise.all([
    getSummary(householdId, monthRange(current)),
    getSummary(householdId, monthRange(prev)),
    getByPerson(householdId, monthRange(current)),
    getByCategory(householdId, monthRange(current)),
  ]);

  const deltaCents = summary.expenseCents - prevSummary.expenseCents;
  const deltaPct =
    prevSummary.expenseCents > 0 ? Math.round((deltaCents / prevSummary.expenseCents) * 100) : null;

  return (
    <div className="flex flex-col gap-5">
      <Header name={session!.user.name} householdName={household?.name} />
      <MonthNav current={current} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Saldo do mês</CardTitle>
          <Money amountCents={summary.balanceCents} className="text-3xl font-bold" colored={false} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-muted p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowUpRight className="h-3.5 w-3.5 text-positive" /> Entrou
              </div>
              <Money amountCents={summary.incomeCents} className="text-lg font-semibold" colored={false} />
            </div>
            <div className="rounded-md bg-muted p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowDownRight className="h-3.5 w-3.5 text-negative" /> Saiu
              </div>
              <Money amountCents={summary.expenseCents} className="text-lg font-semibold" colored={false} />
            </div>
          </div>
          {deltaPct !== null && (
            <div className="flex items-center gap-1.5 text-xs">
              {deltaCents > 0 ? (
                <TrendingUp className="h-4 w-4 text-negative" />
              ) : (
                <TrendingDown className="h-4 w-4 text-positive" />
              )}
              <span className={deltaCents > 0 ? "text-negative" : "text-positive"}>
                {deltaCents > 0 ? "+" : ""}
                {deltaPct}% em gastos vs. mês anterior
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placar do casal */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Quem gastou mais</h2>
        <Card>
          <CardContent className="pt-6">
            <BarList
              items={byPerson.map((p) => ({ label: p.name, totalCents: p.totalCents, pct: p.pct, color: "primary" }))}
            />
          </CardContent>
        </Card>
      </section>

      {/* Top categorias */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Onde gastou</h2>
          <Link href="/relatorios" className="text-xs font-medium text-primary">
            Relatórios
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <BarList
              items={byCategory.slice(0, 5).map((c) => ({
                label: c.name,
                totalCents: c.totalCents,
                pct: c.pct,
                color: c.color,
                href: c.categoryId
                  ? `/transacoes?categoryId=${c.categoryId}`
                  : "/transacoes?categoryId=none",
              }))}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Header({ name, householdName }: { name?: string | null; householdName?: string | null }) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Olá, {name}</p>
        <h1 className="text-xl font-bold">{householdName ?? "Fintrix"}</h1>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button variant="ghost" size="icon" aria-label="Sair">
          <LogOut className="h-5 w-5" />
        </Button>
      </form>
    </header>
  );
}
