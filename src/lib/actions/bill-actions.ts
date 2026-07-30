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
  parentId: z.string().optional(),
  notes: z.string().optional(),
});

/** Lê os campos comuns do formulário de conta. */
function readBillForm(formData: FormData) {
  return {
    name: formData.get("name"),
    amount: formData.get("amount") || undefined,
    recurrence: formData.get("recurrence"),
    dueDay: formData.get("dueDay") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    ownerId: formData.get("ownerId") || undefined,
    parentId: formData.get("parentId") || undefined,
    notes: formData.get("notes") || undefined,
  };
}

/**
 * Valida o vínculo "dentro da fatura": só 1 nível, sem auto-referência, mesmo household e
 * pai fixo mensal. Com 1 nível garantido, ciclos são estruturalmente impossíveis.
 */
async function resolveParent(
  householdId: string,
  raw: string | undefined,
  selfId?: string,
): Promise<{ error: string } | { parentId: string | null }> {
  const parentId = raw && raw !== "none" ? raw : null;
  if (!parentId) return { parentId: null };
  if (selfId && parentId === selfId) return { error: "Uma conta não pode estar dentro dela mesma" };

  const parent = await prisma.bill.findFirst({ where: { id: parentId, householdId } });
  if (!parent) return { error: "Conta principal inválida" };
  if (parent.parentId) return { error: "A conta escolhida já está dentro de outra (só 1 nível)" };
  if (parent.recurrence !== "monthly") return { error: "A conta principal precisa ser fixa mensal" };
  if (selfId && (await prisma.bill.count({ where: { parentId: selfId } })) > 0) {
    return { error: "Esta conta já tem contas dentro dela — não pode entrar em outra" };
  }
  return { parentId };
}

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

