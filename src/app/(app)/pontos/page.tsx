import { PageHeader } from "@/components/page-header";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddProgramForm } from "@/components/points/add-program-form";
import { ProgramCard } from "@/components/points/program-card";
import { getPointsPrograms } from "@/lib/portfolio";

export default async function PontosPage() {
  const session = await auth();
  const householdId = session!.user.householdId;

  const [programs, users] = await Promise.all([
    getPointsPrograms(householdId),
    prisma.user.findMany({ where: { householdId }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Pontos e milhas"
        description="Seus programas e saldos, organizados em um só lugar."
      />

      {programs.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum programa ainda. Adicione o primeiro abaixo.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar programa</CardTitle>
        </CardHeader>
        <CardContent>
          <AddProgramForm users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
