"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";

const registerSchema = z.object({
  householdName: z.string().min(2, "Nome do casal muito curto"),
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha precisa de ao menos 6 caracteres"),
});

export type ActionState = { error?: string } | undefined;

/**
 * Cria um Household + primeiro User (owner) e já autentica.
 * Este é o cadastro inicial do casal (Fase 1). Convidar o cônjuge vem depois.
 */
export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    householdName: formData.get("householdName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { householdName, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Já existe uma conta com esse e-mail" };

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.household.create({
    data: {
      name: householdName,
      users: { create: { name, email, passwordHash, role: "owner" } },
    },
  });

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  return undefined;
}
