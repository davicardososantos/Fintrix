"use client";

import { useActionState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Money } from "@/components/money";
import { addInvestmentSnapshotAction, type InvestmentState } from "@/lib/actions/investment-actions";
import type { InvestmentView } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

const df = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
const today = new Date().toISOString().slice(0, 10);

export function InvestmentCard({ inv }: { inv: InvestmentView }) {
  const [state, action, pending] = useActionState<InvestmentState, FormData>(
    addInvestmentSnapshotAction,
    undefined,
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  const positive = inv.yieldCents >= 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{inv.name}</p>
            <p className="text-xs text-muted-foreground">
              {inv.institution ?? inv.type.toUpperCase()}
              {inv.ownerName ? ` · ${inv.ownerName}` : ""}
            </p>
          </div>
          <div className="text-right">
            <Money amountCents={inv.currentCents} colored={false} className="text-lg font-bold" />
            <p className={cn("text-xs tabular-nums", positive ? "text-positive" : "text-negative")}>
              {positive ? "+" : ""}
              <Money amountCents={inv.yieldCents} colored={false} /> ({inv.yieldPct.toFixed(1)}%)
            </p>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Aplicado {df.format(new Date(inv.appliedAt))} ·{" "}
          <Money amountCents={inv.principalCents} colored={false} />
          {inv.maturityAt ? ` · vence ${df.format(new Date(inv.maturityAt))}` : ""}
        </p>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-primary">
            Atualizar valor
          </summary>
          <form ref={ref} action={action} className="mt-2 flex flex-col gap-2">
            <input type="hidden" name="investmentId" value={inv.id} />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`val-${inv.id}`}>Valor atual</Label>
                <Input id={`val-${inv.id}`} name="value" inputMode="decimal" placeholder="1050,00" required />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`vd-${inv.id}`}>Data</Label>
                <Input id={`vd-${inv.id}`} name="date" type="date" defaultValue={today} required />
              </div>
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Salvando..." : "Salvar valor"}
            </Button>
          </form>

          {inv.history.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-2">
              {inv.history.map((h) => (
                <li key={h.id} className="flex justify-between text-xs text-muted-foreground">
                  <span>{df.format(new Date(h.date))}</span>
                  <Money amountCents={h.valueCents} colored={false} className="tabular-nums" />
                </li>
              ))}
            </ul>
          )}
        </details>
      </CardContent>
    </Card>
  );
}
