import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { AddMemberForm } from "@/components/members/add-member-form";
import { Tags, Users, Plane, TrendingUp, Wallet, CalendarClock, ChevronRight } from "lucide-react";

const modules = [
  {
    href: "/contas-a-pagar",
    title: "Contas a pagar",
    desc: "Vencimentos e pagamentos",
    icon: CalendarClock,
    tone: "text-warning bg-warning/10",
  },
  {
    href: "/contas",
    title: "Contas e carteiras",
    desc: "Seus saldos em um só lugar",
    icon: Wallet,
    tone: "text-primary bg-primary/10",
  },
  {
    href: "/investimentos",
    title: "Investimentos",
    desc: "Acompanhe o seu patrimônio",
    icon: TrendingUp,
    tone: "text-investment bg-investment/10",
  },
  {
    href: "/pontos",
    title: "Pontos e milhas",
    desc: "Programas e saldos",
    icon: Plane,
    tone: "text-points bg-points/10",
  },
  {
    href: "/categorias",
    title: "Categorias",
    desc: "Organize seus lançamentos",
    icon: Tags,
    tone: "text-primary bg-primary/10",
  },
];

export default async function MaisPage() {
  const session = await auth();
  const householdId = session!.user.householdId;
  const isOwner = session!.user.role === "owner";
  const members = await prisma.user.findMany({
    where: { householdId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });
  return (
    <div className="page-stack">
      <PageHeader
        title="Tudo no seu lugar."
        description="Explore suas contas, investimentos e programas. Cuide das finanças em família."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {modules.map(({ href, title, desc, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className="interactive-card flex items-center gap-4 rounded-lg border border-border/70 bg-card p-5"
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${tone}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{desc}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Sua família
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Pessoas que compartilham este espaço financeiro
          </p>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/60">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {member.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {member.role === "owner" ? "Titular" : "Membro"}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {isOwner && (
        <details className="rounded-lg border border-border/70 bg-card">
          <summary className="cursor-pointer p-5 text-sm font-semibold">
            Adicionar alguém à família
          </summary>
          <div className="max-w-xl px-5 pb-5">
            <AddMemberForm />
          </div>
        </details>
      )}
    </div>
  );
}
