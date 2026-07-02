import { cn } from "@/lib/utils";
import { formatCents, formatSignedCents } from "@/lib/money";

/**
 * Exibe valor monetário com cor de domínio (positive/negative) e formato pt-BR.
 * Regra: nunca formatar dinheiro à mão — usar este componente.
 */
export function Money({
  amountCents,
  currency = "BRL",
  signed = false,
  colored = true,
  className,
}: {
  amountCents: number;
  currency?: string;
  signed?: boolean;
  colored?: boolean;
  className?: string;
}) {
  const text = signed
    ? formatSignedCents(amountCents, currency)
    : formatCents(amountCents, currency);

  return (
    <span
      className={cn(
        "tabular-nums",
        colored && amountCents > 0 && "text-positive",
        colored && amountCents < 0 && "text-negative",
        className,
      )}
    >
      {text}
    </span>
  );
}
