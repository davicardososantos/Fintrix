import webpush from "web-push";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import type { BillView } from "@/lib/bills";

/**
 * Envio de notificações push (Web Push / VAPID). As chaves ficam em env:
 * VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT. A pública também vai ao client via
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY (ver enable-push-button).
 */

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:davicardoso.dc@gmail.com";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export function pushConfigured(): boolean {
  return Boolean(publicKey && privateKey);
}

export type PushPayload = { title: string; body: string; url?: string };

/** Envia para uma inscrição; remove do banco se expirada (404/410). Retorna true se entregue. */
export async function sendToSubscription(
  sub: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
): Promise<boolean> {
  if (!ensureConfigured()) return false;
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    );
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    }
    return false;
  }
}

const dm = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

/** Monta a notificação de lembrete a partir das contas em aberto perto do vencimento. */
export function buildBillsPayload(bills: BillView[]): PushPayload {
  const url = "/contas-a-pagar";
  if (bills.length === 1) {
    const b = bills[0];
    const valor = b.amountCents != null ? ` — ${formatCents(b.amountCents)}` : "";
    const quando = b.status === "overdue" ? "venceu" : "vence";
    return {
      title: b.status === "overdue" ? "Conta vencida" : "Conta a vencer",
      body: `${b.name}${valor} ${quando} ${dm.format(new Date(b.dueDateISO))}`,
      url,
    };
  }
  const overdue = bills.filter((b) => b.status === "overdue").length;
  const nomes = bills.slice(0, 3).map((b) => b.name).join(", ");
  const resto = bills.length > 3 ? ` e mais ${bills.length - 3}` : "";
  return {
    title: `${bills.length} contas a pagar`,
    body: `${overdue > 0 ? `${overdue} vencida(s). ` : ""}${nomes}${resto}`,
    url,
  };
}
