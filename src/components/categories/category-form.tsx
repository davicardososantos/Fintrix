"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCategoryAction, type CategoryState } from "@/lib/actions/category-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CategoryForm() {
  const [state, action, pending] = useActionState<CategoryState, FormData>(
    createCategoryAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const selectCls = "h-11 rounded-md border border-input bg-background px-3 text-base";

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nova categoria</Label>
        <Input id="name" name="name" placeholder="Ex.: Educação" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select name="kind" defaultValue="expense" className={selectCls}>
          <option value="expense">Gasto</option>
          <option value="income">Renda</option>
          <option value="transfer">Transferência</option>
          <option value="investment">Investimento</option>
        </select>
        <select name="color" defaultValue="primary" className={selectCls}>
          <option value="primary">Verde</option>
          <option value="accent">Turquesa</option>
          <option value="investment">Azul</option>
          <option value="points">Roxo</option>
          <option value="warning">Âmbar</option>
          <option value="muted">Cinza</option>
        </select>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar categoria"}
      </Button>
    </form>
  );
}
