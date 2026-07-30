"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateBillAction,
  deleteBillAction,
  type BillState,
} from "@/lib/actions/bill-actions";
import type { BillView } from "@/lib/bills";

/**
 * Formulário de edição de uma conta — usado tanto no card de uma conta solta quanto nas
 * linhas de dentro de uma fatura. O select "Dentro de" é o que atrela/desatrela a conta.
 * O form de excluir é separado (BillDeleteForm) porque HTML não permite form dentro de form.
 */
export function BillEditForm({
  bill,
  users,
  parents,
  onCancel,
  onSaved,
}: {
  bill: BillView;
  users: { id: string; name: string }[];
  parents: { id: string; name: string }[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [editState, editAction, editPending] = useActionState<BillState, FormData>(
    updateBillAction,
    undefined,
  );

  const [recurrence, setRecurrence] = useState(bill.recurrence);
  const [parentId, setParentId] = useState(bill.parentId ?? "none");
  useEffect(() => {
    if (editState?.ok) onSaved();
  }, [editState, onSaved]);

  const cls = "h-11 rounded-md border border-input bg-background px-3 text-base";
  const amountForInput =
    bill.baseAmountCents != null ? (bill.baseAmountCents / 100).toFixed(2).replace(".", ",") : "";
  const dateForInput = bill.dueDateISO.slice(0, 10);
  // Ao desatrelar, a conta precisa de um dia próprio: sugerimos o dia que ela herdava.
  const dayForInput = bill.dueDay ?? Number(dateForInput.slice(8, 10));
  const isChild = parentId !== "none";
  const options = parents.filter((p) => p.id !== bill.id);

  return (
    <form action={editAction} className="flex flex-col gap-3">
      <input type="hidden" name="billId" value={bill.id} />
      <div className="flex flex-col gap-1">
        <Label htmlFor={`e-name-${bill.id}`}>Nome</Label>
        <Input id={`e-name-${bill.id}`} name="name" defaultValue={bill.name} required />
      </div>

      {options.length > 0 && (
        <div className="flex flex-col gap-1">
          <Label htmlFor={`e-parent-${bill.id}`}>Dentro de (atrelado a)</Label>
          <select
            id={`e-parent-${bill.id}`}
            name="parentId"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={cls}
          >
            <option value="none">Nenhuma (conta normal)</option>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {isChild && (
            <p className="text-xs text-muted-foreground">
              Vence e é paga junto com {options.find((p) => p.id === parentId)?.name}.
            </p>
          )}
        </div>
      )}

      {isChild ? (
        <input type="hidden" name="recurrence" value="monthly" />
      ) : (
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
                defaultValue={dayForInput}
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
      )}

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
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={editPending}>
          {editPending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/** Excluir conta. Contas de dentro da fatura são promovidas a contas soltas, não excluídas. */
export function BillDeleteForm({ bill }: { bill: BillView }) {
  const [, deleteAction, deletePending] = useActionState<BillState, FormData>(
    deleteBillAction,
    undefined,
  );

  return (
    <form
      action={deleteAction}
      className="mt-3 border-t border-border pt-3"
      onSubmit={(e) => {
        const msg = `Excluir a conta "${bill.name}"? As contas que estiverem dentro dela viram contas soltas (não são excluídas).`;
        if (!confirm(msg)) e.preventDefault();
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
  );
}
