"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type PersonFilterOption = { value: string; label: string };

/** Chips de filtro por pessoa (Todos / Casal / cada cônjuge). Atualiza ?person= preservando o mês. */
export function PersonFilter({ options }: { options: PersonFilterOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("person") ?? "";

  function set(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("person", value);
    else next.delete("person");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => set(o.value)}
          className={cn(
            "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
            active === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
