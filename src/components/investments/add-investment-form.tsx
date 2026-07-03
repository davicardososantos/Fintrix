"use client";

import { useActionState, useEffect, useRef } from "react";
import { addInvestmentAction, type InvestmentState } from "@/lib/actions/investment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const today = new Date().toISOString().slice(0, 10);

export function AddInvestmentForm({ users }: { users: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<InvestmentState, FormData>(
    addInvestmentAction,
    undefined,
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  const cls = "h-11 rounded-md border border-input bg-background px-3 text-base";

  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="inv-name">Nome</Label>
        <Input id="inv-name" name="name" placeholder="Ex.: CDB C6" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="inv-principal">Valor aplicado</Label>
          <Input id="inv-principal" name="principal" inputMode="decimal" placeholder="1000,00" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="inv-applied">Data da aplicação</Label>
          <Input id="inv-applied" name="appliedAt" type="date" defaultValue={today} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select name="type" defaultValue="cdb" className={cls}>
          <option value="cdb">CDB</option>
          <option value="other">Outro</option>
        </select>
        <select name="ownerId" defaultValue="casal" className={cls}>
          <option value="casal">Família</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name.split(" ")[0]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="inv-inst">Instituição</Label>
          <Input id="inv-inst" name="institution" placeholder="C6" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="inv-maturity">Vencimento (opcional)</Label>
          <Input id="inv-maturity" name="maturityAt" type="date" />
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Cadastrar investimento"}
      </Button>
    </form>
  );
}
