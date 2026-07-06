"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, BellRing } from "lucide-react";

/** Converte a chave pública VAPID (base64url) em Uint8Array para o pushManager. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type Status = "idle" | "unsupported" | "subscribed" | "denied" | "working" | "error";

export function EnablePushButton() {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "subscribed" : "idle"))
      .catch(() => {});
  }, []);

  async function enable() {
    try {
      setStatus("working");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const { key } = await fetch("/api/push/public-key").then((r) => r.json());
      if (!key) {
        setStatus("error");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setStatus(res.ok ? "subscribed" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "unsupported") {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <BellOff className="h-4 w-4" /> Lembretes push não disponíveis neste dispositivo. No iPhone,
        instale o app na tela de início primeiro.
      </p>
    );
  }

  if (status === "subscribed") {
    return (
      <p className="flex items-center gap-2 text-sm text-positive">
        <BellRing className="h-4 w-4" /> Lembretes ativados neste dispositivo.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant="secondary" onClick={enable} disabled={status === "working"}>
        <Bell className="h-4 w-4" />
        {status === "working" ? "Ativando..." : "Ativar lembretes no celular"}
      </Button>
      {status === "denied" && (
        <p className="text-xs text-muted-foreground">
          Notificações bloqueadas. Libere nas configurações do navegador para receber os lembretes.
        </p>
      )}
      {status === "error" && (
        <p className="text-xs text-destructive">Não deu para ativar agora. Tente novamente.</p>
      )}
    </div>
  );
}
