"use client";

import { useActionState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tokenBg } from "@/components/category-badge";
import { addPointsSnapshotAction, type PointsState } from "@/lib/actions/points-actions";
import type { PointsProgramView } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("pt-BR");
const df = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
const today = new Date().toISOString().slice(0, 10);

export function ProgramCard({ program }: { program: PointsProgramView }) {
  const [state, action, pending] = useActionState<PointsState, FormData>(
    addPointsSnapshotAction,
    undefined,
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", tokenBg(program.color))} />
            <span className="font-semibold">{program.label}</span>
            {program.ownerName && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {program.ownerName}
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums">{nf.format(program.balance)}</p>
            {program.variation !== 0 && (
              <p className={cn("text-xs tabular-nums", program.variation > 0 ? "text-positive" : "text-negative")}>
                {program.variation > 0 ? "+" : ""}
                {nf.format(program.variation)}
              </p>
            )}
          </div>
        </div>
        {program.lastDate && (
          <p className="mt-1 text-xs text-muted-foreground">
            Atualizado em {df.format(new Date(program.lastDate))}
          </p>
        )}

        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-primary">
            Atualizar saldo
          </summary>
          <form ref={ref} action={action} className="mt-2 flex flex-col gap-2">
            <input type="hidden" name="programId" value={program.id} />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`bal-${program.id}`}>Saldo</Label>
                <Input id={`bal-${program.id}`} name="balance" type="number" inputMode="numeric" required />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`date-${program.id}`}>Data</Label>
                <Input id={`date-${program.id}`} name="date" type="date" defaultValue={today} required />
              </div>
            </div>
            <Input name="note" placeholder="Nota (opcional)" />
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Salvando..." : "Salvar saldo"}
            </Button>
          </form>

          {program.history.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-2">
              {program.history.map((h) => (
                <li key={h.id} className="flex justify-between text-xs text-muted-foreground">
                  <span>{df.format(new Date(h.date))}</span>
                  <span className="tabular-nums">{nf.format(h.balance)}</span>
                </li>
              ))}
            </ul>
          )}
        </details>
      </CardContent>
    </Card>
  );
}
