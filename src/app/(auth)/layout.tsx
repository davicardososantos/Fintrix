import {
  ArrowUpRight,
  ChartNoAxesCombined,
  HeartHandshake,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="hero-surface m-5 hidden flex-col justify-between rounded-lg p-10 lg:flex">
        <Brand className="text-hero-foreground [&_span.text-muted-foreground]:text-hero-muted" />
        <div className="relative z-10 my-12 max-w-lg">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-hero-accent/30 px-4 py-2 text-xs text-hero-accent">
            <HeartHandshake className="h-4 w-4" />
            Planos que se constroem juntos
          </span>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Mais clareza.
            <br />
            Mais possibilidades.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-hero-muted">
            Um espaço para organizar o presente e cuidar dos próximos passos da sua família.
          </p>
          <div className="mt-10 space-y-5">
            <Feature icon={WalletCards} text="Contas e vencimentos em um só lugar" />
            <Feature icon={ChartNoAxesCombined} text="Uma visão simples dos seus gastos" />
            <Feature icon={ShieldCheck} text="O controle das finanças nas suas mãos" />
          </div>
        </div>
        <p className="text-sm text-hero-muted">
          Seu dinheiro. Seus planos. Juntos.
          <ArrowUpRight className="ml-2 inline h-4 w-4" />
        </p>
        <svg
          className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 text-hero-accent/10"
          viewBox="0 0 320 320"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="320" cy="320" r="300" stroke="currentColor" />
          <circle cx="320" cy="320" r="240" stroke="currentColor" />
          <circle cx="320" cy="320" r="180" stroke="currentColor" />
        </svg>
      </section>
      <div className="relative flex min-w-0 flex-col justify-center px-5 py-10 sm:px-10">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>
        <div className="page-enter mx-auto w-full max-w-auth">
          <div className="mb-10">
            <Brand />
          </div>
          {children}
          <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
            Um pouco de organização.
            <br />
            Muito mais tranquilidade.
          </p>
        </div>
      </div>
    </main>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof WalletCards; text: string }) {
  return (
    <p className="flex items-center gap-3 text-sm text-hero-foreground">
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-hero-accent/20 bg-hero-accent/10">
        <Icon className="h-5 w-5 text-hero-accent" />
      </span>
      {text}
    </p>
  );
}
