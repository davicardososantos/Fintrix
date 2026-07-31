"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseDateISO } from "@/lib/import/util";
import { POINTS_NAME_MAX, POINTS_OTHER } from "@/lib/points";

async function requireHousehold() {
  const session = await auth();
  if (!session?.user?.householdId) throw new Error("Sessão inválida");
  return session.user.householdId;
}

const programSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do programa")
    .max(POINTS_NAME_MAX, "Nome muito longo"),
  ownerId: z.string().optional(),
});

export type PointsState = { error?: string; ok?: boolean } | undefined;

/** Cria um programa de pontos (opcionalmente de uma pessoa). */
export async function addPointsProgramAction(
  _prev: PointsState,
  formData: FormData,
): Promise<PointsState> {
  const householdId = await requireHousehold();
  // O form manda um preset do dropdown ou "Outro..." + o nome digitado.
  const preset = String(formData.get("preset") ?? "");
  const name = preset === POINTS_OTHER ? String(formData.get("customName") ?? "") : preset;

  const parsed = programSchema.safeParse({
    name,
    ownerId: formData.get("ownerId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const ownerId = parsed.data.ownerId && parsed.data.ownerId !== "casal" ? parsed.data.ownerId : null;
  if (ownerId) {
    const ok = await prisma.user.findFirst({ where: { id: ownerId, householdId } });
    if (!ok) return { error: "Pessoa inválida" };
  }

  const dup = await prisma.pointsProgram.findFirst({
    where: { householdId, name: parsed.data.name, ownerId },
  });
  if (dup) return { error: "Esse programa já existe" };

  await prisma.pointsProgram.create({
    data: { householdId, name: parsed.data.name, ownerId },
  });
  revalidatePath("/pontos");
  return { ok: true };
}

/** Remove um programa e todos os seus saldos (snapshots caem por cascade). */
export async function deletePointsProgramAction(
  _prev: PointsState,
  formData: FormData,
): Promise<PointsState> {
  const householdId = await requireHousehold();
  const id = String(formData.get("programId") ?? "");

  const program = await prisma.pointsProgram.findFirst({ where: { id, householdId } });
  if (!program) return { error: "Programa inválido" };

  await prisma.pointsProgram.delete({ where: { id: program.id } });
  revalidatePath("/pontos");
  return { ok: true };
}

const snapshotSchema = z.object({
  programId: z.string(),
  balance: z.coerce.number().int().min(0, "Saldo inválido"),
  date: z.string(),
  note: z.string().optional(),
});

/** Registra o saldo atual de um programa (cria um snapshot). */
export async function addPointsSnapshotAction(
  _prev: PointsState,
  formData: FormData,
): Promise<PointsState> {
  const householdId = await requireHousehold();
  const parsed = snapshotSchema.safeParse({
    programId: formData.get("programId"),
    balance: formData.get("balance"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const program = await prisma.pointsProgram.findFirst({
    where: { id: parsed.data.programId, householdId },
  });
  if (!program) return { error: "Programa inválido" };

  const date = parseDateISO(parsed.data.date) ?? new Date();
  await prisma.pointsSnapshot.create({
    data: { programId: program.id, balance: parsed.data.balance, date, note: parsed.data.note },
  });
  revalidatePath("/pontos");
  return { ok: true };
}
