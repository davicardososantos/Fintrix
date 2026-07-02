"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ReceiptText, Plus, PieChart, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/transacoes", label: "Transações", icon: ReceiptText },
  { href: "/importar", label: "Importar", icon: Plus, primary: true },
  { href: "/relatorios", label: "Relatórios", icon: PieChart },
  { href: "/mais", label: "Mais", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur">
      <ul className="mx-auto flex max-w-[480px] items-stretch justify-around">
        {items.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          if (primary) {
            return (
              <li key={href} className="flex items-center">
                <Link
                  href={href}
                  aria-label={label}
                  className="-mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95"
                >
                  <Icon className="h-6 w-6" />
                </Link>
              </li>
            );
          }
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