/** Cadastra uma conta a pagar (fixa mensal, avulsa ou dentro da fatura de outra). */
export async function addBillAction(_prev: BillState, formData: FormData): Promise<BillState> {
  const householdId = await requireHousehold();
  const parsed = billSchema.safeParse(readBillForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const parent = await resolveParent(householdId, parsed.data.parentId);
  if ("error" in parent) return { error: parent.error };

  // Conta dentro da fatura herda o vencimento do pai na leitura — não tem dia próprio.
  let due: { dueDay: number | null; dueDate: Date | null };
  if (parent.parentId) {
    due = { dueDay: null, dueDate: null };
  } else {
    const resolved = resolveDue(parsed.data);
    if ("error" in resolved) return { error: resolved.error };
    due = resolved;
  }

  const hasAmount = parsed.data.amount && parsed.data.amount.trim() !== "";
  const ownerId =
    parsed.data.ownerId && parsed.data.ownerId !== "casal" ? parsed.data.ownerId : null;

  await prisma.bill.create({
    data: {
      householdId,
      name: parsed.data.name,
      amountCents: hasAmount ? parseToCents(parsed.data.amount!) : null,
      recurrence: parent.parentId ? "monthly" : parsed.data.recurrence,
      dueDay: due.dueDay,
      dueDate: due.dueDate,
      ownerId,
      parentId: parent.parentId,
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
    ...readBillForm(formData),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const bill = await prisma.bill.findFirst({ where: { id: parsed.data.billId, householdId } });
  if (!bill) return { error: "Conta inválida" };

  const parent = await resolveParent(householdId, parsed.data.parentId, bill.id);
  if ("error" in parent) return { error: parent.error };

  const childCount = await prisma.bill.count({ where: { parentId: bill.id } });
  if (childCount > 0 && parsed.data.recurrence === "one_time") {
    return { error: "Contas com itens dentro precisam ser fixas mensais" };
  }

  let due: { dueDay: number | null; dueDate: Date | null };
  if (parent.parentId) {
    due = { dueDay: null, dueDate: null }; // herda o vencimento da fatura
  } else {
    const resolved = resolveDue(parsed.data);
    if ("error" in resolved) return { error: resolved.error };
    due = resolved;
  }

  const hasAmount = parsed.data.amount && parsed.data.amount.trim() !== "";
  const ownerId =
    parsed.data.ownerId && parsed.data.ownerId !== "casal" ? parsed.data.ownerId : null;

  await prisma.bill.update({
    where: { id: bill.id },
    data: {
      name: parsed.data.name,
      amountCents: hasAmount ? parseToCents(parsed.data.amount!) : null,
      recurrence: parent.parentId ? "monthly" : parsed.data.recurrence,
      dueDay: due.dueDay,
      dueDate: due.dueDate,
      ownerId,
      parentId: parent.parentId,
      notes: parsed.data.notes || null,
    },
  });
  revalidate();
  return { ok: true };
}

/**
 * Remove uma conta a pagar (e, em cascata, seus pagamentos). Se ela tinha contas dentro da
 * fatura, elas são PROMOVIDAS a contas soltas herdando o dia de vencimento — apagar o cartão
 * não pode destruir o Seguro e a Arquiteta junto com o histórico delas.
 */
export async function deleteBillAction(_prev: BillState, formData: FormData): Promise<BillState> {
  const householdId = await requireHousehold();
  const billId = String(formData.get("billId") ?? "");
  const bill = await prisma.bill.findFirst({ where: { id: billId, householdId } });
  if (!bill) return { error: "Conta inválida" };

  await prisma.$transaction(async (tx) => {
    await tx.bill.updateMany({
      where: { parentId: bill.id },
      data: { parentId: null, recurrence: "monthly", dueDay: bill.dueDay ?? 1 },
    });
    await tx.bill.delete({ where: { id: bill.id } });
  });
  revalidate();
  return { ok: true };
}

const paidSchema = z.object({
  billId: z.string().min(1),
  periodKey: z.string().regex(/^\d{4}-\d{2}$/, "Período inválido"),
  amount: z.string().optional(),
});

/**
 * Marca uma conta como paga no período informado (idempotente por billId+período).
 * Pagar uma fatura paga em cascata as contas de dentro dela — é o "atrelado": você paga a
 * fatura, não cada item. O pagamento do pai guarda o total da fatura; cada filho, o valor dele.
 */
export async function markBillPaidAction(_prev: BillState, formData: FormData): Promise<BillState> {
  const householdId = await requireHousehold();
  const parsed = paidSchema.safeParse({
    billId: formData.get("billId"),
    periodKey: formData.get("periodKey"),
    amount: formData.get("amount") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const { periodKey } = parsed.data;

  const bill = await prisma.bill.findFirst({ where: { id: parsed.data.billId, householdId } });
  if (!bill) return { error: "Conta inválida" };
  if (bill.parentId) return { error: "Esta conta é paga junto com a fatura" };

  const children = await prisma.bill.findMany({
    where: { parentId: bill.id, active: true },
    include: { periodAmounts: { where: { periodKey } } },
  });

  const hasAmount = parsed.data.amount && parsed.data.amount.trim() !== "";
  const declared = await prisma.billPeriodAmount.findUnique({
    where: { billId_periodKey: { billId: bill.id, periodKey } },
  });
  const amountCents = hasAmount
    ? parseToCents(parsed.data.amount!)
    : (declared?.amountCents ?? bill.amountCents);

  await prisma.$transaction([
    prisma.billPayment.upsert({
      where: { billId_periodKey: { billId: bill.id, periodKey } },
      create: { billId: bill.id, householdId, periodKey, amountCents },
      update: { amountCents, paidAt: new Date() },
    }),
    ...children.map((c) =>
      prisma.billPayment.upsert({
        where: { billId_periodKey: { billId: c.id, periodKey } },
        create: {
          billId: c.id,
          householdId,
          periodKey,
          amountCents: c.periodAmounts[0]?.amountCents ?? c.amountCents,
        },
        update: { paidAt: new Date() },
      }),
    ),
  ]);
  revalidate();
  return { ok: true };
}

/** Desfaz o pagamento de uma conta no período (e das contas dentro da fatura dela). */
export async function unmarkBillPaidAction(_prev: BillState, formData: FormData): Promise<BillState> {
  const householdId = await requireHousehold();
  const parsed = paidSchema.safeParse({
    billId: formData.get("billId"),
    periodKey: formData.get("periodKey"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const bill = await prisma.bill.findFirst({ where: { id: parsed.data.billId, householdId } });
  if (!bill) return { error: "Conta inválida" };

  const children = await prisma.bill.findMany({
    where: { parentId: bill.id },
    select: { id: true },
  });

  await prisma.billPayment.deleteMany({
    where: { billId: { in: [bill.id, ...children.map((c) => c.id)] }, periodKey: parsed.data.periodKey },
  });
  revalidate();
  return { ok: true };
}

const periodAmountSchema = z.object({
  billId: z.string().min(1),
  periodKey: z.string().regex(/^\d{4}-\d{2}$/, "Período inválido"),
  amount: z.string().optional(),
});

/**
 * Informa (ou limpa) o valor desta conta NESTE mês — ex.: o total da fatura do cartão, ou a
 * energia que veio mais cara. Valor vazio apaga a linha e volta a valer o valor cadastrado.
 */
export async function setBillPeriodAmountAction(
  _prev: BillState,
  formData: FormData,
): Promise<BillState> {
  const householdId = await requireHousehold();
  const parsed = periodAmountSchema.safeParse({
    billId: formData.get("billId"),
    periodKey: formData.get("periodKey"),
    amount: formData.get("amount") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const { periodKey } = parsed.data;

  const bill = await prisma.bill.findFirst({ where: { id: parsed.data.billId, householdId } });
  if (!bill) return { error: "Conta inválida" };

  const hasAmount = parsed.data.amount && parsed.data.amount.trim() !== "";
  if (!hasAmount) {
    await prisma.billPeriodAmount.deleteMany({ where: { billId: bill.id, periodKey } });
    revalidate();
    return { ok: true };
  }

  const amountCents = parseToCents(parsed.data.amount!);
  if (!Number.isFinite(amountCents) || amountCents < 0) return { error: "Valor inválido" };

  await prisma.$transaction(async (tx) => {
    await tx.billPeriodAmount.upsert({
      where: { billId_periodKey: { billId: bill.id, periodKey } },
      create: { billId: bill.id, householdId, periodKey, amountCents },
      update: { amountCents },
    });
    // Corrigir o total depois de pagar não pode deixar o histórico errado.
    await tx.billPayment.updateMany({ where: { billId: bill.id, periodKey }, data: { amountCents } });
  });
  revalidate();
  return { ok: true };
}
