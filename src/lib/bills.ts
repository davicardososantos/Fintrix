import { prisma } from "@/lib/db";
import type { Bill, BillRecurrence } from "@prisma/client";

/**
 * Contas a pagar (lembretes de vencimento). Regras do projeto: dinheiro em centavos,
 * isolamento por householdId, datas comparadas ao meio-dia UTC (evita off-by-one de fuso).
 *
 * Grupos ("dentro da fatura"): uma conta com `parentId` é cobrada na fatura de outra
 * (ex.: Seguro e Arquiteta dentro do Cartão). O filho herda o vencimento do pai e é pago
 * junto com ele. O pai exibe o RESTANTE (total informado − soma dos filhos), de forma que
 * somar as linhas exibidas dê exatamente o total da fatura — nunca conta em dobro.
 */

export type BillStatus = "paid" | "overdue" | "due_soon" | "upcoming";

export type BillView = {
  id: string;
  name: string;
  /**
   * Valor a EXIBIR e SOMAR nesta linha, neste período. No card de grupo o pai traz o
   * RESTANTE da fatura; em getUnpaidBills traz o total cheio (é o que se paga).
   */
  amountCents: number | null;
  /** Bill.amountCents cru — usar no formulário de edição, nunca para somar. */
  baseAmountCents: number | null;
  /** Valor informado só para este mês (BillPeriodAmount), se houver. */
  periodAmountCents: number | null;
  recurrence: BillRecurrence;
  dueDay: number | null;
  dueDateISO: string; // vencimento efetivo no período considerado
  periodKey: string; // período (YYYY-MM) a que este view se refere
  paid: boolean;
  status: BillStatus;
  ownerId: string | null;
  ownerName: string | null;
  notes: string | null;
  parentId: string | null;
};

/** Uma fatura e as contas fixas cobradas dentro dela. */
export type BillGroup = {
  parent: BillView; // parent.amountCents === remainderCents
  children: BillView[];
  declaredTotalCents: number | null; // total informado no mês (ou o valor cadastrado)
  childrenSumCents: number;
  remainderCents: number | null; // null enquanto o total não foi informado
  childrenWithoutAmount: number;
};

export type BillRow = { kind: "bill"; bill: BillView } | { kind: "group"; group: BillGroup };

export type BillTotals = {
  totalCents: number;
  paidCents: number;
  remainingCents: number;
  openCount: number; // um grupo conta 1 (você paga a fatura, não cada item)
  missingTotals: number; // linhas sem valor informado no mês → dispara o aviso na tela
};

export type MonthBills = { periodKey: string; rows: BillRow[]; totals: BillTotals };

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

type BillWithOwner = Bill & {
  owner: { name: string } | null;
  periodAmounts?: { periodKey: string; amountCents: number }[];
};

function makeView(
  b: BillWithOwner,
  due: Date,
  periodKey: string,
  paid: boolean,
  amountCents: number | null,
): BillView {
  return {
    id: b.id,
    name: b.name,
    amountCents,
    baseAmountCents: b.amountCents,
    periodAmountCents:
      b.periodAmounts?.find((p) => p.periodKey === periodKey)?.amountCents ?? null,
    recurrence: b.recurrence,
    dueDay: b.dueDay,
    dueDateISO: due.toISOString(),
    periodKey,
    paid,
    status: statusFor(due, paid),
    ownerId: b.ownerId,
    ownerName: b.owner?.name.split(" ")[0] ?? null,
    notes: b.notes,
    parentId: b.parentId,
  };
}

type Loaded = BillWithOwner & {
  payments: { id: string }[];
  periodAmounts: { periodKey: string; amountCents: number }[];
};

/** Valor da conta no período: o informado para o mês, senão o cadastrado. */
function effectiveAmount(b: Loaded): number | null {
  return b.periodAmounts[0]?.amountCents ?? b.amountCents;
}

function rowDueISO(r: BillRow): string {
  return r.kind === "bill" ? r.bill.dueDateISO : r.group.parent.dueDateISO;
}

/**
 * Totais do mês. Um grupo contribui com o total da fatura (os filhos já estão dentro dele),
 * então somar as linhas nunca conta em dobro.
 */
function summarize(rows: BillRow[]): BillTotals {
  let totalCents = 0;
  let paidCents = 0;
  let openCount = 0;
  let missingTotals = 0;

  for (const r of rows) {
    const known =
      r.kind === "bill"
        ? (r.bill.amountCents ?? 0)
        : (r.group.declaredTotalCents ?? r.group.childrenSumCents);
    const paid = r.kind === "bill" ? r.bill.paid : r.group.parent.paid;
    const hasValue =
      r.kind === "bill" ? r.bill.amountCents != null : r.group.declaredTotalCents != null;

    totalCents += known;
    if (paid) paidCents += known;
    else openCount++;
    if (!hasValue) missingTotals++;
  }

  return { totalCents, paidCents, remainingCents: totalCents - paidCents, openCount, missingTotals };
}

/**
 * Contas que "vencem" no mês `periodKey`: mensais (sempre) e avulsas cujo vencimento cai nesse mês.
 * Contas dentro de uma fatura vêm agrupadas sob ela. Já traz status, se foi paga e os totais.
 */
