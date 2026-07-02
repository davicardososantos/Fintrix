import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/money";
import { ArrowDownRight, ArrowUpRight, LogOut } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const household = session?.user.householdId
    ? await prisma.household.findUnique({ where: { id: session.user.householdId } })
    : null;

  // Fase 1: dados ainda não existem (importação é a Fase 2). Mostramos o esqueleto do dashboard
  // com o tema aplicado para validar a base.
  const entrouCents = 0;
  const saiuCents = 0;
  const saldoCents = entrouCents - saiuCents;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Olá, {session?.user.name}</p>
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
            Saldo do mês
          </CardTitle>
          <Money amountCents={saldoCents} className="text-3xl font-bold" colored={false} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5 text-positive" /> Entrou
            </div>
            <Money amountCents={entrouCents} className="text-lg font-semibold" colored={false} />
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowDownRight className="h-3.5 w-3.5 text-negative" /> Saiu
            </div>
            <Money amountCents={saiuCents} className="text-lg font-semibold" colored={false} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comece por aqui</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ainda não há transações. Na <strong className="text-foreground">Fase 2</strong> você poderá
          importar extratos da C6 e da Alelo. Por enquanto, o app, o login e o tema já estão de pé. 🎉
        </CardContent>
      </Card>

      {/* Amostra dos tokens de domínio (validação visual do tema) */}
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-positive/15 px-3 py-1 text-xs font-medium text-positive">
          Entrada
        </span>
        <span className="rounded-full bg-negative/15 px-3 py-1 text-xs font-medium text-negative">
          Gasto
        </span>
        <span className="rounded-full bg-investment/15 px-3 py-1 text-xs font-medium text-investment">
          Investimento
        </span>
        <span className="rounded-full bg-points/15 px-3 py-1 text-xs font-medium text-points">
          Pontos
        </span>
      </div>
    </div>
  );
}
