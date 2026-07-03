import { cn } from "@/lib/utils";

// Mapa estático token→classe (Tailwind não aceita classe dinâmica). Tokens vêm do tema.
const DOT: Record<string, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  investment: "bg-investment",
  points: "bg-points",
  warning: "bg-warning",
  muted: "bg-muted-foreground",
};

export function CategoryBadge({
  name,
  color,
  className,
}: {
  name?: string | null;
  color?: string | null;
  className?: string;
}) {
  if (!name) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>Sem categoria</span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className={cn("h-2 w-2 rounded-full", DOT[color ?? "muted"] ?? DOT.muted)} />
      {name}
    </span>
  );
}
