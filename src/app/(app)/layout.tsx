import { AppNavigation } from "@/components/app-navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

// Layout da área logada: container mobile + espaço para a bottom-nav fixa.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-dvh lg:pl-sidebar">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Ir para o conteúdo
      </a>
      <AppNavigation />
      <div className="safe-top border-b border-border/60 bg-background/90">
        <div className="mx-auto flex max-w-page items-center justify-between gap-3 px-4 py-4 sm:px-8 lg:px-10">
          <Link href="/dashboard" className="lg:hidden">
            <Brand compact />
          </Link>
          <p className="hidden text-sm text-muted-foreground lg:block">
            Seu dinheiro. Seus planos. <span className="font-medium text-foreground">Juntos.</span>
          </p>
          <div className="flex items-center gap-1">
            <span className="mr-3 hidden text-sm font-medium sm:block">
              {session?.user.name?.split(" ")[0]}
            </span>
            <ThemeToggle />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="ghost" size="icon" aria-label="Sair da conta" title="Sair">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-page px-4 pb-32 pt-6 outline-none sm:px-8 sm:pt-8 lg:px-10 lg:pb-12"
      >
        {children}
      </main>
    </div>
  );
}
