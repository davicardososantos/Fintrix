"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export type FilterOptions = {
  categories: { id: string; name: string }[];
  users: { id: string; name: string }[];
  accounts: { id: string; name: string }[];
};

/** Barra de filtros de /transacoes: atualiza a query string (auto-aplica ao mudar). */
export function Filters({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/transacoes?${next.toString()}`);
  }

  const selectCls = "h-10 rounded-md border border-input bg-background px-2 text-sm";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          defaultValue={params.get("q") ?? ""}
          placeholder="Buscar descrição..."
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("q", (e.target as HTMLInputElement).value);
          }}
          className="h-10 flex-1 bg-transparent text-base outline-none"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <select
          value={params.get("categoryId") ?? ""}
          onChange={(e) => setParam("categoryId", e.target.value)}
          className={selectCls}
        >
          <option value="">Categoria</option>
          <option value="none">Sem categoria</option>
          {options.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={params.get("ownerId") ?? ""}
          onChange={(e) => setParam("ownerId", e.target.value)}
          className={selectCls}
        >
          <option value="">Pessoa</option>
          <option value="casal">Casal</option>
          {options.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name.split(" ")[0]}
            </option>
          ))}
        </select>
        <select
          value={params.get("accountId") ?? ""}
          onChange={(e) => setParam("accountId", e.target.value)}
          className={selectCls}
        >
          <option value="">Conta</option>
          {options.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
