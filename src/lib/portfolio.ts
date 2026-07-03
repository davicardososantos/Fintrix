import { prisma } from "@/lib/db";
import type { PointsProgramName } from "@prisma/client";

export const POINTS_LABEL: Record<PointsProgramName, string> = {
  smiles: "Smiles",
  livelo: "Livelo",
  azul: "TudoAzul",
  latam: "LATAM Pass",
};

export const POINTS_COLOR: Record<PointsProgramName, string> = {
  smiles: "warning",
  livelo: "points",
  azul: "investment",
  latam: "accent",
};

export type PointsProgramView = {
  id: string;
  name: PointsProgramName;
  label: string;
  color: string;
  ownerName: string | null;
  balance: number;
  variation: number; // vs. snapshot anterior
  lastDate: string | null;
  history: { id: string; balance: number; date: string; note: string | null }[];
};

/** Programas de pontos com saldo atual (último snapshot), variação e histórico. */
export async function getPointsPrograms(householdId: string): Promise<PointsProgramView[]> {
  const programs = await prisma.pointsProgram.findMany({
    where: { householdId },
    include: {
      owner: { select: { name: true } },
      snapshots: { orderBy: { date: "desc" } },
    },
  });

  return programs.map((p) => {
    const [latest, prev] = p.snapshots;
    return {
      id: p.id,
      name: p.name,
      label: POINTS_LABEL[p.name],
      color: POINTS_COLOR[p.name],
      ownerName: p.owner?.name.split(" ")[0] ?? null,
      balance: latest?.balance ?? 0,
      variation: latest && prev ? latest.balance - prev.balance : 0,
      lastDate: latest ? latest.date.toISOString() : null,
      history: p.snapshots.map((s) => ({
        id: s.id,
        balance: s.balance,
        date: s.date.toISOString(),
        note: s.note,
      })),
    };
  });
}

export type InvestmentView = {
  id: string;
  name: string;
  type: string;
  institution: string | null;
  ownerName: string | null;
  principalCents: number;
  currentCents: number;
  yieldCents: number;
  yieldPct: number;
  appliedAt: string;
  maturityAt: string | null;
  history: { id: string; valueCents: number; date: string }[];
};

/** Investimentos com valor atual (último snapshot ou principal), rendimento e histórico + total. */
export async function getInvestments(
  householdId: string,
): Promise<{ investments: InvestmentView[]; totalInvestedCents: number }> {
  const rows = await prisma.investment.findMany({
    where: { householdId },
    include: {
      owner: { select: { name: true } },
      snapshots: { orderBy: { date: "desc" } },
    },
    orderBy: { appliedAt: "desc" },
  });

  const investments = rows.map((inv) => {
    const current = inv.snapshots[0]?.valueCents ?? inv.principalCents;
    const yieldCents = current - inv.principalCents;
    return {
      id: inv.id,
      name: inv.name,
      type: inv.type,
      institution: inv.institution,
      ownerName: inv.owner?.name.split(" ")[0] ?? null,
      principalCents: inv.principalCents,
      currentCents: current,
      yieldCents,
      yieldPct: inv.principalCents > 0 ? (yieldCents / inv.principalCents) * 100 : 0,
      appliedAt: inv.appliedAt.toISOString(),
      maturityAt: inv.maturityAt ? inv.maturityAt.toISOString() : null,
      history: inv.snapshots.map((s) => ({
        id: s.id,
        valueCents: s.valueCents,
        date: s.date.toISOString(),
      })),
    };
  });

  const totalInvestedCents = investments.reduce((s, i) => s + i.currentCents, 0);
  return { investments, totalInvestedCents };
}
