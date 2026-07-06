"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Money } from "@/components/money";
import { Check, RotateCcw, Pencil, CalendarClock } from "lucide-react";
import {
  markBillPaidAction,
  unmarkBillPaidAction,
  updateBillAction,
  deleteBillAction,
  type BillState,
} from "@/lib/actions/bill-actions";
import type { BillView } from "@/lib/bills";
import { StatusBadge, statusText, formatDue } from "@/components/bills/bill-ui";

export function BillCard({
  bill,
  users,
}: {
  bill: BillView;
  users: { id: string; name: string }[];
}) {
  const [, markAction, markPending] = useActionState<BillState, FormData>(
    markBillPaidAction,
    undefined,
  );
  const [, unmarkAction, unmarkPending] = useActionState<BillState, FormData>(
    unmarkBillPaidAction,
    undefined,
  );
  const [editState, editAction, editPending] = useActionState<BillState, FormData>(
    updateBillAction,
    undefined,
  );
  const [, deleteAction, deletePending] = useActionState<BillState, FormData>(
    deleteBillAction,
    undefined,
  );

  const [editing, setEditing] = useState(false);
  const [recurrence, setRecurrence] = useState(bill.recurrence);
  const editRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (editState?.ok) setEditing(false);
  }, [editState]);

  const cls = "h-11 rounded-md border border-input bg-background px-3 text-base";
  const amountForInput =
    bill.amountCents != null ? (bill.amountCents / 100).toFixed(2).replace(".", ",") : "";
  const dateForInput = bill.dueDateISO.slice(0, 10);

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <form ref={editRef} action={editAction} className="flex flex-col gap-3">
            <input type="hidden" name="billId" value={bill.id} />
            <div className="flex flex-col gap-1">
              <Label htmlFor={`e-name-${bill.id}`}>Nome</Label>
              <Input id={`e-name-${bill.id}`} name="name" defaultValue={bill.name} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`e-rec-${bill.id}`}>Tipo</Label>
                <select
                  id={`e-rec-${bill.id}`}
                  name="recurrence"
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}
                  className={cls}
                >
                  <option value="monthly">Fixa mensal</option>
                  <option value="one_time">Avulsa</option>
                </select>
              </div>
              {recurrence === "monthly" ? (
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`e-day-${bill.id}`}>Vence todo dia</Label>
                  <Input
                    id={`e-day-${bill.id}`}
                    name="dueDay"
                    type="number"
                    min={1}
                    max={31}
                    defaultValue={bill.dueDay ?? ""}
                    required
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`e-date-${bill.id}`}>Vencimento</Label>
                  <Input
                    id={`e-date-${bill.id}`}
                    name="dueDate"
                    type="date"
                    defaultValue={dateForInput}
                    required
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`e-amount-${bill.id}`}>Valor (opcional)</Label>
                <Input
                  id={`e-amount-${bill.id}`}
                  name="amount"
                  inputMode="decimal"
                  defaultValue={amountForInput}
                  placeholder="1000,00"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`e-owner-${bill.id}`}>De quem</Label>
                <select
                  id={`e-owner-${bill.id}`}
                  name="ownerId"
                  defaultValue={bill.ownerId ?? "casal"}
                  className={cls}
                >
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
              <Label htmlFor={`e-notes-${bill.id}`}>Observação</Label>
              <Input id={`e-notes-${bill.id}`} name="notes" defaultValue={bill.notes ?? ""} />
            </div>
            {editState?.error && <p className="text-sm text-destructive">{editState.error}</p>}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={editPending}>
                  {editPending ? "Salvando..." : "Salvar"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </form>

          <form
            action={deleteAction}
            className="mt-3 border-t border-border pt-3"
            onSubmit={(e) => {
              if (!confirm(`Excluir a conta "${bill.name}"?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="billId" value={bill.id} />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={deletePending}
              className="text-destructive"
            >
              {deletePending ? "Excluindo..." : "Excluir conta"}
            </Button>
          </form>
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setRecurrence(bill.recurrence);
              setEditing(true);
            }}
          >
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
