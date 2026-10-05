"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, monthKeyToParam, monthLabel, type MonthKey } from "@/lib/reports/date-range";

/** Navegação de mês (‹ mês ›). Atualiza ?m=YYYY-MM preservando os demais filtros. */
export function MonthNav({ current }: { current: MonthKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function go(delta: number) {
    const next = new URLSearchParams(params.toString());
    next.set("m", monthKeyToParam(addMonths(current, delta)));
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div
      className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-card p-1"
      role="group"
      aria-label="Selecionar mês"
    >
      <button
        onClick={() => go(-1)}
        aria-label="Mês anterior"
        className="flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-muted"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="flex items-center gap-2 text-sm font-semibold capitalize" aria-live="polite">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        {monthLabel(current)}
      </span>
      <button
        onClick={() => go(1)}
        aria-label="Próximo mês"
        className="flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-muted"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
