import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddMemberForm } from "@/components/members/add-member-form";
import { Tags, Users, Plane, TrendingUp } from "lucide-react";

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
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Mais</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" /> Membros da família
          </CardTitle>
        </CardHeader>
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {m.role === "owner" ? "Titular" : "Membro"}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adicionar membro</CardTitle>
          </CardHeader>
          <CardContent>
            <AddMemberForm />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <NavCard href="/pontos" icon={<Plane className="h-5 w-5 text-points" />} title="Pontos" desc="Smiles, Livelo, TudoAzul, LATAM" />
        <NavCard href="/investimentos" icon={<TrendingUp className="h-5 w-5 text-investment" />} title="Investimentos" desc="CDB e outros — acompanhe o rendimento" />
        <NavCard href="/categorias" icon={<Tags className="h-5 w-5 text-primary" />} title="Categorias" desc="Gerenciar categorias e cores" />
      </div>
    </div>
  );
}

function NavCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors active:bg-muted">
        <CardContent className="flex items-center gap-3 pt-6">
          {icon}
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
