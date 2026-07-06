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

function revalidate() {
  revalidatePath("/contas-a-pagar");
  revalidatePath("/dashboard");
}

export type BillState = { error?: string; ok?: boolean } | undefined;

const billSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  amount: z.string().optional(),
  recurrence: z.enum(["monthly", "one_time"]),
  dueDay: z.string().optional(),
  dueDate: z.string().optional(),
  ownerId: z.string().optional(),
  notes: z.string().optional(),
});

/** Resolve dueDay/dueDate a partir do form conforme a recorrência. Retorna erro legível ou os valores. */
function resolveDue(data: z.infer<typeof billSchema>):
  | { error: string }
  | { dueDay: number | null; dueDate: Date | null } {
  if (data.recurrence === "monthly") {
    const day = Number(data.dueDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      return { error: "Informe o dia de vencimento (1 a 31)" };
    }
    return { dueDay: day, dueDate: null };
  }
  const date = data.dueDate ? parseDateISO(data.dueDate) : null;
  if (!date) return { error: "Informe a data de vencimento" };
  return { dueDay: null, dueDate: date };
}

/** Cadastra uma conta a pagar (fixa mensal ou avulsa). */
export async function addBillAction(_prev: BillState, formData: FormData): Promise<BillState> {
  const householdId = await requireHousehold();
  const parsed = billSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount") || undefined,
    recurrence: formData.get("recurrence"),
    dueDay: formData.get("dueDay") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    ownerId: formData.get("ownerId") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const due = resolveDue(parsed.data);
  if ("error" in due) return { error: due.error };

  const hasAmount = parsed.data.amount && parsed.data.amount.trim() !== "";
  const ownerId =
    parsed.data.ownerId && parsed.data.ownerId !== "casal" ? parsed.data.ownerId : null;

  await prisma.bill.create({
    data: {
      householdId,
      name: parsed.data.name,
      amountCents: hasAmount ? parseToCents(parsed.data.amount!) : null,
      recurrence: parsed.data.recurrence,
      dueDay: due.dueDay,
      dueDate: due.dueDate,
      ownerId,
      notes: parsed.data.notes || null,
    },
  });
  revalidate();
  return { ok: true };
}

const updateSchema = billSchema.extend({ billId: z.string().min(1) });

/** Edita uma conta a pagar existente. */
export async function updateBillAction(_prev: BillState, formData: FormData): Promise<BillState> {
  const householdId = await requireHousehold();
  const parsed = updateSchema.safeParse({
    billId: formData.get("billId"),
    name: formData.get("name"),
    amount: formData.get("amount") || undefined,
    recurrence: formData.get("recurrence"),
    dueDay: formData.get("dueDay") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    ownerId: formData.get("ownerId") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const bill = await prisma.bill.findFirst({ where: { id: parsed.data.billId, householdId } });
  if (!bill) return { error: "Conta inválida" };

  const due = resolveDue(parsed.data);
  if ("error" in due) return { error: due.error };

  const hasAmount = parsed.data.amount && parsed.data.amount.trim() !== "";
  const ownerId =
    parsed.data.ownerId && parsed.data.ownerId !== "casal" ? parsed.data.ownerId : null;

  await prisma.bill.update({
    where: { id: bill.id },
    data: {
      name: parsed.data.name,
      amountCents: hasAmount ? parseToCents(parsed.data.amount!) : null,
      recurrence: parsed.data.recurrence,
      dueDay: due.dueDay,
      dueDate: due.dueDate,
      ownerId,
      notes: parsed.data.notes || null,
    },
  });
  revalidate();
  return { ok: true };
}

/** Remove uma conta a pagar (e, em cascata, seus pagamentos). */
export async function deleteBillAction(_prev: BillState, formData: FormData): Promise<BillState> {
  const householdId = await requireHousehold();
  const billId = String(formData.get("billId") ?? "");
  const bill = await prisma.bill.findFirst({ where: { id: billId, householdId } });
  if (!bill) return { error: "Conta inválida" };

  await prisma.bill.delete({ where: { id: bill.id } });
  revalidate();
  return { ok: true };
}

const paidSchema = z.object({
  billId: z.string().min(1),
  periodKey: z.string().regex(/^\d{4}-\d{2}$/, "Período inválido"),
  amount: z.string().optional(),
});

/** Marca uma conta como paga no período informado (idempotente por billId+período). */
export async function markBillPaidAction(_prev: BillState, formData: FormData): Promise<BillState> {
  const householdId = await requireHousehold();
  const parsed = paidSchema.safeParse({
    billId: formData.get("billId"),
    periodKey: formData.get("periodKey"),
    amount: formData.get("amount") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const bill = await prisma.bill.findFirst({ where: { id: parsed.data.billId, householdId } });
  if (!bill) return { error: "Conta inválida" };

  const hasAmount = parsed.data.amount && parsed.data.amount.trim() !== "";
  const amountCents = hasAmount ? parseToCents(parsed.data.amount!) : bill.amountCents;

  await prisma.billPayment.upsert({
    where: { billId_periodKey: { billId: bill.id, periodKey: parsed.data.periodKey } },
    create: { billId: bill.id, householdId, periodKey: parsed.data.periodKey, amountCents },
    update: { amountCents, paidAt: new Date() },
  });
  revalidate();
  return { ok: true };
}

/** Desfaz o pagamento de uma conta no período. */
export async function unmarkBillPaidAction(_prev: BillState, formData: FormData): Promise<BillState> {
  const householdId = await requireHousehold();
  const parsed = paidSchema.safeParse({
    billId: formData.get("billId"),
    periodKey: formData.get("periodKey"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const bill = await prisma.bill.findFirst({ where: { id: parsed.data.billId, householdId } });
  if (!bill) return { error: "Conta inválida" };

  await prisma.billPayment.deleteMany({
    where: { billId: bill.id, periodKey: parsed.data.periodKey },
  });
  revalidate();
  return { ok: true };
}
