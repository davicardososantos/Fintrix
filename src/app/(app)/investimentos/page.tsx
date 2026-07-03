import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/money";
import { AddInvestmentForm } from "@/components/investments/add-investment-form";
import { InvestmentCard } from "@/components/investments/investment-card";
import { getInvestments } from "@/lib/portfolio";

export default async function InvestimentosPage() {
  const session = await auth();
  const householdId = session!.user.householdId;

  const [{ investments, totalInvestedCents }, users] = await Promise.all([
    getInvestments(householdId),
    prisma.user.findMany({ where: { householdId }, select: { id: true, name: true } }),
  ]);

  const totalPrincipal = investments.reduce((s, i) => s + i.principalCents, 0);
  const totalYield = totalInvestedCents - totalPrincipal;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Investimentos</h1>

      {investments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total investido
            </CardTitle>
            <Money amountCents={totalInvestedCents} colored={false} className="text-3xl font-bold" />
          </CardHeader>
          <CardContent>
            <p className={`text-sm tabular-nums ${totalYield >= 0 ? "text-positive" : "text-negative"}`}>
              {totalYield >= 0 ? "+" : ""}
              <Money amountCents={totalYield} colored={false} /> de rendimento
            </p>
          </CardContent>
        </Card>
      )}

      {investments.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum investimento ainda. Cadastre o primeiro abaixo (ex.: seu CDB C6).
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {investments.map((inv) => (
            <InvestmentCard key={inv.id} inv={inv} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cadastrar investimento</CardTitle>
        </CardHeader>
        <CardContent>
          <AddInvestmentForm users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
