import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge } from "@/components/category-badge";
import { CategoryForm } from "@/components/categories/category-form";

const KIND_LABEL: Record<string, string> = {
  expense: "Gasto",
  income: "Renda",
  transfer: "Transferência",
  investment: "Investimento",
};

export default async function CategoriasPage() {
  const session = await auth();
  const householdId = session!.user.householdId;

  const [categories, counts] = await Promise.all([
    prisma.category.findMany({ where: { householdId }, orderBy: { name: "asc" } }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      _count: true,
      where: { householdId, categoryId: { not: null } },
    }),
  ]);
  const countById = new Map(counts.map((c) => [c.categoryId, c._count]));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Categorias</h1>

      <Card>
        <CardContent className="pt-6">
          <CategoryForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {categories.length} categorias
          </CardTitle>
        </CardHeader>
        <ul className="divide-y divide-border">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-3">
              <CategoryBadge name={c.name} color={c.color} className="text-sm text-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{KIND_LABEL[c.kind]}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                  {countById.get(c.id) ?? 0}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
