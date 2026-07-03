import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/money";
import { AccountCard } from "@/components/accounts/account-card";
import { AddAccountForm } from "@/components/accounts/add-account-form";
import { getAccounts } from "@/lib/portfolio";

export default async function ContasPage() {
  const session = await auth();
  const householdId = session!.user.householdId;

  const { accounts, totalBalanceCents } = await getAccounts(householdId);
  const withBalance = accounts.filter((a) => a.balanceCents != null).length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Contas</h1>
        <p className="text-sm text-muted-foreground">
          Informe o saldo atual de cada conta ou carteira.
        </p>
      </div>

      {withBalance > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total nas contas
            </CardTitle>
            <Money amountCents={totalBalanceCents} colored={false} className="text-3xl font-bold" />
          </CardHeader>
        </Card>
      )}

      {accounts.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma conta ainda. Cadastre a primeira abaixo — contas também são criadas
          automaticamente quando você importa extratos.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((a) => (
            <AccountCard key={a.id} account={a} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cadastrar conta</CardTitle>
        </CardHeader>
        <CardContent>
          <AddAccountForm />
        </CardContent>
      </Card>
    </div>
  );
}
