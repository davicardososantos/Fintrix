"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type FilterOptions = {
  categories: { id: string; name: string }[];
  users: { id: string; name: string }[];
  accounts: { id: string; name: string }[];
};

export function Filters({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const currentQuery = params.get("q") ?? "";
  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/transacoes?${next.toString()}`);
  }
  const filtered = ["q", "categoryId", "ownerId", "accountId"].some((key) => params.has(key));
  const selectClass =
    "h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="rounded-lg border border-border/70 bg-card p-4 sm:p-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setParam("q", query);
        }}
        className="flex items-center gap-2 rounded-md border border-input bg-background pl-3 focus-within:ring-2 focus-within:ring-ring"
      >
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar transações pela descrição"
          placeholder="Buscar uma movimentação"
          className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none focus-visible:outline-none"
        />
        <Button type="submit" variant="ghost" size="icon" aria-label="Buscar">
          <ArrowSearch />
        </Button>
      </form>
      <div className="mb-3 mt-5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          Refine sua busca
        </span>
        {filtered && (
          <button
            onClick={() => {
              const next = new URLSearchParams(params.toString());
              ["q", "categoryId", "ownerId", "accountId"].forEach((key) => next.delete(key));
              setQuery("");
              router.push(`/transacoes?${next.toString()}`);
            }}
            className="flex min-h-11 items-center gap-1 text-xs font-semibold text-primary"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </button>
        )}
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="min-w-0 space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Categoria</span>
          <select
            value={params.get("categoryId") ?? ""}
            onChange={(event) => setParam("categoryId", event.target.value)}
            className={selectClass}
          >
            <option value="">Todas as categorias</option>
            <option value="none">Sem categoria</option>
            {options.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Pessoa</span>
          <select
            value={params.get("ownerId") ?? ""}
            onChange={(event) => setParam("ownerId", event.target.value)}
            className={selectClass}
          >
            <option value="">Todas as pessoas</option>
            <option value="casal">Família</option>
            {options.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name.split(" ")[0]}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Conta</span>
          <select
            value={params.get("accountId") ?? ""}
            onChange={(event) => setParam("accountId", event.target.value)}
            className={selectClass}
          >
            <option value="">Todas as contas</option>
            {options.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
function ArrowSearch() {
  return <Search className="h-4 w-4" />;
}