export async function getMonthBills(householdId: string, periodKey: string): Promise<MonthBills> {
  const bills = (await prisma.bill.findMany({
    where: { householdId, active: true },
    include: {
      owner: { select: { name: true } },
      payments: { where: { periodKey }, select: { id: true } },
      periodAmounts: { where: { periodKey }, select: { periodKey: true, amountCents: true } },
    },
  })) as Loaded[];

  const byId = new Map(bills.map((b) => [b.id, b]));

  /** Vencimento desta conta no período, ou null se ela não ocorre nele. */
  function dueIn(b: Loaded): Date | null {
    if (periodKeyOf(b.createdAt) > periodKey) return null; // a conta ainda não existia neste mês
    if (b.recurrence === "monthly") {
      const parent = b.parentId ? byId.get(b.parentId) : null; // filho herda o dia da fatura
      return monthlyDueDate(periodKey, (parent ? parent.dueDay : b.dueDay) ?? 1);
    }
    if (!b.dueDate || periodKeyOf(b.dueDate) !== periodKey) return null; // avulsa só no mês dela
    return b.dueDate;
  }

  const childrenOf = new Map<string, Loaded[]>();
  for (const b of bills) {
    // Pai fora do conjunto ativo → o filho volta a aparecer como conta solta (nunca desaparece).
    if (!b.parentId || !byId.has(b.parentId)) continue;
    const list = childrenOf.get(b.parentId) ?? [];
    list.push(b);
    childrenOf.set(b.parentId, list);
  }

  const rows: BillRow[] = [];
  for (const b of bills) {
    const parent = b.parentId ? byId.get(b.parentId) : null;
    if (parent && dueIn(parent)) continue; // será renderizada dentro do grupo do pai

    const due = dueIn(b);
    if (!due) continue;

    const kids = (childrenOf.get(b.id) ?? [])
      .map((c) => ({ c, due: dueIn(c) }))
      .filter((x): x is { c: Loaded; due: Date } => x.due !== null)
      .sort((x, y) => x.c.name.localeCompare(y.c.name, "pt-BR"));

    if (kids.length === 0) {
      rows.push({
        kind: "bill",
        bill: makeView(b, due, periodKey, b.payments.length > 0, effectiveAmount(b)),
      });
      continue;
    }

    const paid = b.payments.length > 0; // o pai é a verdade: pagou a fatura, pagou os filhos
    const declaredTotalCents = effectiveAmount(b);
    const childrenSumCents = kids.reduce((s, { c }) => s + (effectiveAmount(c) ?? 0), 0);
    const remainderCents = declaredTotalCents == null ? null : declaredTotalCents - childrenSumCents;

    rows.push({
      kind: "group",
      group: {
        parent: makeView(b, due, periodKey, paid, remainderCents),
        children: kids.map(({ c, due: cd }) =>
          makeView(c, cd, periodKey, paid, effectiveAmount(c)),
        ),
        declaredTotalCents,
        childrenSumCents,
        remainderCents,
        childrenWithoutAmount: kids.filter(({ c }) => effectiveAmount(c) == null).length,
      },
    });
  }

  rows.sort((a, b) => rowDueISO(a).localeCompare(rowDueISO(b)));
  return { periodKey, rows, totals: summarize(rows) };
}

/** Contas que podem receber outras "dentro da fatura" (fixas mensais que não são filhas). */
export async function getBillParentOptions(
  householdId: string,
): Promise<{ id: string; name: string }[]> {
  return prisma.bill.findMany({
    where: { householdId, active: true, recurrence: "monthly", parentId: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/**
 * Contas em aberto (não pagas) acionáveis agora — para a tela inicial e o push:
 * mensais do mês atual ainda não pagas + avulsas não pagas que vencem até o fim do mês atual
 * (inclui atrasadas de meses anteriores). Ordenadas por vencimento.
 *
 * Um grupo aparece como UM item, com o total cheio da fatura: três linhas para um único
 * pagamento (com valores que somam além da fatura) seria pior que inútil num lembrete.
 */
export async function getUnpaidBills(householdId: string): Promise<BillView[]> {
  const period = currentPeriodKey();
  const [y, m] = period.split("-").map(Number);
  const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59));

  const bills = await prisma.bill.findMany({
    where: { householdId, active: true, parentId: null },
    include: {
      owner: { select: { name: true } },
      payments: true,
      periodAmounts: { select: { periodKey: true, amountCents: true } },
    },
  });

  const views: BillView[] = [];
  for (const b of bills) {
    const amountFor = (pk: string) =>
      b.periodAmounts.find((p) => p.periodKey === pk)?.amountCents ?? b.amountCents;

    if (b.recurrence === "monthly") {
      if (b.payments.some((p) => p.periodKey === period)) continue;
      views.push(
        makeView(b, monthlyDueDate(period, b.dueDay ?? 1), period, false, amountFor(period)),
      );
    } else {
      if (!b.dueDate) continue;
      const bp = periodKeyOf(b.dueDate);
      if (b.payments.some((p) => p.periodKey === bp)) continue;
      if (b.dueDate.getTime() > endOfMonth.getTime()) continue; // ainda não é o mês dela
      views.push(makeView(b, b.dueDate, bp, false, amountFor(bp)));
    }
  }
  views.sort((a, b) => a.dueDateISO.localeCompare(b.dueDateISO));
  return views;
}
