import { ImportForm } from "./import-form";
import { PageHeader } from "@/components/page-header";
import { CheckCheck, FileText, Tags } from "lucide-react";

export default function ImportarPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Menos trabalho manual"
        title="Atualize suas finanças."
        description="Traga seus extratos e faturas. O Fintrix reúne os lançamentos para você acompanhar tudo por aqui."
      />
      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ImportForm />
        </div>
        <aside className="rounded-lg border border-border/70 bg-card p-5 sm:p-6">
          <h2 className="mb-5 text-base font-semibold">Como funciona</h2>
          <ol className="space-y-6">
            {[
              {
                icon: FileText,
                title: "Escolha o arquivo",
                text: "C6: extrato e fatura em CSV ou PDF. Nubank: extrato CSV. Alelo: extrato PDF.",
              },
              {
                icon: CheckCheck,
                title: "Confira o resultado",
                text: "Veja quantos lançamentos entraram e quantos já existiam.",
              },
              {
                icon: Tags,
                title: "Revise as categorias",
                text: "Abra as transações para ajustar categorias e pessoas quando precisar.",
              },
            ].map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">
                    {index + 1}. {title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            PDF protegido por senha? Salve uma cópia sem senha antes de enviar.
          </p>
        </aside>
      </div>
    </div>
  );
}
