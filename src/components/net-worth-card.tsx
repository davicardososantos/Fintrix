"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Wallet, TrendingUp, Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";

const nf = new Intl.NumberFormat("pt-BR");
const STORAGE_KEY = "fintrix:hide-balances";
const MASK = "••••••";

export type NetWorthProps = {
  accountsCents: number;
  investmentsCents: number;
  pointsTotal: number;
};

export function NetWorthCard({ accountsCents, investmentsCents, pointsTotal }: NetWorthProps) {
  // Começa oculto para não vazar valores antes de ler a preferência (evita flash).
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggle() {
    setHidden((h) => {
      const next = !h;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const totalCents = accountsCents + investmentsCents;
  const money = (cents: number) => (hidden ? MASK : formatCents(cents));
  const points = (n: number) => (hidden ? MASK : nf.format(n));

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">Patrimônio</CardTitle>
          <span className="mt-1 block text-3xl font-bold tabular-nums">{money(totalCents)}</span>
        </div>
        <button
          onClick={toggle}
          aria-label={hidden ? "Mostrar valores" : "Ocultar valores"}
          className="rounded-full p-2 text-muted-foreground transition-colors active:bg-muted"
        >
          {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        <Row
          href="/contas"
          icon={<Wallet className="h-4 w-4 text-primary" />}
          label="Contas"
          value={money(accountsCents)}
        />
        <Row
          href="/investimentos"
          icon={<TrendingUp className="h-4 w-4 text-investment" />}
          label="Investimentos"
          value={money(investmentsCents)}
        />
        <Row
          href="/pontos"
          icon={<Plane className="h-4 w-4 text-points" />}
          label="Pontos"
          value={`${points(pointsTotal)} pts`}
        />
      </CardContent>
    </Card>
  );
}

function Row({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Link href={href} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
      <span className="flex items-center gap-2 text-sm">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </Link>
  );
}
