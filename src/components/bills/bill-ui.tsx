import { cn } from "@/lib/utils";
import type { BillStatus } from "@/lib/bills";

const df = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const dfFull = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });

/** "10 de jul." — vencimento no mês corrente. */
export function formatDue(iso: string): string {
  return df.format(new Date(iso));
}

/** "10 de jul. de 26" — com ano, para contas de meses diferentes. */
export function formatDueFull(iso: string): string {
  return dfFull.format(new Date(iso));
}

const META: Record<BillStatus, { label: string; text: string }> = {
  paid: { label: "Paga", text: "text-positive" },
  overdue: { label: "Vencida", text: "text-negative" },
  due_soon: { label: "Vence logo", text: "text-warning" },
  upcoming: { label: "A vencer", text: "text-muted-foreground" },
};

export function statusText(status: BillStatus): string {
  return META[status].text;
}

export function StatusBadge({ status, className }: { status: BillStatus; className?: string }) {
  const m = META[status];
  return (
    <span
      className={cn(
        "rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium",
        m.text,
        className,
      )}
    >
      {m.label}
    </span>
  );
}
