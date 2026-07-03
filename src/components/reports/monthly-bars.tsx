import Link from "next/link";
import { monthKeyToParam, type MonthKey } from "@/lib/reports/date-range";
import { formatCents } from "@/lib/money";

export type MonthlyPoint = {
  key: MonthKey;
  label: string;
  expenseCents: number;
};

/** Barras verticais de gasto por mês (evolução). Tocar num mês navega para ele (?m=). */
export function MonthlyBars({ points, activeParam }: { points: MonthlyPoint[]; activeParam: string }) {
  const max = Math.max(...points.map((p) => p.expenseCents), 1);

  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height: 140 }}>
      {points.map((p) => {
        const h = Math.max(4, Math.round((p.expenseCents / max) * 110));
        const param = monthKeyToParam(p.key);
        const active = param === activeParam;
        return (
          <Link
            key={param}
            href={`/relatorios?m=${param}`}
            className="flex flex-1 flex-col items-center gap-1"
            title={`${p.label}: ${formatCents(p.expenseCents)}`}
          >
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className={active ? "w-full rounded-t bg-primary" : "w-full rounded-t bg-primary/35"}
                style={{ height: h }}
              />
            </div>
            <span className={`text-[10px] ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {p.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
