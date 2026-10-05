import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Money } from "@/components/money";
import type { MonthSummary } from "@/lib/reports/reports";

export function MonthOverview({ summary }: { summary: MonthSummary }) {
  return (
    <div className="hero-surface flex h-full flex-col p-5 sm:p-8">
      <div className="relative z-10 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-hero-muted">Visão do mês</span>
        <span className="rounded-full border border-hero-accent/20 px-3 py-1 text-xs text-hero-muted">
          Entradas − gastos
        </span>
      </div>
      <div className="relative z-10 mt-8">
        <p className="text-sm text-hero-muted">Resultado do mês</p>
        <Money
          amountCents={summary.balanceCents}
          colored={false}
          className="mt-2 block break-words text-3xl font-semibold tracking-tight sm:text-4xl"
        />
      </div>
      <div className="relative z-10 mt-8 grid grid-cols-2 gap-4 border-t border-hero-accent/20 pt-5">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs text-hero-muted">
            <ArrowDownLeft className="h-4 w-4" />
            Entradas
          </p>
          <Money
            amountCents={summary.incomeCents}
            colored={false}
            className="break-words text-lg font-semibold text-hero-accent sm:text-xl"
          />
        </div>
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs text-hero-muted">
            <ArrowUpRight className="h-4 w-4" />
            Gastos
          </p>
          <Money
            amountCents={summary.expenseCents}
            colored={false}
            className="break-words text-lg font-semibold sm:text-xl"
          />
        </div>
      </div>
      <svg
        className="pointer-events-none absolute right-0 top-0 h-56 w-56 text-hero-accent/10"
        viewBox="0 0 224 224"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="188" cy="40" r="88" stroke="currentColor" strokeWidth="1" />
        <circle cx="188" cy="40" r="64" stroke="currentColor" strokeWidth="1" />
        <circle cx="188" cy="40" r="40" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
