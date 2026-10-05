"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="mt-3 w-full">
      {pending ? <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" /> : null}
      {pending ? "Entrando…" : "Entrar no meu espaço"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </Button>
  );
}
