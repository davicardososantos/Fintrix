import { prisma } from "@/lib/db";
import type { Bill, BillRecurrence } from "@prisma/client";

/**
 * Contas a pagar (lembretes de vencimento). Regras do projeto: dinheiro em centavos,
 * isolamento por householdId, datas comparadas ao meio-dia UTC (evita off-by-one de fuso).
 */

export type BillStatus = "paid" | "overdue" | "due_soon" | "upcoming";

export type BillView = {
  id: string;
  name: string;
  amountCents: number | null;
  recurrence: BillRecurrence;
  dueDay: number | null;
  dueDateISO: string; // vencimento efetivo no período considerado
  periodKey: string; // período (YYYY-MM) a que este view se refere
  paid: boolean;
  status: BillStatus;
  ownerId: string | null;
  ownerName: string | null;
  notes: string | null;
};

const DUE_SOON_DAYS = 3;

/** "YYYY-MM" do mês (UTC) de uma data. */
function periodKeyOf(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** "YYYY-MM" do mês atual (UTC). */
export function currentPeriodKey(): string {
  return periodKeyOf(new Date());
}

/** Hoje ao meio-dia UTC (padrão do projeto). */
function todayUTC(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 12));
}

/** Vencimento efetivo de uma conta mensal num período "YYYY-MM" (dueDay limitado aos dias do mês). */
function monthlyDueDate(periodKey: string, dueDay: number): Date {
  const [y, m] = periodKey.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const day = Math.min(Math.max(dueDay, 1), daysInMonth);
  return new Date(Date.UTC(y, m - 1, day, 12));
}

/** Diferença em dias inteiros entre o vencimento e hoje (UTC-noon). Negativo = atrasada. */
function daysUntil(due: Date): number {
  return Math.round((due.getTime() - todayUTC().getTime()) / 86_400_000);
}

function statusFor(due: Date, paid: boolean): BillStatus {
  if (paid) return "paid";
  const d = daysUntil(due);
  if (d < 0) return "overdue";
  if (d <= DUE_SOON_DAYS) return "due_soon";
  return "upcoming";
}

type BillWithOwner = Bill & { owner: { name: string } | null };

function makeView(b: BillWithOwner, due: Date, periodKey: string, paid: boolean): BillView {
  return {
    id: b.id,
    name: b.name,
    amountCents: b.amountCents,
    recurrence: b.recurrence,
    dueDay: b.dueDay,
    dueDateISO: due.toISOString(),
    periodKey,
    paid,
    status: statusFor(due, paid),
    ownerId: b.ownerId,
    ownerName: b.owner?.name.split(" ")[0] ?? null,
    notes: b.notes,
  };
}

/**
 * Contas que "vencem" no mês `periodKey`: mensais (sempre) e avulsas cujo vencimento cai nesse mês.
 * Cada uma já vem com status e se foi paga no período.
 */
export async function getMonthBills(householdId: string, periodKey: string): Promise<BillView[]> {
  const bills = await prisma.bill.findMany({
    where: { householdId, active: true },
    include: {
      owner: { select: { name: true } },
      payments: { where: { periodKey } },
    },
  });

  const views: BillView[] = [];
  for (const b of bills) {
    let due: Date;
    if (b.recurrence === "monthly") {
      due = monthlyDueDate(periodKey, b.dueDay ?? 1);
    } else {
      if (!b.dueDate || periodKeyOf(b.dueDate) !== periodKey) continue; // avulsa só no mês dela
      due = b.dueDate;
    }
    views.push(makeView(b, due, periodKey, b.payments.length > 0));
  }
  views.sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO));
  return views;
}

/**
 * Contas em aberto (não pagas) acionáveis agora — para a tela inicial e o push:
 * mensais do mês atual ainda não pagas + avulsas não pagas que vencem até o fim do mês atual
 * (inclui atrasadas de meses anteriores). Ordenadas por vencimento.
 */
export async function getUnpaidBills(householdId: string): Promise<BillView[]> {
  const period = currentPeriodKey();
  const [y, m] = period.split("-").map(Number);
  const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59));

  const bills = await prisma.bill.findMany({
    where: { householdId, active: true },
    include: {
      owner: { select: { name: true } },
      payments: true,
    },
  });

  const views: BillView[] = [];
  for (const b of bills) {
    if (b.recurrence === "monthly") {
      if (b.payments.some((p) => p.periodKey === period)) continue;
      views.push(makeView(b, monthlyDueDate(period, b.dueDay ?? 1), period, false));
    } else {
      if (!b.dueDate) continue;
      const bp = periodKeyOf(b.dueDate);
      if (b.payments.some((p) => p.periodKey === bp)) continue;
      if (b.dueDate.getTime() > endOfMonth.getTime()) continue; // ainda não é o mês dela
      views.push(makeView(b, b.dueDate, bp, false));
    }
  }
  views.sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO));
  return views;
}
