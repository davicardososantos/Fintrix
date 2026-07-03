import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Filters } from "@/components/transactions/filters";
import { TransactionItem, type TransactionDTO } from "@/components/transactions/transaction-item";
import { RecategorizeButton } from "@/components/transactions/recategorize-button";

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    categoryId?: string;
    ownerId?: string;
    accountId?: string;
  }>;
}) {
  const session = await auth();
  const householdId = session!.user.householdId;
  const sp = await searchParams;

  const where: Prisma.TransactionWhereInput = { householdId };
  if (sp.q) where.description = { contains: sp.q };
  if (sp.categoryId === "none") where.categoryId = null;
  else if (sp.categoryId) where.categoryId = sp.categoryId;
  if (sp.ownerId === "casal") where.ownerId = null;
  else if (sp.ownerId) where.ownerId = sp.ownerId;
  if (sp.accountId) where.accountId = sp.accountId;

  const [transactions, categories, users, accounts] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 200,
      include: { category: true, account: true, owner: true },
    }),
    prisma.category.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { householdId }, select: { id: true, name: true } }),
    prisma.financialAccount.findMany({ where: { householdId }, select: { id: true, name: true } }),
  ]);

  const dtos: TransactionDTO[] = transactions.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    accountName: t.account?.name ?? null,
    amountCents: t.amountCents,
    categoryId: t.categoryId,
    categoryName: t.category?.name ?? null,
    categoryColor: t.category?.color ?? null,
    categorySource: t.categorySource,
    ownerId: t.ownerId,
    ownerName: t.owner?.name.split(" ")[0] ?? null,
  }));

  const catOptions = categories.map((c) => ({ id: c.id, name: c.name, color: c.color }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Transações</h1>
        <RecategorizeButton />
      </div>

      <Filters
        options={{
          categories: categories.map((c) => ({ id: c.id, name: c.name })),
          users,
          accounts,
        }}
      />

      <p className="text-xs text-muted-foreground">{dtos.length} transações</p>

      {dtos.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma transação para os filtros escolhidos.
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {dtos.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} categories={catOptions} users={users} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
