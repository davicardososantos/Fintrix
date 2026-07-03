"use client";

import { useActionState, useEffect, useRef } from "react";
import { addAccountAction, type AccountState } from "@/lib/actions/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddAccountForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(addAccountAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  const cls = "h-11 rounded-md border border-input bg-background px-3 text-base";

  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="acc-name">Nome</Label>
        <Input id="acc-name" name="name" placeholder="Ex.: Conta C6, Carteira" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="acc-type">Tipo</Label>
          <select id="acc-type" name="type" defaultValue="checking" className={cls}>
            <option value="checking">Conta corrente</option>
            <option value="credit_card">Cartão de crédito</option>
            <option value="meal_voucher">Vale-refeição</option>
            <option value="cash">Dinheiro</option>
            <option value="other">Outra</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="acc-inst">Instituição</Label>
          <Input id="acc-inst" name="institution" placeholder="C6, Nubank..." />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="acc-balance">Saldo atual (opcional)</Label>
        <Input id="acc-balance" name="balance" inputMode="decimal" placeholder="1000,00" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Cadastrar conta"}
      </Button>
    </form>
  );
}
