"use client";

import { useState, useTransition } from "react";
import { ArrowDownLeft, ArrowUpRight, X } from "lucide-react";
import { DetailsDialog } from "./details-dialog";
import { Money } from "@/components/money";
import { CategoryBadge } from "@/components/category-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  updateCategoryAction,
  updateOwnerAction,
  createRuleFromTransactionAction,
} from "@/lib/actions/transaction-actions";

export type CategoryOption = { id: string; name: string; color: string | null };
export type UserOption = { id: string; name: string };

export type TransactionDTO = {
  id: string;
  date: string;
  description: string;
  accountName: string | null;
  amountCents: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categorySource: string;
  ownerId: string | null;
  ownerName: string | null;
};

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export function TransactionItem({
  tx,
  categories,
  users,
}: {
  tx: TransactionDTO;
  categories: CategoryOption[];
  users: UserOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [rulePattern, setRulePattern] = useState(tx.description);
  const [ruleCategoryId, setRuleCategoryId] = useState(tx.categoryId ?? categories[0]?.id ?? "");
  const [retro, setRetro] = useState(true);

  return (
    <>
      <li>
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/60"
        >
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted min-[375px]:flex">
            {tx.amountCents >= 0 ? (
              <ArrowDownLeft className="h-5 w-5 text-positive" />
            ) : (
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{tx.description}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {dateFmt.format(new Date(tx.date))}
              </span>
              <CategoryBadge name={tx.categoryName} color={tx.categoryColor} />
              {tx.ownerName && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {tx.ownerName}
                </span>
              )}
            </div>
          </div>
          <Money amountCents={tx.amountCents} signed className="shrink-0 text-sm font-semibold" />
        </button>
      </li>

      {open && (
        <DetailsDialog titleId={`tx-title-${tx.id}`} onClose={() => setOpen(false)}>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={`tx-title-${tx.id}`} className="font-semibold">
                {tx.description}
              </h2>
              <p className="text-xs text-muted-foreground">
                {dateFmt.format(new Date(tx.date))} · {tx.accountName ?? "—"}
              </p>
            </div>
            <Money amountCents={tx.amountCents} signed className="shrink-0 font-bold" />
          </div>

          {/* Categoria */}
          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor={`cat-${tx.id}`}>Categoria</Label>
            <select
              id={`cat-${tx.id}`}
              defaultValue={tx.categoryId ?? ""}
              disabled={pending}
              onChange={(e) =>
                startTransition(() => updateCategoryAction(tx.id, e.target.value || null))
              }
              className="h-11 rounded-md border border-input bg-background px-3 text-base"
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pessoa */}
          <div className="mb-4 flex flex-col gap-1.5">
            <Label>Quem gastou</Label>
            <div className="grid grid-cols-3 gap-2">
              <PersonBtn
                active={tx.ownerId === null}
                label="Família"
                pending={pending}
                onClick={() => startTransition(() => updateOwnerAction(tx.id, null))}
              />
              {users.map((u) => (
                <PersonBtn
                  key={u.id}
                  active={tx.ownerId === u.id}
                  label={u.name.split(" ")[0]}
                  pending={pending}
                  onClick={() => startTransition(() => updateOwnerAction(tx.id, u.id))}
                />
              ))}
            </div>
          </div>

          {/* Criar regra */}
          <details className="mb-4 rounded-md border border-border">
            <summary className="cursor-pointer p-3 text-sm font-medium">
              Criar regra a partir desta transação
            </summary>
            <div className="flex flex-col gap-2 p-3 pt-0">
              <Label htmlFor={`rp-${tx.id}`}>Quando a descrição contiver</Label>
              <input
                id={`rp-${tx.id}`}
                value={rulePattern}
                onChange={(e) => setRulePattern(e.target.value)}
                className="h-11 rounded-md border border-input bg-background px-3 text-base"
              />
              <select
                aria-label="Categoria da nova regra"
                value={ruleCategoryId}
                onChange={(e) => setRuleCategoryId(e.target.value)}
                className="h-11 rounded-md border border-input bg-background px-3 text-base"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={retro}
                  onChange={(e) => setRetro(e.target.checked)}
                />
                Aplicar às transações passadas que casam
              </label>
              <Button
                variant="secondary"
                disabled={pending || !rulePattern.trim()}
                onClick={() =>
                  startTransition(async () => {
                    await createRuleFromTransactionAction(rulePattern, ruleCategoryId, retro);
                    setOpen(false);
                  })
                }
              >
                Salvar regra
              </Button>
            </div>
          </details>

          <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" /> Fechar
          </Button>
        </DetailsDialog>
      )}
    </>
  );
}

function PersonBtn({
  active,
  label,
  pending,
  onClick,
}: {
  active: boolean;
  label: string;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={
        "h-11 rounded-md border text-sm font-medium transition-colors " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-foreground")
      }
    >
      {label}
    </button>
  );
}
