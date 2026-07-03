"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseToCents } from "@/lib/money";

async function requireHousehold() {
  const session = await auth();
  if (!session?.user?.householdId) throw new Error("Sessão inválida");
  return session.user.householdId;
}

export type AccountState = { error?: string; ok?: boolean } | undefined;

const accountSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  type: z.enum(["checking", "credit_card", "meal_voucher", "cash", "other"]),
  institution: z.string().optional(),
  balance: z.string().optional(),
});

/** Cadastra uma conta/carteira manualmente, com saldo inicial opcional. */
export async function addAccountAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const householdId = await requireHousehold();
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    institution: formData.get("institution") || undefined,
    balance: formData.get("balance") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const exists = await prisma.financialAccount.findUnique({
    where: { householdId_name: { householdId, name: parsed.data.name } },
  });
  if (exists) return { error: "Já existe uma conta com esse nome" };

  const hasBalance = parsed.data.balance && parsed.data.balance.trim() !== "";
  await prisma.financialAccount.create({
    data: {
      householdId,
      name: parsed.data.name,
      type: parsed.data.type,
      institution: parsed.data.institution,
      balanceCents: hasBalance ? parseToCents(parsed.data.balance!) : null,
      balanceUpdatedAt: hasBalance ? new Date() : null,
    },
  });
  revalidatePath("/contas");
  revalidatePath("/dashboard");
  return { ok: true };
}

const balanceSchema = z.object({
  accountId: z.string(),
  balance: z.string().min(1, "Informe o saldo"),
});

/** Atualiza o saldo atual de uma conta. */
export async function updateAccountBalanceAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const householdId = await requireHousehold();
  const parsed = balanceSchema.safeParse({
    accountId: formData.get("accountId"),
    balance: formData.get("balance"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const account = await prisma.financialAccount.findFirst({
    where: { id: parsed.data.accountId, householdId },
  });
  if (!account) return { error: "Conta inválida" };

  await prisma.financialAccount.update({
    where: { id: account.id },
    data: { balanceCents: parseToCents(parsed.data.balance), balanceUpdatedAt: new Date() },
  });
  revalidatePath("/contas");
  revalidatePath("/dashboard");
  return { ok: true };
}
