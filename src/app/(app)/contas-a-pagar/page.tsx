import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/money";
import { BillCard } from "@/components/bills/bill-card";
import { BillGroupCard } from "@/components/bills/bill-group-card";
import { AddBillForm } from "@/components/bills/add-bill-form";
import { EnablePushButton } from "@/components/bills/enable-push-button";
import { MonthNav } from "@/components/reports/month-nav";
import { getMonthBills, getBillParentOptions, currentPeriodKey } from "@/lib/bills";
import {
  currentMonthKey,
  monthKeyToParam,
  monthLabel,
  parseMonthParam,
} from "@/lib/reports/date-range";

export default async function ContasAPagarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await auth();
  const householdId = session!.user.householdId;

  const sp = await searchParams;
  // Contas a pagar olham pra frente: o padrão é o mês atual (nunca o último mês com dados).
  const current = parseMonthParam(sp.m) ?? currentMonthKey();
  const period = monthKeyToParam(current);
  const thisPeriod = currentPeriodKey();

  const [{ rows, totals }, users, parents, billCount] = await Promise.all([
    getMonthBills(householdId, period),
    prisma.user.findMany({
      where: { householdId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    getBillParentOptions(householdId),
    prisma.bill.count({ where: { householdId, active: true } }),
  ]);

  const isCurrent = period === thisPeriod;
  const isFuture = period > thisPeriod;
  const label = monthLabel(current);
  const openLabel =
    totals.openCount === 0
      ? "Tudo pago neste mês 🎉"
      : isCurrent
        ? `${totals.openCount} em aberto neste mês`
        : isFuture
          ? `${totals.openCount} a vencer`
          : `${totals.openCount} em aberto de ${label}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-bold">Contas a pagar</h1>
        <MonthNav current={current} />
        {!isCurrent && (
          <Link href="/contas-a-pagar" className="text-xs font-medium text-primary">
            Voltar para {monthLabel(currentMonthKey())}
          </Link>
        )}
      </div>

      {rows.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Total do mês</p>
                <Money
                  amountCents={totals.totalCents}
                  colored={false}
                  className="text-lg font-bold"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pago</p>
                <Money
                  amountCents={totals.paidCents}
                  colored={false}
                  className="text-lg font-bold text-positive"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Falta</p>
                <Money
                  amountCents={totals.remainingCents}
                  colored={false}
                  className={`text-lg font-bold ${totals.remainingCents > 0 ? "text-negative" : "text-positive"}`}
                />
              </div>
            </div>
            {totals.missingTotals > 0 && (
              <p className="text-xs text-warning">
                {totals.missingTotals === 1
                  ? "1 conta sem valor informado neste mês — o total pode estar incompleto."
                  : `${totals.missingTotals} contas sem valor informado neste mês — o total pode estar incompleto.`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {rows.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {billCount === 0
            ? "Nenhuma conta cadastrada ainda. Cadastre suas contas fixas e avulsas abaixo para não esquecer nenhum vencimento."
            : `Nenhuma conta vence em ${label}.`}
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted-foreground">{openLabel}</p>
          {rows.map((r) =>
            r.kind === "group" ? (
              <BillGroupCard
                key={r.group.parent.id}
                group={r.group}
                users={users}
                parents={parents}
                monthLabel={label}
              />
            ) : (
              <BillCard key={r.bill.id} bill={r.bill} users={users} parents={parents} />
            ),
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova conta</CardTitle>
        </CardHeader>
        <CardContent>
          <AddBillForm users={users} parents={parents} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lembretes</CardTitle>
        </CardHeader>
        <CardContent>
          <EnablePushButton />
        </CardContent>
      </Card>
    </div>
  );
}
