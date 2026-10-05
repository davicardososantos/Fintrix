import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LoginSubmit } from "@/components/login-submit";
import { PasswordInput } from "@/components/password-input";

async function loginAction(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardContent className="p-0 sm:p-0">
        <h1 className="text-3xl font-semibold tracking-tight">Bom ter você aqui.</h1>
        <p className="mb-8 mt-3 text-sm text-muted-foreground">
          Entre para acompanhar as finanças de vocês.
        </p>
        <form action={loginAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              required
            />
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              E-mail ou senha inválidos. Confira os dados e tente novamente.
            </p>
          )}
          <LoginSubmit />
        </form>
      </CardContent>
    </Card>
  );
}
