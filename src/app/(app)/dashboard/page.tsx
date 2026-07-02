import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/money";
import { ArrowDownRight, ArrowUpRight, LogOut, Upload } from "lucide-react";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export default async function DashboardPage() {
  const session = await auth();
  const householdId = session!.user.householdId;

  const [household, entrouAgg, saiuAgg, count, recentes] = await Promise.all([
    prisma.household.findUnique({ where: { id: householdId } }),
    prisma.transaction.aggregate({
      _sum: { amountCents: true },
      where: { householdId, amountCents: { gt: 0 } },
    }),
    prisma.transaction.aggregate({
      _sum: { amountCents: true },
      where: { householdId, amountCents: { lt: 0 } },
    }),
    prisma.transaction.count({ where: { householdId } }),
    prisma.transaction.findMany({
      where: { householdId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 10,
      include: { account: true },
    }),
  ]);

  const entrou = entrouAgg._sum.amountCents ?? 0;
  const saiu = saiuAgg._sum.amountCents ?? 0;
  const saldo = entrou + saiu;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Olá, {session!.user.name}</p>
          <h1 className="text-xl font-bold">{household?.name ?? "Fintrix"}</h1>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Resumo geral
          </CardTitle>
          <Money amountCents={saldo} className="text-3xl font-bold" colored={false} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5 text-positive" /> Entrou
            </div>
            <Money amountCents={entrou} className="text-lg font-semibold" colored={false} />
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowDownRight className="h-3.5 w-3.5 text-negative" /> Saiu
            </div>
            <Money amountCents={saiu} className="text-lg font-semibold" colored={false} />
          </div>
        </CardContent>
      </Card>

      {count === 0 ? (
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
      ) : (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Últimas transações</h2>
            <Link href="/transacoes" className="text-xs font-medium text-primary">
              Ver todas
            </Link>
          </div>
          <Card>
            <ul className="divide-y divide-border">
              {recentes.map((t) => (
                <li key={t.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {dateFmt.format(t.date)} · {t.account?.name ?? "—"}
                    </p>
                  </div>
                  <Money amountCents={t.amountCents} signed className="shrink-0 text-sm font-semibold" />
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
