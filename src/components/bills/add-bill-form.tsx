"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addBillAction, type BillState } from "@/lib/actions/bill-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddBillForm({ users }: { users: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<BillState, FormData>(addBillAction, undefined);
  const [recurrence, setRecurrence] = useState<"monthly" | "one_time">("monthly");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setRecurrence("monthly");
    }
  }, [state]);

  const cls = "h-11 rounded-md border border-input bg-background px-3 text-base";

  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="bill-name">Nome da conta</Label>
        <Input id="bill-name" name="name" placeholder="Ex.: Aluguel, Energia, Internet" required />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="bill-recurrence">Tipo</Label>
          <select
            id="bill-recurrence"
            name="recurrence"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as "monthly" | "one_time")}
            className={cls}
          >
            <option value="monthly">Fixa mensal</option>
            <option value="one_time">Avulsa</option>
          </select>
        </div>
        {recurrence === "monthly" ? (
          <div className="flex flex-col gap-1">
            <Label htmlFor="bill-dueday">Vence todo dia</Label>
            <Input
              id="bill-dueday"
              name="dueDay"
              type="number"
              min={1}
              max={31}
              placeholder="10"
              required
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <Label htmlFor="bill-duedate">Vencimento</Label>
            <Input id="bill-duedate" name="dueDate" type="date" required />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="bill-amount">Valor (opcional)</Label>
          <Input id="bill-amount" name="amount" inputMode="decimal" placeholder="1000,00" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="bill-owner">De quem</Label>
          <select id="bill-owner" name="ownerId" defaultValue="casal" className={cls}>
            <option value="casal">Família</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name.split(" ")[0]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="bill-notes">Observação (opcional)</Label>
        <Input id="bill-notes" name="notes" placeholder="Ex.: boleto no email, débito automático" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Cadastrar conta"}
      </Button>
    </form>
  );
}
