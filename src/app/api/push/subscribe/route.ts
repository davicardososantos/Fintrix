import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Registra (ou atualiza) a inscrição de push do dispositivo atual para o usuário logado. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.householdId || !session.user.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const endpoint: string | undefined = body?.endpoint;
  const p256dh: string | undefined = body?.keys?.p256dh;
  const authKey: string | undefined = body?.keys?.auth;
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      householdId: session.user.householdId,
      userId: session.user.id,
      endpoint,
      p256dh,
      auth: authKey,
    },
    update: {
      householdId: session.user.householdId,
      userId: session.user.id,
      p256dh,
      auth: authKey,
    },
  });

  return NextResponse.json({ ok: true });
}
