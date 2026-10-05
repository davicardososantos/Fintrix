"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Registra o service worker e oferece o prompt de instalação do PWA (Android/desktop).
 * No iOS não há beforeinstallprompt — a instalação é via "Adicionar à Tela de Início" do Safari.
 */
export function PwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Bundles de desenvolvimento têm URLs estáveis; cacheá-los quebra o hot reload.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div className="safe-bottom fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-auth items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-floating lg:bottom-6 lg:left-auto lg:right-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" width={36} height={36} className="h-9 w-9 rounded-md" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Instalar o Fintrix</p>
        <p className="text-xs text-muted-foreground">Acesse como um app na tela inicial.</p>
      </div>
      <button
        onClick={async () => {
          await deferred.prompt();
          await deferred.userChoice;
          setDeferred(null);
        }}
        className="flex h-11 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        <Download className="h-4 w-4" /> Instalar
      </button>
      <button
        aria-label="Dispensar"
        onClick={() => setDismissed(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
