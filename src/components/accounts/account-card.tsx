"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Money } from "@/components/money";
import { Wallet, CreditCard, Ticket, Banknote, Landmark } from "lucide-react";
import { updateAccountBalanceAction, type AccountState } from "@/lib/actions/account-actions";
import type { AccountView } from "@/lib/portfolio";
import type { AccountType } from "@prisma/client";

const df = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });

const ICONS: Record<AccountType, typeof Wallet> = {
  checking: Landmark,
  credit_card: CreditCard,
  meal_voucher: Ticket,
  cash: Banknote,
  other: Wallet,
};

export function AccountCard({ account }: { account: AccountView }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(
    updateAccountBalanceAction,
    undefined,
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state]);

  const Icon = ICONS[account.type];
  const centsForInput =
    account.balanceCents != null ? (account.balanceCents / 100).toFixed(2).replace(".", ",") : "";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Icon className="h-4 w-4 text-primary" />
            </span>
            <div>
              <p className="font-semibold">{account.name}</p>
              <p className="text-xs text-muted-foreground">
                {account.institution ? `${account.institution} · ` : ""}
                {account.typeLabel}
              </p>
            </div>
          </div>
          <div className="text-right">
            {account.balanceCents != null ? (
              <Money amountCents={account.balanceCents} colored={false} className="text-lg font-bold" />
            ) : (
              <span className="text-sm text-muted-foreground">Sem saldo</span>
            )}
            {account.balanceUpdatedAt && (
              <p className="text-[11px] text-muted-foreground">
                {df.format(new Date(account.balanceUpdatedAt))}
              </p>
            )}
          </div>
        </div>

        {open ? (
          <form ref={ref} action={action} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="accountId" value={account.id} />
            <div className="flex flex-col gap-1">
              <Label htmlFor={`bal-${account.id}`}>Saldo atual</Label>
              <Input
                id={`bal-${account.id}`}
                name="balance"
                inputMode="decimal"
                placeholder="1000,00"
                defaultValue={centsForInput}
                required
                autoFocus
              />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Salvando..." : "Salvar saldo"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="mt-3 text-sm font-medium text-primary"
          >
            {account.balanceCents != null ? "Atualizar saldo" : "Informar saldo"}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
