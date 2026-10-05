import Link from "next/link";
import { useId } from "react";
import { monthKeyToParam, type MonthKey } from "@/lib/reports/date-range";
import { formatCompactCents } from "@/lib/money";

export type SeriesPoint = {
  key: MonthKey;
  label: string;
  incomeCents: number;
  expenseCents: number;
};

/**
 * Gráfico de linhas: entradas (verde) x gastos (vermelho) por mês, com valores nos pontos.
 * Tocar num mês navega para ele (?m=). SVG puro — sem lib de gráfico.
 */
export function IncomeExpenseChart({
  points,
  activeParam,
}: {
  points: SeriesPoint[];
  activeParam: string;
}) {
  const gradientId = useId();
  const W = 340;
  const H = 172;
  const padL = 12;
  const padR = 12;
  const padTop = 24;
  const padBottom = 24;
  const plotW = W - padL - padR;
  const plotH = H - padTop - padBottom;

  const n = points.length;
  const max = Math.max(1, ...points.map((p) => Math.max(p.incomeCents, p.expenseCents)));

  const x = (i: number) => (n === 1 ? padL + plotW / 2 : padL + (i * plotW) / (n - 1));
  const y = (v: number) => padTop + (1 - v / max) * plotH;

  const line = (pick: (p: SeriesPoint) => number) =>
    points.map((p, i) => `${x(i)},${y(pick(p))}`).join(" ");

  const incomePts = line((p) => p.incomeCents);
  const expensePts = line((p) => p.expenseCents);

  return (
    <div className="flex flex-col gap-2">
      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "hsl(var(--positive))" }} />
          Entrou
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "hsl(var(--negative))" }} />
          Saiu
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto w-full max-w-xl"
        role="img"
        aria-label="Entradas e gastos por mês"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--positive))" stopOpacity="0.16" />
            <stop offset="100%" stopColor="hsl(var(--positive))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={padL}
            x2={W - padR}
            y1={padTop + plotH * fraction}
            y2={padTop + plotH * fraction}
            stroke="hsl(var(--border))"
            strokeDasharray="3 5"
          />
        ))}
        {n > 0 && (
          <polygon
            points={`${x(0)},${H - padBottom} ${incomePts} ${x(n - 1)},${H - padBottom}`}
            fill={`url(#${gradientId})`}
          />
        )}
        {/* baseline */}
        <line
          x1={padL}
          x2={W - padR}
          y1={H - padBottom}
          y2={H - padBottom}
          stroke="hsl(var(--border))"
          strokeWidth={1}
        />

        {/* linha de gastos (vermelho) */}
        <polyline
          points={expensePts}
          fill="none"
          stroke="hsl(var(--negative))"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* linha de entradas (verde) */}
        <polyline
          points={incomePts}
          fill="none"
          stroke="hsl(var(--positive))"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => {
          const px = x(i);
          const active = monthKeyToParam(p.key) === activeParam;
          const r = active ? 4 : 3;
          return (
            <g key={monthKeyToParam(p.key)}>
              {/* valor de entrada (acima) */}
              <text
                x={px}
                y={y(p.incomeCents) - 7}
                textAnchor="middle"
                fontSize={9}
                fontWeight={active ? 700 : 400}
                fill="hsl(var(--positive))"
              >
                {formatCompactCents(p.incomeCents)}
              </text>
              {/* valor de gasto (abaixo) */}
              <text
                x={px}
                y={y(p.expenseCents) + 14}
                textAnchor="middle"
                fontSize={9}
                fontWeight={active ? 700 : 400}
                fill="hsl(var(--negative))"
              >
                {formatCompactCents(p.expenseCents)}
              </text>
              <circle cx={px} cy={y(p.expenseCents)} r={r} fill="hsl(var(--negative))" />
              <circle cx={px} cy={y(p.incomeCents)} r={r} fill="hsl(var(--positive))" />
            </g>
          );
        })}
      </svg>

      {/* Meses (navegação) */}
      <div className="flex justify-between gap-1">
        {points.map((p) => {
          const param = monthKeyToParam(p.key);
          const active = param === activeParam;
          return (
            <Link
              key={param}
              href={`/relatorios?m=${param}`}
              className={`flex min-h-11 flex-1 items-center justify-center rounded-md text-xs transition-colors hover:bg-muted ${
                active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
