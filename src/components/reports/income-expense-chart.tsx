import Link from "next/link";
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

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Entradas e gastos por mês">
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
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* linha de entradas (verde) */}
        <polyline
          points={incomePts}
          fill="none"
          stroke="hsl(var(--positive))"
          strokeWidth={2}
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
              className={`flex-1 text-center text-[10px] ${
                active ? "font-semibold text-foreground" : "text-muted-foreground"
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
