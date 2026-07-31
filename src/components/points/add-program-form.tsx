"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addPointsProgramAction, type PointsState } from "@/lib/actions/points-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POINTS_NAME_MAX, POINTS_OTHER, POINTS_SUGGESTIONS } from "@/lib/points";

export function AddProgramForm({ users }: { users: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<PointsState, FormData>(
    addPointsProgramAction,
    undefined,
  );
  const [preset, setPreset] = useState<string>(POINTS_SUGGESTIONS[0]);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setPreset(POINTS_SUGGESTIONS[0]);
    }
  }, [state]);

  const cls = "h-11 rounded-md border border-input bg-background px-3 text-base";

  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <select
          name="preset"
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          className={cls}
        >
          {POINTS_SUGGESTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
          <option value={POINTS_OTHER}>Outro...</option>
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
      {preset === POINTS_OTHER && (
        <Input
          name="customName"
          autoFocus
          required
          maxLength={POINTS_NAME_MAX}
          placeholder="Nome do programa (ex.: Esfera)"
        />
      )}
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Adicionando..." : "Adicionar programa"}
      </Button>
    </form>
  );
}
