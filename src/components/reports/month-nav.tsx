"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-1">
      <button
        onClick={() => go(-1)}
        aria-label="Mês anterior"
        className="flex h-9 w-9 items-center justify-center rounded-md active:bg-muted"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-sm font-semibold capitalize">{monthLabel(current)}</span>
      <button
        onClick={() => go(1)}
        aria-label="Próximo mês"
        className="flex h-9 w-9 items-center justify-center rounded-md active:bg-muted"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
