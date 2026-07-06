"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/money";
import { CalendarClock, Check, ChevronRight } from "lucide-react";
import { markBillPaidAction, type BillState } from "@/lib/actions/bill-actions";
import type { BillView } from "@/lib/bills";
import { statusText, formatDueFull } from "@/components/bills/bill-ui";

export function BillReminderCard({ bills }: { bills: BillView[] }) {
  if (bills.length === 0) return null;

  const overdue = bills.filter((b) => b.status === "overdue").length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-warning" /> Contas a pagar
          </CardTitle>
          <Link
            href="/contas-a-pagar"
            className="flex items-center text-xs font-medium text-primary"
          >
            Ver todas <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          {bills.length} em aberto{overdue > 0 ? ` · ${overdue} vencida${overdue > 1 ? "s" : ""}` : ""}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-border">
          {bills.map((b) => (
            <ReminderRow key={b.id} bill={b} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ReminderRow({ bill }: { bill: BillView }) {
  const [, action, pending] = useActionState<BillState, FormData>(markBillPaidAction, undefined);

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{bill.name}</p>
        <p className={`text-xs ${statusText(bill.status)}`}>
          {bill.status === "overdue" ? "Venceu " : "Vence "}
          {formatDueFull(bill.dueDateISO)}
          {bill.ownerName ? ` · ${bill.ownerName}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {bill.amountCents != null && (
          <Money amountCents={bill.amountCents} colored={false} className="text-sm font-semibold" />
        )}
        <form action={action}>
          <input type="hidden" name="billId" value={bill.id} />
          <input type="hidden" name="periodKey" value={bill.periodKey} />
          <Button type="submit" size="sm" variant="ghost" disabled={pending} aria-label="Marcar paga">
            <Check className="h-4 w-4 text-positive" /> {pending ? "..." : "Paga"}
          </Button>
        </form>
      </div>
    </li>
  );
}
