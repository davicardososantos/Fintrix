import { NextResponse } from "next/server";

/** Expõe a chave pública VAPID em runtime (evita inlining de NEXT_PUBLIC no build Docker). */
export async function GET() {
  return NextResponse.json({ key: process.env.VAPID_PUBLIC_KEY ?? "" });
}
