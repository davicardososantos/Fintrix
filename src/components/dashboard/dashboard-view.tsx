import Link from "next/link";
import { Upload, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthOverview } from "./month-overview";
import { RecentMovements } from "./recent-movements";
import { QuickActions } from "./quick-actions";
import { PageHeader } from "@/components/page-header";
import { NetWorthCard } from "@/components/net-worth-card";
import { MonthNav } from "@/components/reports/month-nav";
import { BarList } from "@/components/reports/bar-list";
import { BillReminderCard } from "@/components/bills/bill-reminder-card";
import { monthKeyToParam, type MonthKey } from "@/lib/reports/date-range";
import type { MonthSummary, CategorySlice, PersonSlice } from "@/lib/reports/reports";
import type { BillView } from "@/lib/bills";

export type RecentTransaction = {
  id: string;
  description: string;
  date: string;
  amountCents: number;
  categoryName: string | null;
};
export type DashboardViewProps = {
  name: string;
  householdName: string;
  hasTransactions: boolean;
  current: MonthKey;
  summary: MonthSummary;
  previous: MonthSummary;
  categories: CategorySlice[];
  people: PersonSlice[];
  accountsCents: number;
  investmentsCents: number;
  pointsTotal: number;
  bills: BillView[];
  recent: RecentTransaction[];
};
export function DashboardView(props: DashboardViewProps) {
  const { current, summary, previous, categories, people, recent } = props;
  const delta = summary.expenseCents - previous.expenseCents;
  const deltaPct =
    previous.expenseCents > 0 ? Math.round((delta / previous.expenseCents) * 100) : null;
  const monthParam = monthKeyToParam(current);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`Olá, ${props.name.split(" ")[0]} · ${props.householdName}`}
        title="Seu dinheiro, com clareza."
        description="Tudo o que você precisa para acompanhar as finanças de vocês."
      />
      <div className="grid items-stretch gap-5 xl:grid-cols-5">
        <div className="order-2 min-w-0 xl:order-1 xl:col-span-3">
          <MonthOverview summary={summary} />
        </div>
        <div className="order-4 min-w-0 xl:order-2 xl:col-span-2">
          <NetWorthCard
            accountsCents={props.accountsCents}
            investmentsCents={props.investmentsCents}
            pointsTotal={props.pointsTotal}
          />
        </div>
        <div className="order-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:order-3 xl:col-span-5">
          <div className="sm:w-72">
            <MonthNav current={current} />
          </div>
          {props.hasTransactions && deltaPct !== null && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {delta > 0 ? "+" : ""}
                {deltaPct}%
              </span>{" "}
              em gastos em relação ao mês anterior
            </p>
          )}
        </div>
        <section
          aria-label="Acesso rápido"
          className="order-3 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:order-4 xl:col-span-5"
        >
          <QuickActions />
        </section>
      </div>
      {!props.hasTransactions && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 sm:pt-6">
            <span className="icon-tile">
              <Wallet className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-semibold">Seu primeiro passo começa aqui</h2>
            <p className="text-sm text-muted-foreground">
              Importe um extrato ou fatura para descobrir como o dinheiro de vocês se movimenta.
            </p>
            <Button asChild className="self-start">
              <Link href="/importar">
                <Upload className="h-4 w-4" />
                Importar meu primeiro arquivo
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <BillReminderCard bills={props.bills} />
        {props.hasTransactions && <RecentMovements recent={recent} monthParam={monthParam} />}
      </div>
      {props.hasTransactions && (
        <div className="grid items-start gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Onde o dinheiro foi</CardTitle>
              <p className="text-xs text-muted-foreground">As cinco categorias com mais gastos</p>
            </CardHeader>
            <CardContent>
              <BarList
                items={categories.slice(0, 5).map((c) => ({
                  label: c.name,
                  totalCents: c.totalCents,
                  pct: c.pct,
                  color: c.color,
                  href: `/transacoes?categoryId=${c.categoryId ?? "none"}&m=${monthParam}`,
                }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gastos de cada um</CardTitle>
              <p className="text-xs text-muted-foreground">
                Uma visão compartilhada para decidir juntos
              </p>
            </CardHeader>
            <CardContent>
              <BarList
                items={people.map((p) => ({
                  label: p.name,
                  totalCents: p.totalCents,
                  pct: p.pct,
                  color: "primary",
                  href: `/transacoes?ownerId=${p.ownerId ?? "casal"}&m=${monthParam}`,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
