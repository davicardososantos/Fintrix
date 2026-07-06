import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUnpaidBills } from "@/lib/bills";
import { pushConfigured, sendToSubscription, buildBillsPayload } from "@/lib/push";

/**
 * Job diário: notifica cada household sobre contas em aberto vencidas ou que vencem em breve
 * (status overdue/due_soon). Protegido por CRON_SECRET (Authorization: Bearer ...).
 * Disparado pelo crontab do host: ver docs/deploy.
 */
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "cron não configurado" }, { status: 503 });

  const header = req.headers.get("authorization") ?? "";
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ error: "push não configurado" }, { status: 503 });
  }

  const households = await prisma.household.findMany({ select: { id: true } });
  let notified = 0;
  let households_hit = 0;

  for (const h of households) {
    const bills = (await getUnpaidBills(h.id)).filter(
      (b) => b.status === "overdue" || b.status === "due_soon",
    );
    if (bills.length === 0) continue;

    const subs = await prisma.pushSubscription.findMany({ where: { householdId: h.id } });
    if (subs.length === 0) continue;

    const payload = buildBillsPayload(bills);
    for (const s of subs) {
      if (await sendToSubscription(s, payload)) notified++;
    }
    households_hit++;
  }

  return NextResponse.json({ ok: true, households: households_hit, notified });
}

export async function POST(req: Request) {
  return run(req);
}

export async function GET(req: Request) {
  return run(req);
}
