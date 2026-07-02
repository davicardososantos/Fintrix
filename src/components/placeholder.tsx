import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Placeholder de telas que serão implementadas em fases seguintes (roadmap). */
export function Placeholder({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <span className="mr-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              {phase}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
      </Card>
    </div>
  );
}
