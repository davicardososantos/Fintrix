"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recategorizeAction } from "@/lib/actions/transaction-actions";

/** Botão que roda o pipeline de categorização/atribuição sob demanda. */
export function RecategorizeButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string>("");

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await recategorizeAction();
            setMsg(`${r.coveragePct}% categorizado`);
          })
        }
      >
        <Sparkles className="h-4 w-4" />
        {pending ? "Processando..." : "Categorizar"}
      </Button>
      {msg && <span className="text-[10px] text-muted-foreground">{msg}</span>}
    </div>
  );
}
