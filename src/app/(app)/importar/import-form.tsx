"use client";

import { useActionState, useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { importFileAction, type ImportState } from "@/lib/actions/import-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importFileAction,
    {},
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-4">
        <label
          htmlFor="file"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-muted/40 px-6 py-10 text-center transition-colors active:bg-muted"
        >
          <UploadCloud className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium">Toque para escolher um arquivo</span>
          <span className="text-xs text-muted-foreground">
            Extrato/Fatura C6 e Nubank (.csv) · Extrato Alelo (.pdf)
          </span>
          <input
            ref={inputRef}
            id="file"
            name="file"
            type="file"
            accept=".csv,.pdf"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          />
        </label>

        {fileName && (
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{fileName}</span>
          </div>
        )}

        <Button type="submit" disabled={pending || !fileName} className="w-full">
          {pending ? "Importando..." : "Importar"}
        </Button>
      </form>

      {state?.error && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{state.error}</p>
          </CardContent>
        </Card>
      )}

      {state?.ok && state.summary && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-positive" />
              <span className="font-semibold">
                {state.summary.source} · {state.summary.account}
              </span>
            </div>
            {state.summary.alreadyImported && (
              <p className="rounded-md bg-warning/15 px-3 py-2 text-xs text-warning">
                Este arquivo já havia sido importado — nada foi duplicado.
              </p>
            )}
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Stat label="Importadas" value={state.summary.imported} tone="positive" />
              <Stat label="Ignoradas (duplicadas)" value={state.summary.skipped} />
              <Stat label="Linhas lidas" value={state.summary.total} />
              <Stat label="Com erro" value={state.summary.errors} tone={state.summary.errors ? "negative" : undefined} />
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "positive" | "negative";
}) {
  const color =
    tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-foreground";
  return (
    <div className="rounded-md bg-muted p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-xl font-bold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}
