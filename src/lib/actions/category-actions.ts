"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  kind: z.enum(["expense", "income", "transfer", "investment"]),
  color: z.enum(["primary", "accent", "investment", "points", "warning", "muted"]),
});

export type CategoryState = { error?: string; ok?: boolean } | undefined;

/** Cria uma categoria para o household (spec 002, RF5). */
export async function createCategoryAction(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const session = await auth();
  if (!session?.user?.householdId) return { error: "Sessão inválida" };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const exists = await prisma.category.findFirst({
    where: { householdId: session.user.householdId, name: parsed.data.name },
  });
  if (exists) return { error: "Já existe uma categoria com esse nome" };

  await prisma.category.create({
    data: { householdId: session.user.householdId, ...parsed.data },
  });
  revalidatePath("/categorias");
  revalidatePath("/transacoes");
  return { ok: true };
}
