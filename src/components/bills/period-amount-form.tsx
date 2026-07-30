"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setBillPeriodAmountAction, type BillState } from "@/lib/actions/bill-actions";

/**
 * Valor desta conta só neste mês: o total da fatura do cartão (que muda todo mês) ou uma
 * conta variável (energia, água). Vazio + Salvar limpa e volta a valer o valor cadastrado.
 */
export function PeriodAmountForm({
  billId,
  periodKey,
  amountCents,
  label,
  helper,
  placeholder = "3000,00",
}: {
  billId: string;
  periodKey: string;
  amountCents: number | null;
  label: string;
  helper?: string;
  placeholder?: string;
}) {
  const [state, action, pending] = useActionState<BillState, FormData>(
    setBillPeriodAmountAction,
    undefined,
  );

  const id = `pa-${billId}-${periodKey}`;
  const defaultValue = amountCents != null ? (amountCents / 100).toFixed(2).replace(".", ",") : "";

  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="billId" value={billId} />
      <input type="hidden" name="periodKey" value={periodKey} />
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          name="amount"
          inputMode="decimal"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? "..." : "Salvar"}
        </Button>
      </div>
      {state?.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : (
        helper && <p className="text-xs text-muted-foreground">{helper}</p>
      )}
    </form>
  );
}
