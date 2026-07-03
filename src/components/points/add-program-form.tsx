"use client";

import { useActionState, useEffect, useRef } from "react";
import { addPointsProgramAction, type PointsState } from "@/lib/actions/points-actions";
import { Button } from "@/components/ui/button";

export function AddProgramForm({ users }: { users: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<PointsState, FormData>(
    addPointsProgramAction,
    undefined,
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  const cls = "h-11 rounded-md border border-input bg-background px-3 text-base";

  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <select name="name" defaultValue="smiles" className={cls}>
          <option value="smiles">Smiles</option>
          <option value="livelo">Livelo</option>
          <option value="azul">TudoAzul</option>
          <option value="latam">LATAM Pass</option>
        </select>
        <select name="ownerId" defaultValue="casal" className={cls}>
          <option value="casal">Família</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name.split(" ")[0]}
            </option>
          ))}
        </select>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Adicionando..." : "Adicionar programa"}
      </Button>
    </form>
  );
}
