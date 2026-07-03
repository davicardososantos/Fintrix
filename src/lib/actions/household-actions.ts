"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const memberSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha de ao menos 6 caracteres"),
});

export type MemberState = { error?: string; ok?: boolean } | undefined;

/**
 * Adiciona o(a) cônjuge como membro do household (contas individuais — spec/PRD). Só o owner pode.
 * Habilita a atribuição "eu / esposa / casal".
 */
export async function addMemberAction(
  _prev: MemberState,
  formData: FormData,
): Promise<MemberState> {
  const session = await auth();
  if (!session?.user?.householdId) return { error: "Sessão inválida" };
  if (session.user.role !== "owner") return { error: "Apenas o titular pode adicionar membros" };

  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { error: "Já existe uma conta com esse e-mail" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      householdId: session.user.householdId,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "member",
    },
  });

  revalidatePath("/mais");
  revalidatePath("/transacoes");
  return { ok: true };
}
