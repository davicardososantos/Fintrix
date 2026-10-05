"use client";

import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center sm:py-10">
        <span className="icon-tile">
          <AlertCircle className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold">Não conseguimos carregar esta tela</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Tente novamente para continuar cuidando das suas finanças.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Tentar novamente
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Voltar ao início</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
