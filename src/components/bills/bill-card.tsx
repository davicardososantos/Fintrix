"use client";

import { useActionState, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/money";
import { Check, RotateCcw, Pencil, CalendarClock } from "lucide-react";
import {
  markBillPaidAction,
  unmarkBillPaidAction,
  type BillState,
} from "@/lib/actions/bill-actions";
import type { BillView } from "@/lib/bills";
import { StatusBadge, statusText, formatDue } from "@/components/bills/bill-ui";
import { BillEditForm, BillDeleteForm } from "@/components/bills/bill-edit-form";
import { PeriodAmountForm } from "@/components/bills/period-amount-form";

export function BillCard({
  bill,
  users,
  parents,
}: {
  bill: BillView;
  users: { id: string; name: string }[];
  parents: { id: string; name: string }[];
}) {
  const [, markAction, markPending] = useActionState<BillState, FormData>(
    markBillPaidAction,
    undefined,
  );
  const [, unmarkAction, unmarkPending] = useActionState<BillState, FormData>(
    unmarkBillPaidAction,
    undefined,
  );

  const [editing, setEditing] = useState(false);
  const stopEditing = useCallback(() => setEditing(false), []);

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <BillEditForm
            bill={bill}
            users={users}
            parents={parents}
            onCancel={stopEditing}
            onSaved={stopEditing}
          />
          <div className="mt-3 border-t border-border pt-3">
            <PeriodAmountForm
              billId={bill.id}
              periodKey={bill.periodKey}
              amountCents={bill.periodAmountCents}
              label="Valor só deste mês (opcional)"
              helper="Para contas que variam (energia, água). Vazio = usa o valor cadastrado."
              placeholder="250,00"
            />
          </div>
          <BillDeleteForm bill={bill} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={bill.status === "overdue" ? "border-negative" : undefined}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <CalendarClock className={`h-4 w-4 ${statusText(bill.status)}`} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{bill.name}</p>
              <p className="text-xs text-muted-foreground">
                {bill.recurrence === "monthly" ? "Fixa mensal" : "Avulsa"} · vence {formatDue(bill.dueDateISO)}
                {bill.ownerName ? ` · ${bill.ownerName}` : ""}
              </p>
              {bill.notes && <p className="mt-0.5 text-xs text-muted-foreground">{bill.notes}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {bill.amountCents != null ? (
              <Money amountCents={bill.amountCents} colored={false} className="font-bold" />
            ) : (
              <span className="text-xs text-muted-foreground">Valor variável</span>
            )}
            {bill.periodAmountCents != null && (
              <span className="text-[11px] text-muted-foreground">valor deste mês</span>
            )}
            <StatusBadge status={bill.status} />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {bill.paid ? (
            <form action={unmarkAction}>
              <input type="hidden" name="billId" value={bill.id} />
              <input type="hidden" name="periodKey" value={bill.periodKey} />
              <Button type="submit" variant="ghost" size="sm" disabled={unmarkPending}>
                <RotateCcw className="h-4 w-4" /> {unmarkPending ? "..." : "Desmarcar"}
              </Button>
            </form>
          ) : (
            <form action={markAction}>
              <input type="hidden" name="billId" value={bill.id} />
              <input type="hidden" name="periodKey" value={bill.periodKey} />
              <Button type="submit" size="sm" disabled={markPending}>
                <Check className="h-4 w-4" /> {markPending ? "..." : "Marcar paga"}
              </Button>
            </form>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
