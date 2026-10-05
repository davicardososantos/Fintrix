"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  ChartNoAxesCombined,
  MoreHorizontal,
  CalendarClock,
  Wallet,
  TrendingUp,
  Plane,
  Tags,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/brand";

const mainItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/transacoes", label: "Transações", icon: ReceiptText },
  { href: "/importar", label: "Importar", icon: Plus },
  { href: "/relatorios", label: "Relatórios", icon: ChartNoAxesCombined },
  { href: "/mais", label: "Mais", icon: MoreHorizontal },
];
const extraItems = [
  { href: "/contas-a-pagar", label: "Contas a pagar", icon: CalendarClock },
  { href: "/contas", label: "Contas e carteiras", icon: Wallet },
  { href: "/investimentos", label: "Investimentos", icon: TrendingUp },
  { href: "/pontos", label: "Pontos e milhas", icon: Plane },
  { href: "/categorias", label: "Categorias", icon: Tags },
];

export function AppNavigation() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col overflow-y-auto border-r border-border/70 bg-card px-5 py-6 lg:flex">
        <Link href="/dashboard" aria-label="Fintrix — início">
          <Brand />
        </Link>
        <nav aria-label="Navegação principal" className="mt-6">
          <p className="eyebrow mb-3 px-3">Visão geral</p>
          <ul className="space-y-1">
            {mainItems
              .filter((i) => i.href !== "/importar" && i.href !== "/mais")
              .map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive(href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-muted",
                      isActive(href) ? "bg-primary/10 text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                </li>
              ))}
          </ul>
          <p className="eyebrow mb-3 mt-5 px-3">Organização</p>
          <ul className="space-y-1">
            {[
              ...extraItems,
              { href: "/mais", label: "Família e ajustes", icon: MoreHorizontal },
            ].map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-muted",
                    isActive(href) ? "bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/importar"
          aria-current={isActive("/importar") ? "page" : undefined}
          className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-5 w-5" />
          Importar arquivo
          <ArrowUpRight className="ml-auto h-4 w-4" />
        </Link>
        <p className="nav-note mt-auto pt-6 text-xs leading-relaxed text-muted-foreground">
          Mais clareza hoje.
          <br />
          Mais tranquilidade amanhã.
        </p>
      </aside>
      <nav
        aria-label="Navegação principal"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 px-2 backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto flex max-w-xl items-center justify-around">
          {mainItems.map(({ href, label, icon: Icon }) => {
            const active =
              isActive(href) || (href === "/mais" && extraItems.some((i) => isActive(i.href)));
            return (
              <li key={href} className="min-w-0 flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-20 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-12 items-center justify-center rounded-md transition-colors",
                      href === "/importar"
                        ? "bg-primary text-primary-foreground"
                        : active
                          ? "bg-primary/10"
                          : "",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
