import Link from "next/link";
import { cn } from "@/lib/utils";
import { tokenBg } from "@/components/category-badge";
import { Money } from "@/components/money";

export type BarItem = {
  label: string;
  totalCents: number;
  pct: number;
  color?: string | null;
  href?: string;
};

/** Lista de barras horizontais (categorias/pessoas). Barra usa token de cor do tema. */
export function BarList({ items }: { items: BarItem[] }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sem dados no período.</p>;
  }
  const max = Math.max(...items.map((i) => i.totalCents), 1);

  return (
    <ul className="flex flex-col gap-5">
      {items.map((item) => {
        const width = Math.max(2, Math.round((item.totalCents / max) * 100));
        const Row = (
          <>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">{item.label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                <Money amountCents={item.totalCents} colored={false} /> · {item.pct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("bar-enter h-full rounded-full", tokenBg(item.color))}
                style={{ width: `${width}%` }}
              />
            </div>
          </>
        );
        return (
          <li key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                className="block min-h-11 rounded-sm transition-opacity hover:opacity-75"
              >
                {Row}
              </Link>
            ) : (
              Row
            )}
          </li>
        );
      })}
    </ul>
  );
}
