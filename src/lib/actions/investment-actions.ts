"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseToCents } from "@/lib/money";
import { parseDateISO } from "@/lib/import/util";

async function requireHousehold() {
  const session = await auth();
  if (!session?.user?.householdId) throw new Error("Sessão inválida");
  return session.user.householdId;
}

export type InvestmentState = { error?: string; ok?: boolean } | undefined;

const investmentSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  type: z.enum(["cdb", "other"]),
  institution: z.string().optional(),
  principal: z.string().min(1, "Informe o valor aplicado"),
  appliedAt: z.string().min(1, "Informe a data"),
  maturityAt: z.string().optional(),
  ownerId: z.string().optional(),
});

/** Cadastra um investimento. */
export async function addInvestmentAction(
  _prev: InvestmentState,
  formData: FormData,
): Promise<InvestmentState> {
  const householdId = await requireHousehold();
  const parsed = investmentSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    institution: formData.get("institution") || undefined,
    principal: formData.get("principal"),
    appliedAt: formData.get("appliedAt"),
    maturityAt: formData.get("maturityAt") || undefined,
    ownerId: formData.get("ownerId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const principalCents = parseToCents(parsed.data.principal);
  if (principalCents <= 0) return { error: "Valor aplicado inválido" };
  const appliedAt = parseDateISO(parsed.data.appliedAt);
  if (!appliedAt) return { error: "Data inválida" };

  const ownerId = parsed.data.ownerId && parsed.data.ownerId !== "casal" ? parsed.data.ownerId : null;
  if (ownerId) {
    const ok = await prisma.user.findFirst({ where: { id: ownerId, householdId } });
    if (!ok) return { error: "Pessoa inválida" };
  }

  await prisma.investment.create({
    data: {
      householdId,
      name: parsed.data.name,
      type: parsed.data.type,
      institution: parsed.data.institution,
      principalCents,
      appliedAt,
      maturityAt: parsed.data.maturityAt ? parseDateISO(parsed.data.maturityAt) : null,
      ownerId,
    },
  });
  revalidatePath("/investimentos");
  return { ok: true };
}

const snapshotSchema = z.object({
  investmentId: z.string(),
  value: z.string().min(1, "Informe o valor atual"),
  date: z.string(),
});

/** Atualiza o valor atual de um investimento (cria snapshot). */
export async function addInvestmentSnapshotAction(
  _prev: InvestmentState,
  formData: FormData,
): Promise<InvestmentState> {
  const householdId = await requireHousehold();
  const parsed = snapshotSchema.safeParse({
    investmentId: formData.get("investmentId"),
    value: formData.get("value"),
    date: formData.get("date"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const inv = await prisma.investment.findFirst({
    where: { id: parsed.data.investmentId, householdId },
  });
  if (!inv) return { error: "Investimento inválido" };

  const valueCents = parseToCents(parsed.data.value);
  if (valueCents <= 0) return { error: "Valor inválido" };
  const date = parseDateISO(parsed.data.date) ?? new Date();

  await prisma.investmentSnapshot.create({
    data: { investmentId: inv.id, valueCents, date },
  });
  revalidatePath("/investimentos");
  return { ok: true };
}
