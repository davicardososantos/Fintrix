"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    registerAction,
    undefined,
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="householdName">Nome do casal</Label>
            <Input id="householdName" name="householdName" placeholder="Ex.: Casa Davi & Ana" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Seu nome</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="mt-2 w-full" disabled={pending}>
            {pending ? "Criando..." : "Criar conta"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
