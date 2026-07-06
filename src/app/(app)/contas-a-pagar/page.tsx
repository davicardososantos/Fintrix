import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/money";
import { BillCard } from "@/components/bills/bill-card";
import { AddBillForm } from "@/components/bills/add-bill-form";
import { EnablePushButton } from "@/components/bills/enable-push-button";
import { getMonthBills, currentPeriodKey } from "@/lib/bills";

export default async function ContasAPagarPage() {
  const session = await auth();
  const householdId = session!.user.householdId;

  const period = currentPeriodKey();
  const [bills, users] = await Promise.all([
    getMonthBills(householdId, period),
    prisma.user.findMany({
      where: { householdId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalCents = bills.reduce((s, b) => s + (b.amountCents ?? 0), 0);
  const paidCents = bills.reduce((s, b) => s + (b.paid ? (b.amountCents ?? 0) : 0), 0);
  const remainingCents = totalCents - paidCents;
  const openCount = bills.filter((b) => !b.paid).length;

  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(`${period}-01T12:00:00Z`),
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Contas a pagar</h1>
        <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
      </div>

      {bills.length > 0 && (
        <Card>
          <CardContent className="grid grid-cols-3 gap-3 pt-6">
            <div>
              <p className="text-xs text-muted-foreground">Total do mês</p>
              <Money amountCents={totalCents} colored={false} className="text-lg font-bold" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pago</p>
              <Money amountCents={paidCents} colored={false} className="text-lg font-bold text-positive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Falta</p>
              <Money
                amountCents={remainingCents}
                colored={false}
                className={`text-lg font-bold ${remainingCents > 0 ? "text-negative" : "text-positive"}`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {bills.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma conta cadastrada ainda. Cadastre suas contas fixas e avulsas abaixo para não
          esquecer nenhum vencimento.
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted-foreground">
            {openCount > 0 ? `${openCount} em aberto neste mês` : "Tudo pago neste mês 🎉"}
          </p>
          {bills.map((b) => (
            <BillCard key={b.id} bill={b} users={users} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova conta</CardTitle>
        </CardHeader>
        <CardContent>
          <AddBillForm users={users} />
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
