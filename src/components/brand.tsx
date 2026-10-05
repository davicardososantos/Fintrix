import { WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <WalletCards className="h-6 w-6" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-xl font-bold tracking-tight">
          fintrix<span className="text-primary">.</span>
        </span>
        {!compact && (
          <span className="block text-xs text-muted-foreground">Finanças em família</span>
        )}
      </span>
    </span>
  );
}
