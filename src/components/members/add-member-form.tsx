"use client";

import { useActionState, useEffect, useRef } from "react";
import { addMemberAction, type MemberState } from "@/lib/actions/household-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddMemberForm() {
  const [state, action, pending] = useActionState<MemberState, FormData>(addMemberAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="m-name">Nome do(a) cônjuge</Label>
        <Input id="m-name" name="name" placeholder="Ex.: Ana" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="m-email">E-mail</Label>
        <Input id="m-email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="m-password">Senha</Label>
        <Input id="m-password" name="password" type="password" minLength={6} required />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-sm text-positive">Membro adicionado!</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Adicionando..." : "Adicionar ao casal"}
      </Button>
    </form>
  );
}
