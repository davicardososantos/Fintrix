"use client";

import { useActionState, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/money";
import { Check, RotateCcw, Pencil, CreditCard, AlertTriangle } from "lucide-react";
import {
  markBillPaidAction,
  unmarkBillPaidAction,
  type BillState,
} from "@/lib/actions/bill-actions";
import type { BillGroup, BillView } from "@/lib/bills";
import { StatusBadge, statusText, formatDue } from "@/components/bills/bill-ui";
import { BillEditForm, BillDeleteForm } from "@/components/bills/bill-edit-form";
import { PeriodAmountForm } from "@/components/bills/period-amount-form";

/**
 * Fatura com contas fixas dentro (ex.: Cartão com Seguro e Arquiteta). O usuário informa o
 * total do mês e a linha da fatura mostra o RESTANTE: Seguro + Arquiteta + restante = total.
 * As contas de dentro não têm botão de pagar — são pagas junto com a fatura.
 */
export function BillGroupCard({
  group,
  users,
  parents,
  monthLabel,
}: {
  group: BillGroup;
  users: { id: string; name: string }[];
  parents: { id: string; name: string }[];
  monthLabel: string;
}) {
  const { parent, children, declaredTotalCents, remainderCents, childrenWithoutAmount } = group;

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
            bill={parent}
            users={users}
            parents={parents}
            onCancel={stopEditing}
            onSaved={stopEditing}
          />
          <BillDeleteForm bill={parent} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={parent.status === "overdue" ? "border-negative" : undefined}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <CreditCard className={`h-4 w-4 ${statusText(parent.status)}`} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{parent.name}</p>
              <p className="text-xs text-muted-foreground">
                Fatura · vence {formatDue(parent.dueDateISO)}
                {parent.ownerName ? ` · ${parent.ownerName}` : ""}
              </p>
              {parent.notes && <p className="mt-0.5 text-xs text-muted-foreground">{parent.notes}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {remainderCents != null ? (
              <>
                <Money
                  amountCents={remainderCents}
                  colored={false}
                  className={`font-bold ${remainderCents < 0 ? "text-negative" : ""}`}
                />
                <span className="text-[11px] text-muted-foreground">restante da fatura</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Informe o total</span>
            )}
            <StatusBadge status={parent.status} />
          </div>
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <PeriodAmountForm
            billId={parent.id}
            periodKey={parent.periodKey}
            amountCents={declaredTotalCents}
            label={`Total da fatura em ${monthLabel}`}
            helper="As contas de dentro são descontadas deste total."
          />
        </div>

        <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
          {children.map((c) => (
            <ChildRow key={c.id} child={c} users={users} parents={parents} />
          ))}
        </ul>

        {remainderCents != null && remainderCents < 0 && (
          <Warning>
            O total informado é menor que as contas de dentro (
            <Money amountCents={group.childrenSumCents} colored={false} />). Confira o valor.
          </Warning>
        )}
        {declaredTotalCents == null && (
          <Warning>
            Informe o total da fatura deste mês para ver o restante.
          </Warning>
        )}
        {childrenWithoutAmount > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {childrenWithoutAmount === 1
              ? "1 conta de dentro está sem valor — ela fica embutida no restante."
              : `${childrenWithoutAmount} contas de dentro estão sem valor — ficam embutidas no restante.`}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          {parent.paid ? (
            <form action={unmarkAction}>
              <input type="hidden" name="billId" value={parent.id} />
              <input type="hidden" name="periodKey" value={parent.periodKey} />
              <Button type="submit" variant="ghost" size="sm" disabled={unmarkPending}>
                <RotateCcw className="h-4 w-4" /> {unmarkPending ? "..." : "Desmarcar"}
              </Button>
            </form>
          ) : (
            <form action={markAction}>
              <input type="hidden" name="billId" value={parent.id} />
              <input type="hidden" name="periodKey" value={parent.periodKey} />
              <Button type="submit" size="sm" disabled={markPending}>
                <Check className="h-4 w-4" /> {markPending ? "..." : "Marcar fatura paga"}
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

function ChildRow({
  child,
  users,
  parents,
}: {
  child: BillView;
  users: { id: string; name: string }[];
  parents: { id: string; name: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const stopEditing = useCallback(() => setEditing(false), []);

  if (editing) {
    return (
      <li className="rounded-md bg-muted/40 p-3">
        <BillEditForm
          bill={child}
          users={users}
          parents={parents}
          onCancel={stopEditing}
          onSaved={stopEditing}
        />
        <div className="mt-3 border-t border-border pt-3">
          <PeriodAmountForm
            billId={child.id}
            periodKey={child.periodKey}
            amountCents={child.periodAmountCents}
            label="Valor só deste mês (opcional)"
            helper="Vazio = usa o valor cadastrado."
            placeholder="600,00"
          />
        </div>
        <BillDeleteForm bill={child} />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 py-1">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{child.name}</p>
        <p className="text-xs text-muted-foreground">
          dentro da fatura
          {child.ownerName ? ` · ${child.ownerName}` : ""}
          {child.periodAmountCents != null ? " · valor deste mês" : ""}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {child.amountCents != null ? (
          <Money amountCents={child.amountCents} colored={false} className="text-sm font-semibold" />
        ) : (
          <span className="text-xs text-muted-foreground">Valor variável</span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Editar ${child.name}`}
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
