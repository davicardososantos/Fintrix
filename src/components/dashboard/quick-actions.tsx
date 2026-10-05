import Link from "next/link";
import { CalendarClock, ChartNoAxesCombined, ReceiptText, Upload } from "lucide-react";
const quickActions = [
  {
    href: "/contas-a-pagar",
    title: "Contas a pagar",
    caption: "Organize o mês",
    icon: CalendarClock,
  },
  { href: "/transacoes", title: "Transações", caption: "Veja cada movimento", icon: ReceiptText },
  {
    href: "/relatorios",
    title: "Relatórios",
    caption: "Entenda seus gastos",
    icon: ChartNoAxesCombined,
  },
  { href: "/importar", title: "Importar", caption: "Atualize seus dados", icon: Upload },
];

export function QuickActions() {
  return (
    <>
      {quickActions.map(({ href, title, caption, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="interactive-card flex min-w-0 flex-col gap-4 rounded-lg border border-border/70 bg-card p-4 sm:p-5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold">{title}</span>
            <span className="mt-1 hidden text-xs text-muted-foreground sm:block">{caption}</span>
          </span>
        </Link>
      ))}
    </>
  );
}
