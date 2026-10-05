import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Money } from "@/components/money";
import type { RecentTransaction } from "./dashboard-view";
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});
export function RecentMovements({
  recent,
  monthParam,
}: {
  recent: RecentTransaction[];
  monthParam: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Últimas movimentações</CardTitle>
          <Link
            href={`/transacoes?m=${monthParam}`}
            className="flex min-h-11 items-center gap-1 text-xs font-semibold text-primary"
          >
            Ver todas
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Seus lançamentos mais recentes neste período
        </p>
      </CardHeader>
      <CardContent>
        {recent.length ? (
          <ul className="divide-y divide-border/60">
            {recent.map((tx) => (
              <li key={tx.id}>
                <Link
                  href={`/transacoes?m=${monthParam}`}
                  className="flex min-h-16 items-center gap-3 py-3 transition-opacity hover:opacity-75"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    {tx.amountCents >= 0 ? (
                      <ArrowDownLeft className="h-4 w-4 text-positive" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{tx.description}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {dateFormat.format(new Date(tx.date))} · {tx.categoryName ?? "Sem categoria"}
                    </span>
                  </span>
                  <Money
                    amountCents={tx.amountCents}
                    signed
                    className="shrink-0 text-sm font-semibold"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma movimentação neste mês.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
