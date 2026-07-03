"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { categorizeHousehold } from "@/lib/categorization/pipeline";
import { normalizeDescription } from "@/lib/import/util";

async function requireHousehold() {
  const session = await auth();
  if (!session?.user?.householdId) throw new Error("Sessão inválida");
  return session.user.householdId;
}

function revalidate() {
  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
}

/** Roda o pipeline de categorização/atribuição para o household. */
export async function recategorizeAction() {
  const householdId = await requireHousehold();
  const result = await categorizeHousehold(householdId);
  revalidate();
  return result;
}

/** Edita a categoria manualmente (fixa categorySource=manual — não é sobrescrita pela IA). */
export async function updateCategoryAction(transactionId: string, categoryId: string | null) {
  const householdId = await requireHousehold();
  await prisma.transaction.updateMany({
    where: { id: transactionId, householdId },
    data: { categoryId, categorySource: categoryId ? "manual" : "uncategorized" },
  });
  revalidate();
}

/** Atribui a transação a uma pessoa (userId) ou ao casal (null). Marca como manual. */
export async function updateOwnerAction(transactionId: string, ownerId: string | null) {
  const householdId = await requireHousehold();
  // valida que o owner pertence ao mesmo household (ou é null=casal)
  if (ownerId) {
    const ok = await prisma.user.findFirst({ where: { id: ownerId, householdId } });
    if (!ok) throw new Error("Usuário inválido");
  }
  await prisma.transaction.updateMany({
    where: { id: transactionId, householdId },
    data: { ownerId, ownerManual: true },
  });
  revalidate();
}

/**
 * Cria uma regra a partir de uma transação (spec 002, RF6). Opcionalmente aplica retroativamente
 * às transações que casam (sem rebaixar as manuais).
 */
export async function createRuleFromTransactionAction(
  pattern: string,
  categoryId: string,
  applyRetroactive: boolean,
) {
  const householdId = await requireHousehold();
  const clean = pattern.trim();
  if (!clean) throw new Error("Padrão vazio");

  await prisma.categoryRule.create({
    data: { householdId, matchType: "contains", pattern: clean, categoryId, priority: 50 },
  });

  if (applyRetroactive) {
    const target = normalizeDescription(clean);
    const candidates = await prisma.transaction.findMany({
      where: { householdId, categorySource: { not: "manual" } },
      select: { id: true, description: true },
    });
    const ids = candidates
      .filter((t) => normalizeDescription(t.description).includes(target))
      .map((t) => t.id);
    if (ids.length > 0) {
      await prisma.transaction.updateMany({
        where: { id: { in: ids }, householdId },
        data: { categoryId, categorySource: "rule" },
      });
    }
  }

  revalidate();
}
